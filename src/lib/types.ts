export type WebsiteStatus = "none" | "social" | "website";

export type Business = {
  id: string;
  name: string;
  address: string;
  phone: string | null; // as shown, e.g. "081398 34984"
  intlPhone: string | null; // e.g. "+91 81398 34984"
  website: string | null;
  websiteStatus: WebsiteStatus;
  rating: number | null;
  reviews: number;
  mapsUrl: string | null;
};

export type SiteCheck = {
  url: string;
  reachable: boolean;
  https: boolean;
  performance: number | null; // 0-100 mobile score
  seo: number | null; // 0-100
  lcp: string | null; // e.g. "9.7 s"
  mobileFriendly: boolean | null;
  metaDescription: boolean | null;
  issues: string[];
  checkedAt: string;
};

export type LeadStatus = "New" | "Contacted" | "Replied" | "Won" | "Lost";

export type Lead = Business & {
  status: LeadStatus;
  /** Typed in by the user - Google Maps never gives an email address. */
  email?: string | null;
  followUp: string | null; // YYYY-MM-DD
  notes: string;
  savedAt: string;
  searchQuery: string;
  siteCheck?: SiteCheck | null;
};

export type Profile = {
  name: string; // freelancer's name, used in pitches and reports
  brand: string; // business / brand name
  phone: string; // WhatsApp number shown on reports
  email: string;
  logo: string; // data URL (small image)
};

export type PitchLanguage = "english" | "malayalam" | "manglish";
/** Where the message is going to be sent. Changes the shape, not just the wording. */
export type PitchChannel = "whatsapp" | "email";
export type PitchTone = "friendly" | "professional";
export type PitchGoal = "website" | "report";

/** Which message in the follow-up sequence to write. */
export type FollowUpStep = "nudge" | "value" | "last";
