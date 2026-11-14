import { consume, refund } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";
import type { SiteCheck } from "@/lib/types";

const cache = new Map<string, SiteCheck>();

// Opens the page; returns its HTML (first 300 KB) if it loads, or null if it doesn't.
async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" },
    });
    if (res.status >= 500) return null;
    const text = await res.text();
    return text.slice(0, 300_000);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return Response.json({ error: "GOOGLE_API_KEY is missing. Add it to the .env.local file and restart the app." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };
  let url = (body.url || "").trim();
  if (!url) return Response.json({ error: "No website to check." }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = "http://" + url;

  const cached = cache.get(url);
  if (cached) return Response.json(cached);

  const blocked = await consume(userId, "checks");
  if (blocked) return blocked;

  const html = await fetchPage(url);
  const reachable = html !== null;
  const result: SiteCheck = {
    url,
    reachable,
    https: url.toLowerCase().startsWith("https://"),
    performance: null,
    seo: null,
    lcp: null,
    mobileFriendly: null,
    metaDescription: null,
    issues: [],
    checkedAt: new Date().toISOString(),
  };

  if (!reachable) {
    result.issues.push("Website does not open (customers clicking from Google see an error)");
    cache.set(url, result);
    return Response.json(result);
  }

  const psi = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psi.searchParams.set("url", url);
  psi.searchParams.set("strategy", "mobile");
  psi.searchParams.append("category", "performance");
  psi.searchParams.append("category", "seo");
  psi.searchParams.set("key", key);

  try {
    const res = await fetch(psi, { signal: AbortSignal.timeout(60000) });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || "PageSpeed check failed");

    const lh = json.lighthouseResult;
    const perf = lh?.categories?.performance?.score;
    const seo = lh?.categories?.seo?.score;
    result.performance = typeof perf === "number" ? Math.round(perf * 100) : null;
    result.seo = typeof seo === "number" ? Math.round(seo * 100) : null;
    result.lcp = lh?.audits?.["largest-contentful-paint"]?.displayValue || null;
    const finalUrl: string = lh?.finalDisplayedUrl || lh?.finalUrl || url;
    result.https = finalUrl.toLowerCase().startsWith("https://");

    if (result.performance !== null && result.performance < 50) result.issues.push(`Very slow on mobile (speed score ${result.performance}/100)`);
    else if (result.performance !== null && result.performance < 75) result.issues.push(`Slow on mobile (speed score ${result.performance}/100)`);
    if (result.lcp) {
      const secs = parseFloat(result.lcp);
      if (!isNaN(secs) && secs > 4) result.issues.push(`Main content takes ${result.lcp} to appear`);
    }
    if (!result.https) result.issues.push("Not secure (no HTTPS) – browsers show a warning");
    // Newer Lighthouse versions may not report these, so fall back to reading the page HTML
    const viewport = lh?.audits?.viewport?.score;
    result.mobileFriendly = typeof viewport === "number" ? viewport === 1 : html ? /<meta[^>]+name=["']?viewport/i.test(html) : null;
    const meta = lh?.audits?.["meta-description"]?.score;
    result.metaDescription = typeof meta === "number" ? meta === 1 : html ? /<meta[^>]+name=["']?description["']?[^>]*content=["'][^"']{10,}/i.test(html) || /<meta[^>]+content=["'][^"']{10,}["'][^>]*name=["']?description/i.test(html) : null;
    if (result.mobileFriendly === false) result.issues.push("Not mobile-friendly (no mobile viewport)");
    if (result.seo !== null && result.seo < 80) result.issues.push(`Weak Google SEO basics (SEO score ${result.seo}/100)`);
    if (result.metaDescription === false) result.issues.push("Missing description for Google search results");
  } catch (e) {
    await refund(userId, "checks");
    result.issues.push(`Could not run speed test: ${(e as Error).message}`);
  }

  cache.set(url, result);
  return Response.json(result);
}
