import { consume, refund } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";
import type { Business, WebsiteStatus } from "@/lib/types";

// Only the fields we show. Fewer fields = cheaper Google billing tier.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "fb.com", "wa.me", "whatsapp.com", "linktr.ee", "youtube.com", "justdial.com"];

// Simple in-memory cache so repeated searches don't cost money again (resets when the server restarts).
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();

function websiteStatus(url?: string): WebsiteStatus {
  if (!url) return "none";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith("." + s))) return "social";
  } catch {
    return "none";
  }
  return "website";
}

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
};

export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return Response.json({ error: "GOOGLE_API_KEY is missing. Add it to the .env.local file and restart the app." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { query?: string; pageToken?: string };
  const query = (body.query || "").trim();
  if (query.length < 3) {
    return Response.json({ error: "Type a business type and a city, e.g. \"bakeries in Kochi\"." }, { status: 400 });
  }

  const cacheKey = `${query.toLowerCase()}|${body.pageToken || ""}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return Response.json({ ...(hit.data as object), cached: true });
  }

  // Counts toward the monthly plan limit (cached results above are free)
  const blocked = await consume(userId, "searches");
  if (blocked) return blocked;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      regionCode: "IN",
      ...(body.pageToken ? { pageToken: body.pageToken } : {}),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    await refund(userId, "searches");
    const message = json?.error?.message || "Google search failed.";
    return Response.json({ error: message }, { status: res.status });
  }

  const places: GooglePlace[] = json.places || [];
  const businesses: Business[] = places
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text || "Unknown",
      address: p.formattedAddress || "",
      phone: p.nationalPhoneNumber || null,
      intlPhone: p.internationalPhoneNumber || null,
      website: p.websiteUri || null,
      websiteStatus: websiteStatus(p.websiteUri),
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? 0,
      mapsUrl: p.googleMapsUri || null,
    }));

  const data = { businesses, nextPageToken: json.nextPageToken || null };
  cache.set(cacheKey, { at: Date.now(), data });
  return Response.json(data);
}
