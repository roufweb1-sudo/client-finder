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
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: CONTACT.site,
    siteName: CONTACT.brand,
    title: "AI Client Finder – find local businesses that need a website",
    description: "Find leads, check their websites, and pitch them on WhatsApp in minutes.",
  },
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
