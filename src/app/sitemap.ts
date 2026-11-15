import type { MetadataRoute } from "next";
import { CONTACT } from "@/lib/site";

// The public pages we want Google to list.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1 },
    { path: "/contact", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/refund", priority: 0.3 },
  ];
  return pages.map((p) => ({
    url: `${CONTACT.site}${p.path}`,
    changeFrequency: "monthly" as const,
    priority: p.priority,
  }));
}
