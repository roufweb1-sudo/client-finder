"use client";

import Icon from "@/components/Icon";
import { gmailLink, looksLikeEmail, mailtoLink, waLink } from "@/lib/send";
import type { PitchChannel } from "@/lib/types";
import { useState } from "react";

type Props = {
  channel: PitchChannel;
  /** The message body. For email this is the body only, without the subject. */
  text: string;
  subject: string;
  onSubjectChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  /** WhatsApp number, or null when the listing has no mobile number. */
  wa: string | null;
  loading: boolean;
  onRegenerate: () => void;
  /** Fired when the message is handed over to WhatsApp or to a mail app. */
  onSent?: () => void;
};

export default function MessageActions({ channel, text, subject, onSubjectChange, email, onEmailChange, wa, loading, onRegenerate, onSent }: Props) {
  const [copied, setCopied] = useState(false);
  const ready = !!text && !loading;
  const to = email.trim();
  const canMail = ready && looksLikeEmail(to);

  async function copy() {
    await navigator.clipboard.writeText(channel === "email" && subject ? `Subject: ${subject}\n\n${text}` : text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {channel === "email" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Their email</span>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="name@business.com"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Subject</span>
            <input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder={loading ? "" : "Subject line"}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <Icon name="refresh" className="h-4 w-4" />
          Try another
        </button>
        <button onClick={copy} disabled={!ready} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50 disabled:opacity-50">
          {copied ? "Copied" : "Copy"}
        </button>

        {channel === "email" ? (
          <>
            <a
              href={canMail ? mailtoLink(to, subject, text) : undefined}
              onClick={() => onSent?.()}
              aria-disabled={!canMail}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50 ${canMail ? "" : "pointer-events-none opacity-50"}`}
            >
              <Icon name="mail" className="h-4 w-4" />
              Mail app
            </a>
            <a
              href={canMail ? gmailLink(to, subject, text) : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSent?.()}
              aria-disabled={!canMail}
              className={`btn-shine inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 ${canMail ? "" : "pointer-events-none opacity-50"}`}
            >
              <Icon name="mail" className="h-4 w-4" />
              Open in Gmail
            </a>
          </>
        ) : wa ? (
          <a
            href={ready ? waLink(wa, text) : undefined}
            target="_blank"
            rel="noreferrer"
            onClick={() => onSent?.()}
            aria-disabled={!ready}
            className={`btn-shine inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1DA851] ${ready ? "" : "pointer-events-none opacity-50"}`}
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            Send on WhatsApp
          </a>
        ) : (
          <span className="self-center px-2 text-xs text-slate-400">No mobile number listed — copy the message, or switch to email</span>
        )}
      </div>

      {channel === "email" && !canMail && ready && (
        <p className="mt-2 text-right text-xs text-slate-400">Add their email address to enable sending.</p>
      )}
    </>
  );
}
