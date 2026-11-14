import type { Metadata } from "next";
import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Finder – find businesses that need a website",
  description: "Find local businesses with no website or a slow website, and pitch them on WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 font-sans text-slate-900">
        <Suspense fallback={<div className="h-[57px] border-b border-slate-200 bg-white print:hidden" />}>
          <Nav />
        </Suspense>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Suspense fallback={<p className="py-20 text-center text-slate-400">Loading…</p>}>
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </main>
      </body>
    </html>
  );
}
