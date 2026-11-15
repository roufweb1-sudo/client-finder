import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules for using AI Client Finder.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" intro={`By creating an account on ${CONTACT.brand} you agree to these terms.`}>
      <section>
        <h2>The service</h2>
        <p>
          {CONTACT.brand} helps web designers and freelancers find local businesses that may need a website. It shows public business information from Google
          Maps, checks public websites, and drafts outreach messages for you to send yourself.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You need a valid email address, and you are responsible for what happens under your account.</li>
          <li>One account is for one person. Please do not share your login.</li>
          <li>You must be 18 or older.</li>
        </ul>
      </section>

      <section>
        <h2>Fair use</h2>
        <p>Each plan includes a monthly allowance of searches, website checks and AI pitches. When the allowance is used up, those features pause until the next month or until you upgrade. You agree not to:</p>
        <ul>
          <li>use automated scripts to call the service or to get around the limits;</li>
          <li>resell the raw data, or present the service as your own product;</li>
          <li>send unlawful, misleading or abusive messages to the businesses you find;</li>
          <li>break Google&apos;s terms or any law that applies to marketing and unsolicited messages where you live and where the business is.</li>
        </ul>
      </section>

      <section>
        <h2>Messages you send</h2>
        <p>
          The app drafts a message; you decide whether to send it. You are the sender, so you are responsible for the content, for following local rules on
          unsolicited contact, and for honouring any request to stop contacting a business.
        </p>
      </section>

      <section>
        <h2>Accuracy</h2>
        <p>
          Business details come from Google Maps and website scores come from Google&apos;s PageSpeed Insights. Both can be out of date or wrong. Lead scores are
          our own estimate, not a promise about a business. Please check before you rely on anything.
        </p>
      </section>

      <section>
        <h2>No promise of results</h2>
        <p>We give you better leads and a faster way to reach them. We cannot promise replies, clients or income. Results depend on your own work.</p>
      </section>

      <section>
        <h2>Payment and delivery</h2>
        <ul>
          <li>Prices are in Indian rupees and include applicable taxes unless stated otherwise.</li>
          <li>Payments are processed by Razorpay. We do not see your card or bank details.</li>
          <li>Plans are one-time payments for a fixed period. Nothing renews automatically.</li>
          <li>Access is digital and is activated on your account immediately after a successful payment, usually within a minute.</li>
          <li>Refunds are covered by our <a href="/refund">refund and cancellation policy</a>.</li>
        </ul>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          We work to keep the service running, but it may be unavailable during maintenance or because of a problem at one of the services we rely on. We may
          change or remove features as the product grows.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can stop using the service at any time and ask us to delete your account. We may suspend an account that breaks these terms, and in serious cases
          close it without a refund.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          As far as the law allows, our total liability for any claim relating to the service is limited to the amount you paid us in the 12 months before the
          claim. We are not liable for lost profits or lost business.
        </p>
      </section>

      <section>
        <h2>Law</h2>
        <p>These terms are governed by the laws of India, and the courts of Kerala have jurisdiction.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {CONTACT.legalName}, {CONTACT.addressLine}. Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>, phone {CONTACT.phoneDisplay}.
        </p>
      </section>
    </LegalPage>
  );
}
