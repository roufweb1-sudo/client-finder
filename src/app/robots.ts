import type { MetadataRoute } from "next";
import { CONTACT } from "@/lib/site";

// Tells search engines what they may read. The app pages behind login are closed off.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/leads", "/settings", "/report/", "/login", "/plans"],
    },
    sitemap: `${CONTACT.site}/sitemap.xml`,
  };
}
