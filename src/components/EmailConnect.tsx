"use client";

import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import Icon from "@/components/Icon";
import Spinner from "@/components/Spinner";
import { refreshEmailStatus, useEmailStatus } from "@/lib/emailAccount";
import { authFetch } from "@/lib/storage";

/** What the user sees coming back from Google. */
const RESULT: Record<string, { tone: "ok" | "bad"; text: string }> = {
  connected: { tone: "ok", text: "Gmail connected. Your pitches can now go out in one click." },
  cancelled: { tone: "bad", text: "You cancelled the Google screen, so nothing was connected." },
  expired: { tone: "bad", text: "That took too long and the link expired. Try connecting again." },
  norefresh: { tone: "bad", text: "Google didn't return a lasting permission. Try again and press Allow." },
  failed: { tone: "bad", text: "Something went wrong connecting Gmail. Try again." },
};

export default function EmailConnect({ result }: { result?: string | null }) {
  const status = useEmailStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const note = result ? RESULT[result] : null;

  useEffect(() => {
    void refreshEmailStatus();
  }, []);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/email/connect", {});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't start the Google sign-in");
      window.location.href = json.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/email/disconnect", {});
      if (!res.ok) throw new Error((await res.json()).error || "Couldn't disconnect");
      await refreshEmailStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {note && (
        <p className={`rounded-xl px-4 py-3 text-sm ${note.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{note.text}</p>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sending mailbox</p>

        {status === null ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Spinner className="h-4 w-4 text-violet-500" /> Checking…
          </p>
        ) : status.connected ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Icon name="check" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium break-all text-slate-900">{status.address}</p>
                <p className="text-xs text-slate-500">Connected — email pitches send straight from here.</p>
              </div>
            </div>
            <button
              onClick={disconnect}
              disabled={busy}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? "Disconnecting…" : "Disconnect"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Connect the mailbox you want your pitches to come from. Mail goes out in your name, lands in your Sent folder, and replies come straight back
              to you.
            </p>
            <button
              onClick={connect}
              disabled={busy}
              className="btn-shine mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              <Icon name="mail" className="size-4" />
              {busy ? "Opening Google…" : "Connect Gmail"}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              Works with Gmail and with business email on Google Workspace. We only ask for permission to send — we can never read your inbox. Support for
              Zoho, Outlook and other providers is coming.
            </p>
          </>
        )}
        {error && <ErrorNote message={error} className="mt-3" />}
      </section>
    </div>
  );
}
