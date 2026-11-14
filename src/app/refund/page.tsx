import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { PRICES } from "@/lib/plans";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description: "When AI Client Finder gives a refund, how to ask for one, and how long it takes.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund &amp; cancellation policy"
      intro="We would rather give your money back than keep a customer who is unhappy. Here is exactly how that works."
    >
      <section>
        <h2>How delivery works</h2>
        <p>
          {CONTACT.brand} is a digital service. There is nothing to ship. When your payment succeeds, your plan is activated on your account immediately,
          usually within a minute, and you can use it straight away. If your payment succeeded but the plan did not activate, write to us and we will fix it or
          refund you in full.
        </p>
      </section>

      <section>
        <h2>Cancellation</h2>
        <p>
          Plans are one-time payments for a fixed period — {PRICES.monthly.label.toLowerCase()} or {PRICES.yearly.label.toLowerCase()}. There is no
          subscription and nothing renews on its own, so there is nothing to cancel. When the period ends, your account simply goes back to the free plan and
          your saved leads stay with you.
        </p>
      </section>

      <section>
        <h2>When we refund in full</h2>
        <ul>
          <li>You were charged twice for the same plan.</li>
          <li>Money was taken but the plan was not activated on your account.</li>
          <li>The service was unusable because of a fault on our side and we could not fix it in a reasonable time.</li>
        </ul>
      </section>

      <section>
        <h2>Changed your mind</h2>
        <p>
          If you bought a plan and decide within <b>7 days</b> that it is not for you, write to us and we will refund it, as long as the paid allowance has been
          used only lightly — up to 10% of the monthly searches, website checks and AI pitches included in your plan. Beyond that the service has been used, and
          the searches and AI pitches have already cost us money with Google and Anthropic, so we cannot refund it.
        </p>
      </section>

      <section>
        <h2>When we do not refund</h2>
        <ul>
          <li>The plan&apos;s allowance has largely been used.</li>
          <li>More than 7 days have passed, except in the full-refund cases above.</li>
          <li>The leads did not reply, or you did not win a client. We cannot promise results, only better leads.</li>
          <li>The account was closed for breaking our <a href="/terms">terms of service</a>.</li>
        </ul>
      </section>

      <section>
        <h2>How to ask</h2>
        <p>
          Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> from the address on your account, with the payment date and the amount. You can also
          call or message {CONTACT.phoneDisplay}. We reply within 2 working days.
        </p>
      </section>

      <section>
        <h2>How long it takes</h2>
        <p>
          Approved refunds are sent back through Razorpay to the same method you paid with, within 5 to 7 working days. Your bank may take a few days more to
          show it.
        </p>
      </section>
    </LegalPage>
  );
}
