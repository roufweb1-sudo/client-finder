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
export type PitchTone = "friendly" | "professional";
export type PitchGoal = "website" | "report";
