import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function StudioVerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token") || "";
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }

    api
      .accountVerifyEmail(token)
      .then(() => {
        setState("success");
        setMessage("Email verified successfully. Redirecting to Studio...");
        setTimeout(() => navigate("/studio", { replace: true }), 1000);
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      });
  }, [navigate, searchParams]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 0%, hsl(var(--primary)/0.2), transparent 38%), radial-gradient(circle at 0% 100%, hsl(var(--accent)/0.16), transparent 34%)"
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card/70 p-7 shadow-[0_16px_40px_hsl(var(--background)/0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Portfolio Studio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Email Verification</h1>
        <p className={`mt-4 text-sm leading-relaxed ${state === "error" ? "text-destructive" : state === "success" ? "text-emerald-400" : "text-muted-foreground"}`}>
          {message}
        </p>
        <div className="mt-6">
          <Link to="/studio/login" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

