import LegalLayout from "./LegalLayout";

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="February 15, 2026">
      <p>This Refund Policy applies to paid plan purchases on this platform.</p>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">1. Plan Activation</h2>
        <p>Paid plans are activated after successful payment verification. Once activated, access is granted immediately.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">2. Refund Eligibility</h2>
        <p>Unless required by local consumer law, completed payments are generally non-refundable after plan activation.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">3. Failed or Duplicate Charges</h2>
        <p>If you were charged incorrectly, charged twice, or payment succeeded but plan was not applied, contact support with payment reference details for manual review.</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">4. Chargebacks</h2>
        <p>Unauthorized chargebacks may result in temporary account restrictions while we investigate payment records.</p>
      </section>
    </LegalLayout>
  );
}

