import LegalLayout from "./LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="February 15, 2026">
      <p>This Privacy Policy explains how we collect, use, and protect information when you use this platform.</p>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
        <p>We may collect account details (name, email), portfolio content you enter, contact form submissions, and basic technical logs needed for security and operation.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">2. How We Use Data</h2>
        <p>We use data to provide the service, authenticate users, process plan access, improve reliability, and communicate service-related updates.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">3. Cookies and Sessions</h2>
        <p>We use secure session cookies for login and account access. These are necessary for authentication and dashboard functionality.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">4. Sharing</h2>
        <p>We do not sell your personal data. We may share data with infrastructure/payment providers only as required to operate the service.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">5. Security</h2>
        <p>We use reasonable technical safeguards, but no system is completely secure. You are responsible for using a strong password and protecting your account.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">6. Your Rights</h2>
        <p>You may request account data updates or deletion by contacting the site owner through the provided contact channel.</p>
      </section>
    </LegalLayout>
  );
}

