import { CONTACT } from "@/lib/site";

/** Shared frame for the policy pages so they all read the same way. */
export default function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="animate-fade-up mx-auto max-w-3xl py-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {CONTACT.policiesUpdated}</p>
      {intro && <p className="mt-5 text-base leading-relaxed text-slate-600">{intro}</p>}
      <div className="mt-8 space-y-7 rounded-2xl bg-white p-6 text-[15px] leading-relaxed text-slate-700 ring-1 ring-slate-200 sm:p-8 [&_a]:font-medium [&_a]:text-violet-700 [&_a:hover]:underline [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-1 [&_p]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
