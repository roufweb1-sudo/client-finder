import Link from "next/link";
import Icon from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { CONTACT } from "@/lib/site";

const legal = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund", label: "Refund & cancellation" },
  { href: "/contact", label: "Contact us" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight text-slate-900">
              <span className="text-violet-600">AI</span> Client Finder
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
            Find local businesses that need a website, see what is wrong with the one they have, and send a ready pitch on WhatsApp.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="hover:text-violet-700">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-violet-700">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-violet-700">
                Log in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-violet-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-violet-700">
                <Icon name="mail" className="h-4 w-4 text-violet-500" />
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT.phoneE164}`} className="flex items-center gap-2 hover:text-violet-700">
                <Icon name="phone" className="h-4 w-4 text-violet-500" />
                {CONTACT.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CONTACT.legalName}. All rights reserved.
          </p>
          <p>{CONTACT.addressLine}</p>
        </div>
      </div>
    </footer>
  );
}
