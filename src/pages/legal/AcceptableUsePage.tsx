import LegalLayout from "./LegalLayout";

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" effectiveDate="February 15, 2026">
      <p>This policy defines allowed and prohibited use of this platform.</p>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Allowed Use</h2>
        <p>You may create and manage portfolio sites, publish project content, and use communication features for legitimate professional purposes.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Prohibited Use</h2>
        <p>Do not use the service to distribute malware, phishing content, explicit illegal content, hate speech, harassment, scams, or content that violates intellectual property rights.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Security Abuse</h2>
        <p>Attempting to bypass authentication, probe infrastructure, scrape private data, or disrupt service operation is prohibited.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Enforcement</h2>
        <p>We may remove content, suspend access, or terminate accounts that violate this policy, with or without prior notice.</p>
      </section>
    </LegalLayout>
  );
}

