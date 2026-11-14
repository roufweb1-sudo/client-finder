import type { Lead } from "./types";

export type CheckState = "pass" | "warn" | "fail" | "unknown";

export type CheckItem = {
  label: string;
  state: CheckState;
  detail: string;
  points: number; // earned
  max: number;
};

export type Presence = {
  score: number; // 0-100
  grade: "Good" | "Needs work" | "Poor";
  items: CheckItem[];
  recommendations: string[];
};

export function presenceReport(lead: Lead): Presence {
  const c = lead.siteCheck ?? null;
  const items: CheckItem[] = [];
  const recs: string[] = [];
  const hasSite = lead.websiteStatus === "website";

  // 1. Website exists
  if (lead.websiteStatus === "none") {
    items.push({
      label: "Own website",
      state: "fail",
      detail: "No website is linked on your Google Business profile.",
      points: 0,
      max: 25,
    });
    recs.push(
      "Create a simple, fast website with your services, photos, location and a WhatsApp / call button.",
    );
  } else if (lead.websiteStatus === "social") {
    items.push({
      label: "Own website",
      state: "warn",
      detail:
        "Your Google profile links to a social media page, not a website.",
      points: 8,
      max: 25,
    });
    recs.push(
      "Get your own website. Social pages don't rank on Google searches and look less trustworthy to new customers.",
    );
  } else {
    items.push({
      label: "Own website",
      state: "pass",
      detail: "A website is linked on your Google Business profile.",
      points: 25,
      max: 25,
    });
  }

  if (!hasSite) {
    items.push({
      label: "Website quality (speed, security, mobile, Google SEO)",
      state: "fail",
      detail:
        "Can't be measured without a website, and without one you don't appear in Google search results for your services.",
      points: 0,
      max: 55,
    });
  } else {
    // 2. Loads
    if (hasSite) {
      if (!c)
        items.push({
          label: "Website opens",
          state: "unknown",
          detail: "Not checked yet.",
          points: 0,
          max: 10,
        });
      else if (!c.reachable) {
        items.push({
          label: "Website opens",
          state: "fail",
          detail: "The website did not open when we tested it.",
          points: 0,
          max: 10,
        });
        recs.push(
          "Fix the website so it opens. Customers clicking it from Google currently see an error.",
        );
      } else
        items.push({
          label: "Website opens",
          state: "pass",
          detail: "The website opens correctly.",
          points: 10,
          max: 10,
        });
    } else {
      items.push({
        label: "Website opens",
        state: "fail",
        detail: "No website to open.",
        points: 0,
        max: 10,
      });
    }

    // 3. Speed
    if (hasSite && c?.reachable && c.performance !== null) {
      const p = c.performance;
      const lcp = c.lcp ? ` Main content appears in ${c.lcp}.` : "";
      if (p >= 75)
        items.push({
          label: "Speed on mobile",
          state: "pass",
          detail: `Google speed score ${p}/100.${lcp}`,
          points: 15,
          max: 15,
        });
      else if (p >= 50) {
        items.push({
          label: "Speed on mobile",
          state: "warn",
          detail: `Google speed score ${p}/100.${lcp}`,
          points: 8,
          max: 15,
        });
        recs.push(
          "Speed up the website on mobile (compress images, remove heavy plugins, use better hosting). Slow sites lose visitors in seconds.",
        );
      } else {
        items.push({
          label: "Speed on mobile",
          state: "fail",
          detail: `Google speed score ${p}/100.${lcp}`,
          points: 0,
          max: 15,
        });
        recs.push(
          "The website is very slow on mobile. Most visitors leave before it loads. A speed fix or a lighter rebuild is recommended.",
        );
      }
    } else {
      items.push({
        label: "Speed on mobile",
        state: hasSite ? "unknown" : "fail",
        detail: hasSite ? "Could not be measured." : "No website to measure.",
        points: 0,
        max: 15,
      });
    }

    // 4. HTTPS
    if (hasSite && c?.reachable) {
      if (c.https)
        items.push({
          label: "Secure (HTTPS)",
          state: "pass",
          detail: "The website uses a secure connection.",
          points: 10,
          max: 10,
        });
      else {
        items.push({
          label: "Secure (HTTPS)",
          state: "fail",
          detail: "Browsers show a 'Not secure' warning.",
          points: 0,
          max: 10,
        });
        recs.push(
          "Add an SSL certificate (HTTPS) so browsers stop showing a 'Not secure' warning.",
        );
      }
    } else
      items.push({
        label: "Secure (HTTPS)",
        state: hasSite ? "unknown" : "fail",
        detail: hasSite ? "Not checked." : "No website.",
        points: 0,
        max: 10,
      });

    // 5. Mobile friendly
    if (hasSite && c?.reachable && c.mobileFriendly !== null) {
      if (c.mobileFriendly)
        items.push({
          label: "Mobile-friendly",
          state: "pass",
          detail: "The layout adapts to phone screens.",
          points: 10,
          max: 10,
        });
      else {
        items.push({
          label: "Mobile-friendly",
          state: "fail",
          detail: "The layout is not set up for phone screens.",
          points: 0,
          max: 10,
        });
        recs.push(
          "Make the website mobile-friendly. Most of your customers browse on phones.",
        );
      }
    } else
      items.push({
        label: "Mobile-friendly",
        state: hasSite ? "unknown" : "fail",
        detail: hasSite ? "Not checked." : "No website.",
        points: 0,
        max: 10,
      });

    // 6. SEO basics
    if (hasSite && c?.reachable && c.seo !== null) {
      if (c.seo >= 80 && c.metaDescription !== false)
        items.push({
          label: "Google SEO basics",
          state: "pass",
          detail: `SEO score ${c.seo}/100.`,
          points: 10,
          max: 10,
        });
      else {
        items.push({
          label: "Google SEO basics",
          state: "warn",
          detail: `SEO score ${c.seo}/100${c.metaDescription === false ? ", no description for Google results" : ""}.`,
          points: 5,
          max: 10,
        });
        recs.push(
          "Improve basic SEO (page titles, descriptions, headings) so you appear higher when people search on Google.",
        );
      }
    } else
      items.push({
        label: "Google SEO basics",
        state: hasSite ? "unknown" : "fail",
        detail: hasSite
          ? "Not checked."
          : "Without a website you can't rank in Google search results.",
        points: 0,
        max: 10,
      });
  }

  // 7. Rating
  if (lead.rating !== null) {
    const good = lead.rating >= 4.0;
    items.push({
      label: "Google rating",
      state: good ? "pass" : "warn",
      detail: `${lead.rating} average rating on Google.`,
      points: good ? 10 : 4,
      max: 10,
    });
    if (!good)
      recs.push(
        "Work on your Google rating: ask happy customers for reviews and reply to every review.",
      );
  } else {
    items.push({
      label: "Google rating",
      state: "fail",
      detail: "No rating yet.",
      points: 0,
      max: 10,
    });
    recs.push(
      "Start collecting Google reviews. Send happy customers your review link on WhatsApp.",
    );
  }

  // 8. Reviews
  const r = lead.reviews || 0;
  if (r >= 100)
    items.push({
      label: "Number of reviews",
      state: "pass",
      detail: `${r.toLocaleString("en-IN")} reviews. Customers clearly trust you.`,
      points: 10,
      max: 10,
    });
  else if (r >= 20)
    items.push({
      label: "Number of reviews",
      state: "warn",
      detail: `${r} reviews.`,
      points: 6,
      max: 10,
    });
  else {
    items.push({
      label: "Number of reviews",
      state: "fail",
      detail: `${r} reviews.`,
      points: 2,
      max: 10,
    });
    recs.push(
      "Get more Google reviews. Businesses with 100+ reviews win far more clicks.",
    );
  }

  if (hasSite && !recs.length)
    recs.push(
      "Your online presence is in good shape. Small improvements like a booking button or fresh photos can still bring more enquiries.",
    );
  if (lead.reviews >= 100 && lead.websiteStatus !== "website")
    recs.unshift(
      `You already have ${lead.reviews.toLocaleString("en-IN")} Google reviews. That's a strong reputation, but customers who want to know more have nowhere to go online.`,
    );

  const score = items.reduce((a, i) => a + i.points, 0);
  const grade = score >= 75 ? "Good" : score >= 50 ? "Needs work" : "Poor";
  return { score, grade, items, recommendations: recs };
}
