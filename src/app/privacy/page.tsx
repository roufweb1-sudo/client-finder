import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What AI Client Finder stores about you, who we share it with, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`This policy explains what ${CONTACT.brand} stores about you, why, and how you can have it removed. We keep it short and in plain English on purpose.`}
    >
      <section>
        <h2>Who we are</h2>
        <p>
          {CONTACT.brand} is a software service operated by {CONTACT.legalName}, {CONTACT.addressLine}. You can reach us at{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or {CONTACT.phoneDisplay}.
        </p>
      </section>

      <section>
        <h2>What we store</h2>
        <ul>
          <li>
            <b>Your account:</b> your email address, and your name if you sign in with Google. We never see or store your password — sign-in is handled by our
            authentication provider.
          </li>
          <li>
            <b>Your branding:</b> the name, business name, phone number, email and logo you choose to add, so they can appear on the reports you create.
          </li>
          <li>
            <b>Your saved leads:</b> the businesses you save, plus your own notes, status and follow-up dates. The business details themselves come from Google
            Maps and are already public.
          </li>
          <li>
            <b>Usage counts:</b> how many searches, website checks and AI pitches you have used this month, so we can apply your plan&apos;s limits.
          </li>
          <li>
            <b>Payment records:</b> the amount, the plan, the date and the reference number given to us by our payment gateway. We never receive or store your
            card number, UPI PIN or bank details.
          </li>
        </ul>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell or rent your data to anyone.</li>
          <li>We do not run advertising trackers or sell advertising on this site.</li>
          <li>We do not read your leads to contact those businesses ourselves.</li>
        </ul>
      </section>

      <section>
        <h2>Services we rely on</h2>
        <p>To run the product we pass limited data to these companies, and only as far as the job needs:</p>
        <ul>
          <li>
            <b>Supabase</b> — stores your account, leads and settings.
          </li>
          <li>
            <b>Google (Places API and PageSpeed Insights API)</b> — receives your search words and the website address being checked.
          </li>
          <li>
            <b>Anthropic (Claude)</b> — receives the business details needed to write a pitch. It is not used to train their models.
          </li>
          <li>
            <b>Razorpay</b> — handles payments and collects the payment details directly from you.
          </li>
          <li>
            <b>Hostinger</b> — hosts the application.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies and browser storage</h2>
        <p>
          We use browser storage to keep you logged in and to remember small preferences, such as your preferred pitch language. These are needed for the app to
          work. We do not use advertising or cross-site tracking cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Your data stays while your account is open. Ask us to delete your account and we remove your profile, leads and settings within 30 days. Payment
          records are kept longer where tax and accounting law requires it.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Export your leads to a CSV file from the app at any time.</li>
          <li>
            Ask for a copy of your data, a correction, or deletion by writing to <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. We reply within 7
            working days.
          </li>
        </ul>
      </section>

      <section>
        <h2>Children</h2>
        <p>This is a business tool and is not intended for anyone under 18.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy we will update the date at the top of this page and, for larger changes, tell you by email.</p>
      </section>
    </LegalPage>
  );
}
