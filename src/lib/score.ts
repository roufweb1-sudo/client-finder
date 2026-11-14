import type { Business, SiteCheck } from "./types";

export type Heat = "hot" | "warm" | "cold";

export type LeadScore = {
  score: number; // 0-100
  heat: Heat;
  reason: string;
};

/**
 * Hot-lead score: how likely this business needs (and can pay for) a website.
 * - No website / only social media → strongest signal
 * - Website broken or very slow → strong signal
 * - Popular businesses (many reviews) get a bonus: they have customers and budget
 */
export function scoreLead(b: Business, check?: SiteCheck | null): LeadScore {
  let base: number;
  let reason: string;

  if (b.websiteStatus === "none") {
    base = 80;
    reason = "No website";
  } else if (b.websiteStatus === "social") {
    base = 70;
    reason = "Only a social media page";
  } else if (check && !check.reachable) {
    base = 75;
    reason = "Website not loading";
  } else if (check && check.performance !== null && check.performance < 50) {
    base = 60;
    reason = `Slow website (mobile score ${check.performance})`;
  } else if (check && check.performance !== null && check.performance < 75) {
    base = 40;
    reason = `Website could be faster (mobile score ${check.performance})`;
  } else if (check) {
    base = 15;
    reason = "Website looks fine";
  } else {
    base = 30;
    reason = "Has a website (not checked yet)";
  }

  // Popularity bonus: up to +20
  const reviews = b.reviews || 0;
  const bonus = reviews >= 1000 ? 20 : reviews >= 300 ? 14 : reviews >= 100 ? 8 : reviews >= 20 ? 4 : 0;

  const score = Math.min(100, base + bonus);
  const heat: Heat = score >= 75 ? "hot" : score >= 50 ? "warm" : "cold";
  return { score, heat, reason };
}

/** Turn a phone number into a wa.me-friendly number (India default). */
export function whatsappNumber(b: Pick<Business, "phone" | "intlPhone">): string | null {
  const raw = b.intlPhone || b.phone;
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (b.intlPhone) return digits.length >= 10 ? digits : null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return "91" + digits;
  return digits.length > 10 ? digits : null;
}

/** Simple pitch template (AI-written pitches come in a later version). */
export function pitchMessage(b: Business, check?: SiteCheck | null, myName = "[Your Name]"): string {
  const hello = `Hi ${b.name} team,\n\nI'm ${myName}, a website developer.`;
  let middle: string;
  if (b.websiteStatus === "none") {
    middle = `I came across your business on Google Maps${b.reviews ? ` – ${b.reviews.toLocaleString("en-IN")} reviews, that's amazing!` : "."} I noticed you don't have a website yet. A simple website with your products, location and a WhatsApp order button can bring in customers who search online.`;
  } else if (b.websiteStatus === "social") {
    middle = `I saw your page on Google Maps and noticed your link goes to social media only. A proper website builds trust and shows up when people search on Google.`;
  } else if (check && !check.reachable) {
    middle = `I tried opening your website (${b.website}) and it isn't loading right now – you may be losing customers who click it from Google.`;
  } else if (check && check.performance !== null && check.performance < 75) {
    middle = `I checked your website on mobile and it scores ${check.performance}/100 on Google's speed test${check.lcp ? ` (main content takes ${check.lcp} to appear)` : ""}. Most customers leave a slow site within a few seconds.`;
  } else {
    middle = `I had a look at your website and have a few ideas to bring you more enquiries from it.`;
  }
  return `${hello}\n\n${middle}\n\nCan I share a free sample design for you? No obligation.`;
}
