import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function StudioBillingCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying payment...");
  const [result, setResult] = useState<"success" | "pending" | "failed" | "unknown">("unknown");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    if (!pidx) {
      setError("Missing payment reference.");
      setLoading(false);
      return;
    }

    api
      .accountVerifyCheckout(pidx)
      .then((result) => {
        if (result.success) {
          setResult("success");
          setStatus(`Payment ${result.status}. Plan activated.`);
          setTimeout(() => navigate("/studio", { replace: true }), 1000);
          return;
        }
        const normalized = result.status.toLowerCase();
        if (["pending", "initiated"].includes(normalized)) {
          setResult("pending");
        } else if (["failed", "cancelled", "canceled", "expired", "refunded"].includes(normalized)) {
          setResult("failed");
        } else {
          setResult("unknown");
        }
        setStatus(`Payment status: ${result.status}`);
      })
      .catch((verifyError) => {
        setResult("failed");
        setError(verifyError instanceof Error ? verifyError.message : "Payment verification failed.");
      })
      .finally(() => setLoading(false));
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-card/70 p-7 shadow-[0_16px_40px_hsl(var(--background)/0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Portfolio Studio</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Billing Callback</h1>
        <p className={`mt-3 text-sm ${result === "success" ? "text-primary" : result === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{status}</p>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <Link to="/studio" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Go to Studio
          </Link>
          <Link to="/" className="inline-flex h-10 items-center rounded-xl border border-border/70 px-4 text-sm text-muted-foreground">
            Back to Landing
          </Link>
          {!loading ? (
            <button onClick={() => window.location.reload()} className="h-10 rounded-xl border border-border/70 px-4 text-sm text-muted-foreground">
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
