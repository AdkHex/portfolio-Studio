import LegalLayout from "./LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms and Conditions" effectiveDate="February 15, 2026">
      <p>By accessing this website and services, you agree to these Terms and Conditions.</p>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">1. Service Use</h2>
        <p>You may use this platform to create and manage portfolio websites for lawful purposes only. Abuse, spam, fraud, malware, or illegal content is prohibited.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">2. Accounts</h2>
        <p>You are responsible for account credentials and all activity under your account. We may suspend accounts that violate these terms.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">3. Plans and Billing</h2>
        <p>Features and site limits depend on your plan (Free, Plus, Pro). Paid plans are billed as shown at checkout. Unless required by law, payments are non-refundable.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">4. User Content</h2>
        <p>You keep ownership of your content. You grant us a limited license to host and process that content to provide the service.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">5. Availability and Liability</h2>
        <p>We aim to keep the service available but do not guarantee uninterrupted operation. To the maximum extent allowed by law, we are not liable for indirect or consequential losses.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">6. Changes</h2>
        <p>We may update these terms at any time. Updated terms become effective when posted on this website.</p>
      </section>
    </LegalLayout>
  );
}

