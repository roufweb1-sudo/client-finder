"use client";

import Image from "next/image";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { KIND_LABEL, LIMITS, PRICES } from "@/lib/plans";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "search",
    title: "Search a city",
    body: "Pick a business type and a place — bakeries in Kochi, dentists in Kozhikode. You get up to 20 real businesses from Google Maps with phone numbers.",
  },
  {
    icon: "chart",
    title: "See who needs you",
    body: "Every lead gets a score. No website, social page only, site not loading or slow on mobile — the hottest ones rise to the top.",
  },
  {
    icon: "chat",
    title: "Pitch on WhatsApp",
    body: "Open a written-for-you message in English, Malayalam or Manglish, edit a line if you like, and send it straight to the owner.",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "bolt", title: "Real website checks", body: "We open each site and run Google's mobile speed test, then list the exact problems you can fix." },
  { icon: "doc", title: "Branded audit report", body: "A clean one-page report with your name, logo and phone number on it. Print it or save it as a PDF." },
  { icon: "spark", title: "AI pitch writer", body: "Pitches that mention the real problem on that business's site, not a copy-paste template." },
  { icon: "globe", title: "Three languages", body: "English, മലയാളം and Manglish, in a friendly or a professional tone." },
  { icon: "sliders", title: "Lead tracker", body: "Move leads through new, contacted, replied and won. Set a follow-up date so nothing is forgotten." },
  { icon: "download", title: "Export anytime", body: "Your leads are yours. Download the whole list as a CSV whenever you want." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Where do the businesses come from?",
    a: "From Google Maps, through Google's official Places API. You see the same public details a customer would see: name, address, phone, rating and website link.",
  },
  {
    q: "Do I need to pay to try it?",
    a: `No. A free account gives you ${LIMITS.free.searches} searches, ${LIMITS.free.pitches} AI pitches and ${LIMITS.free.checks} website checks every month. No card is asked for.`,
  },
  {
    q: "Does it send the WhatsApp messages for me?",
    a: "No, and that is on purpose. The app writes the message and opens WhatsApp with it ready. You read it, change what you like, and press send yourself.",
  },
  {
    q: "Can I use it outside Kerala or outside India?",
    a: "Yes. Any city that Google Maps covers works. The Malayalam and Manglish pitches are there if you need them, but English works everywhere.",
  },
  {
    q: "What happens when my plan ends?",
    a: "You go back to the free limits. Nothing is deleted — your saved leads, notes and branding stay in your account.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Plans are one-time payments for a fixed period, so nothing renews on its own and there is nothing to cancel. You simply stop paying.",
  },
];

function SampleCard() {
  return (
    <div className="animate-fade-up delay-3 min-w-0 rounded-2xl bg-white p-4 shadow-xl shadow-violet-900/10 ring-1 ring-violet-100 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Example lead</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
          <Icon name="flame" className="h-3.5 w-3.5" />
          Hot 92
        </span>
      </div>
      <Image
        src="/example-bakery.webp"
        alt=""
        width={800}
        height={360}
        sizes="(min-width: 1024px) 475px, 85vw"
        className="mt-3 aspect-[20/9] w-full rounded-xl object-cover"
      />
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-900">
        <Icon name="search" className="size-4 shrink-0 text-violet-600" />
        Bakeries in Kochi
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">Green Leaf Bakery</h3>
      <p className="text-sm text-slate-500">MG Road, Kochi, Kerala</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-red-50 px-2 py-1 font-medium text-red-700">No website</span>
        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1 font-medium text-slate-600">
          <Icon name="star" className="h-3.5 w-3.5 text-amber-500" />
          4.6 · 318 reviews
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1 font-medium text-slate-600">
          <Icon name="phone" className="h-3.5 w-3.5 text-violet-500" />
          Phone listed
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-100">
        <span className="font-medium text-slate-800">Your pitch: </span>
        Hi Green Leaf Bakery team, I noticed you have 318 reviews but no website yet. A simple site with your menu and a WhatsApp order button would bring in the customers searching online…
      </div>

    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-14 pb-5 sm:space-y-20 sm:pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-linear-to-br from-white via-white to-violet-50 px-4 py-7 sm:px-8 sm:py-10 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 size-48 rounded-full sm:size-72 bg-violet-300/30 blur-3xl"
        />
        <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
              <Icon name="spark" className="h-3.5 w-3.5" />
              Built for freelance website developers
            </span>
            <h1 className="animate-fade-up delay-1 mt-5 text-[clamp(1.95rem,6vw,3.25rem)] font-bold leading-[1.12] tracking-tight text-balance text-slate-900">
              Find local businesses that <span className="text-violet-600">need a website</span> — today
            </h1>
            <p className="animate-fade-up delay-2 mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Find local businesses that need a new or better website. See what you can improve and draft a WhatsApp pitch around it.
            </p>
            <div className="animate-fade-up delay-3 mt-6 grid gap-3 min-[420px]:flex min-[420px]:flex-wrap">
              <Link
                href="/login"
                className="btn-shine inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:bg-violet-700 hover:-translate-y-0.5"
              >
                Start free
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="#how"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-white"
              >
                See how it works
              </Link>
            </div>
            <p className="animate-fade-up delay-4 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4 text-violet-600" />
                No card needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4 text-violet-600" />
                {LIMITS.free.searches} free searches a month
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4 text-violet-600" />
                Works in any city
              </span>
            </p>
          </div>
          <div className="relative isolate min-w-0 overflow-hidden rounded-2xl bg-violet-100 shadow-xl shadow-violet-900/15 ring-1 ring-violet-200">
            <Image
              src="/freelance-developer.webp"
              alt="Freelance website developer working at a laptop"
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 85vw, 92vw"
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">From search to outreach</h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className={`animate-fade-up delay-${i + 1} relative rounded-2xl border border-violet-100 bg-white p-5 sm:p-6`}>
              {i < STEPS.length - 1 && (
                <Icon name="arrow" className="absolute -right-6 top-9 z-10 hidden size-6 rounded-full bg-violet-50 p-1 text-violet-700 md:block" />
              )}
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-6 rounded-3xl border border-violet-100 bg-violet-50/70 p-5 sm:p-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">See what makes a lead worth contacting</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
            Check the website status, reviews and contact details before deciding who to pitch. Start your message with something specific you can improve.
          </p>
        </div>
        <SampleCard />
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tools for finding and following up with leads</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`animate-fade-up delay-${(i % 3) + 1} group rounded-2xl bg-white p-6 ring-1 ring-slate-200 transition-shadow hover:shadow-lg hover:shadow-violet-900/5`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Plans and monthly allowances</h2>
          <p className="mt-3 text-slate-600">Start free and upgrade when you need more searches, website checks, or pitches.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="animate-fade-up rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-900">Free</h3>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">₹0</p>
            <p className="mt-1 text-sm text-slate-500">To see if the leads are any good.</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {(Object.keys(LIMITS.free) as (keyof typeof LIMITS.free)[]).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <span>
                    {LIMITS.free[k]} {KIND_LABEL[k].toLowerCase()} a month
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                <span>Lead tracker and CSV export</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="mt-7 block rounded-xl px-5 py-3 text-center font-semibold text-slate-800 ring-1 ring-slate-300 transition-colors hover:bg-slate-50"
            >
              Create a free account
            </Link>
          </div>

          <div className="animate-fade-up delay-2 relative rounded-2xl bg-slate-900 p-5 text-white ring-1 ring-slate-900">
            <h3 className="flex items-center gap-2 font-semibold"><Icon name="crown" className="size-5 text-violet-300" /> Pro</h3>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {PRICES.monthly.perMonth}
              <span className="text-base font-medium text-slate-400"> / month</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              or {PRICES.yearly.label} — about {PRICES.yearly.perMonth} a month
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {(Object.keys(LIMITS.pro) as (keyof typeof LIMITS.pro)[]).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  <span>
                    {LIMITS.pro[k].toLocaleString("en-IN")} {KIND_LABEL[k].toLowerCase()} a month
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <span>Branded audit reports with your logo</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <span>Pitches in English, മലയാളം and Manglish</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="btn-shine mt-7 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Start free, upgrade later
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">Payments are handled by Razorpay. No auto-renewal.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Questions people ask</h2>
        </div>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                {f.q}
                <Icon name="arrow" className="h-4 w-4 shrink-0 rotate-90 text-slate-400 transition-transform group-open:-rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-violet-600/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-white">Find your first lead</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Choose a city and a business type to get started.</p>
          <Link
            href="/login"
            className="btn-shine mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform hover:bg-violet-500 hover:-translate-y-0.5"
          >
            Start free
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
