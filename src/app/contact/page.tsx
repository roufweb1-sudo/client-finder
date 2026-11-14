import type { Metadata } from "next";
import Icon from "@/components/Icon";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Talk to the team behind AI Client Finder. Email ${CONTACT.email} or call ${CONTACT.phoneDisplay}.`,
};

const WAYS = [
  {
    icon: "mail" as const,
    title: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    note: "Best for account, billing and refund questions. We reply within 2 working days.",
  },
  {
    icon: "chat" as const,
    title: "WhatsApp",
    value: CONTACT.phoneDisplay,
    href: `https://wa.me/${CONTACT.whatsapp}`,
    note: "Quick questions about how something works.",
  },
  {
    icon: "phone" as const,
    title: "Phone",
    value: CONTACT.phoneDisplay,
    href: `tel:${CONTACT.phoneE164}`,
    note: "Monday to Saturday, during business hours (IST).",
  },
];

export default function ContactPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-3xl py-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact us</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        A real person reads every message. Tell us what you are stuck on and we will get back to you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {WAYS.map((w, i) => (
          <a
            key={w.title}
            href={w.href}
            target={w.href.startsWith("http") ? "_blank" : undefined}
            rel={w.href.startsWith("http") ? "noreferrer" : undefined}
            className={`animate-fade-up delay-${i + 1} group rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition-shadow hover:shadow-lg hover:shadow-violet-900/5`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
              <Icon name={w.icon} className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-900">{w.title}</h2>
            <p className="mt-1 break-words text-sm font-medium text-violet-700">{w.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{w.note}</p>
          </a>
        ))}
      </div>

      <div className="animate-fade-up delay-4 mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Service</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{CONTACT.brand}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Operated by</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{CONTACT.legalName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Address</dt>
            <dd className="mt-0.5 flex items-start gap-2 font-medium text-slate-900">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              {CONTACT.addressLine}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-slate-500">
          Looking for our <a href="/privacy" className="font-medium text-violet-700 hover:underline">privacy policy</a>,{" "}
          <a href="/terms" className="font-medium text-violet-700 hover:underline">terms of service</a> or{" "}
          <a href="/refund" className="font-medium text-violet-700 hover:underline">refund policy</a>?
        </p>
      </div>
    </div>
  );
}
