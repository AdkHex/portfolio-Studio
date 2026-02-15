import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api } from "@/lib/api";

interface Props {
  mode: "login" | "signup";
}

export default function StudioAuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setShowResend(false);
    setLoading(true);
    try {
      if (mode === "signup") {
        const signup = await api.accountSignup({ name: name.trim(), email: email.trim(), password });
        if (signup.requiresEmailVerification) {
          setNotice("Verification email sent. Please check your inbox before signing in.");
          return;
        }
        const plan = searchParams.get("plan");
        if (plan === "plus" || plan === "pro") {
          const checkout = await api.accountCreateCheckout(plan);
          window.location.href = checkout.paymentUrl;
          return;
        }
        if (plan === "free") {
          await api.accountSetPlan("free");
        }
      } else {
        await api.accountLogin({ email: email.trim(), password });
      }
      navigate("/studio", { replace: true });
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 403) {
        setShowResend(true);
      }
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await api.accountResendVerification({ email: email.trim() });
      setNotice("Verification email sent again. Check inbox/spam.");
      setShowResend(false);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Could not resend email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 0%, hsl(var(--primary)/0.2), transparent 38%), radial-gradient(circle at 0% 100%, hsl(var(--accent)/0.16), transparent 34%)"
        }}
      />

      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-2xl bg-card/70 p-7 shadow-[0_16px_40px_hsl(var(--background)/0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Portfolio Studio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{mode === "signup" ? "Create account" : "Sign in"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {mode === "signup" ? "Start building portfolio sites without touching code." : "Manage your portfolio sites and themes."}
        </p>

        <div className="mt-6 grid gap-4">
          {mode === "signup" ? (
            <label className="grid gap-1.5 text-sm">
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-xl border border-border/60 bg-background/70 px-3 text-sm outline-none transition focus:border-primary/60" required />
            </label>
          ) : null}
          <label className="grid gap-1.5 text-sm">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border border-border/60 bg-background/70 px-3 text-sm outline-none transition focus:border-primary/60" required />
          </label>
          <label className="grid gap-1.5 text-sm">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border border-border/60 bg-background/70 px-3 text-sm outline-none transition focus:border-primary/60" required minLength={8} />
          </label>

          <button type="submit" disabled={loading} className="mt-2 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-65">
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          {showResend ? (
            <button
              type="button"
              onClick={resendVerification}
              disabled={loading}
              className="h-10 rounded-xl border border-border/70 bg-card/50 text-sm font-semibold text-foreground transition hover:border-primary/60 disabled:opacity-65"
            >
              Resend Verification Email
            </button>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <Link to={mode === "signup" ? "/studio/login" : "/studio/signup"} className="font-semibold text-primary hover:underline">
            {mode === "signup" ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </div>
  );
}
