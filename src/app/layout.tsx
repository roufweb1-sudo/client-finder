import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PageLoader from "@/components/PageLoader";
import { CONTACT } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(CONTACT.site),
  title: {
    default: "AI Client Finder – find local businesses that need a website",
    template: "%s · AI Client Finder",
  },
  description:
    "Search any city for businesses with no website or a slow one, score the hottest leads, and send an AI-written pitch on WhatsApp. Built for web freelancers.",
  applicationName: CONTACT.brand,
  alternates: { canonical: "/" },
  keywords: [
    "find website clients",
    "leads for web designers",
    "businesses without a website",
    "freelance web design leads",
    "cold outreach WhatsApp",
    "local business leads India",
  ],
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: CONTACT.site,
    siteName: CONTACT.brand,
    title: "AI Client Finder – find local businesses that need a website",
    description: "Find leads, check their websites, and pitch them on WhatsApp in minutes.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Client Finder – find local businesses that need a website",
    description: "Find leads, check their websites, and pitch them on WhatsApp in minutes.",
  },
};

/** Tells Google what this site is, so it can show richer search results. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${CONTACT.site}/#organization`,
      name: CONTACT.legalName,
      url: CONTACT.site,
      logo: `${CONTACT.site}/icon.svg`,
      email: CONTACT.email,
      telephone: CONTACT.phoneE164,
      address: { "@type": "PostalAddress", addressLocality: "Areekode", addressRegion: "Kerala", postalCode: "673639", addressCountry: "IN" },
    },
    {
      "@type": "WebSite",
      "@id": `${CONTACT.site}/#website`,
      url: CONTACT.site,
      name: CONTACT.brand,
      publisher: { "@id": `${CONTACT.site}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: CONTACT.brand,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      url: CONTACT.site,
      description:
        "Find local businesses with no website or a slow one, score them as leads, and send an AI-written pitch on WhatsApp.",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "INR" },
        { "@type": "Offer", name: "Pro monthly", price: "299", priceCurrency: "INR" },
        { "@type": "Offer", name: "Pro yearly", price: "1999", priceCurrency: "INR" },
      ],
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://cmchgujlhucjlkvfsoys.supabase.co" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      </head>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Suspense fallback={<div className="h-[61px] border-b border-slate-200 bg-white print:hidden" />}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-7">
          <Suspense fallback={<PageLoader />}>
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </main>
        <Footer />
      </body>
    </html>
  );
}
