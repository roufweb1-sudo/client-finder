"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import { saveProfileNow } from "@/lib/storage";
import type { Profile } from "@/lib/types";

// Shrink an uploaded logo so it stays small in the database
function resizeImage(file: File, max = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Not an image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function BrandingForm({ saved }: { saved: Profile }) {
  const [draft, setDraft] = useState<Profile>(saved);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function update(patch: Partial<Profile>) {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus("idle");
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const err = await saveProfileNow(draft);
    if (err) {
      setError(err);
      setStatus("idle");
    } else setStatus("saved");
  }

  const field = (key: keyof Omit<Profile, "logo">, label: string, placeholder: string, type = "text") => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {field("name", "Your name", "e.g. Abdul Rouf")}
        {field("brand", "Business / brand name", "e.g. Roufweb Solutions")}
        {field("phone", "WhatsApp number (shown on reports)", "e.g. +91 87140 59090", "tel")}
        {field("email", "Email", "e.g. hello@yourbrand.com", "email")}

        <div>
          <span className="text-sm font-medium text-slate-700">Logo</span>
          <div className="mt-2 flex items-center gap-4">
            {draft.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.logo} alt="Your logo" className="h-16 w-16 rounded-lg object-contain ring-1 ring-slate-200" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">No logo</div>
            )}
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              Upload logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) update({ logo: await resizeImage(f) });
                  e.target.value = "";
                }}
              />
            </label>
            {draft.logo && (
              <button type="button" onClick={() => update({ logo: "" })} className="text-sm text-slate-400 hover:text-rose-600">
                Remove
              </button>
            )}
          </div>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Couldn&apos;t save: {error}</p>}

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={!dirty || status === "saving"}
            className="rounded-lg bg-violet-600 px-5 py-2 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
          {dirty && status !== "saving" && (
            <>
              <span className="text-sm text-amber-600">You have unsaved changes</span>
              <button type="button" onClick={() => update(saved)} className="text-sm text-slate-400 hover:text-slate-700">
                Undo
              </button>
            </>
          )}
          {!dirty && status === "saved" && <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
              <Icon name="check" className="h-4 w-4" /> Saved
            </span>}
        </div>
      </form>
    </div>
  );
}
