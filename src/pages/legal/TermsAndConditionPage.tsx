import LegalLayout from "./LegalLayout";

export default function TermsAndConditionPage() {
  return (
    <LegalLayout title="Terms and Conditions" effectiveDate="February 15, 2026">
      <p>By using this website and services, you agree to the terms below.</p>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">A. Terms and Conditions</h2>
        <p>You may use this platform to create and manage portfolio websites for lawful purposes only. You are responsible for your account credentials and activity.</p>
        <p className="mt-2">Plan limits and features depend on your subscription (Free, Plus, Pro). We may suspend accounts for abuse, fraud, malware, or policy violations.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">B. Privacy Policy</h2>
        <p>We collect account details, portfolio content, and operational logs necessary to run the platform. We use this data to provide authentication, site management, and service operations.</p>
        <p className="mt-2">We do not sell personal data. Session cookies are used for login and dashboard access. You should use strong passwords and protect your account.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">C. Refund Policy</h2>
        <p>Paid plans are activated after successful payment verification. Unless required by local law, completed and activated purchases are generally non-refundable.</p>
        <p className="mt-2">If you are charged incorrectly, charged multiple times, or your plan is not activated after payment, contact support with your payment reference for review.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">D. Acceptable Use Policy</h2>
        <p>You may not use the service for illegal activity, spam, harassment, scams, malware, phishing, or infringement of intellectual property rights.</p>
        <p className="mt-2">Attempting to bypass security, abuse infrastructure, or disrupt service operation is prohibited and may result in account suspension or termination.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">E. Updates and Contact</h2>
        <p>These terms may be updated over time. Continued use of the platform means you accept the latest posted version. For legal requests, use the contact information provided on this website.</p>
      </section>
    </LegalLayout>
  );
}

