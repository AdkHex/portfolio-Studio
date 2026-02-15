import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans: Array<{ id: "free" | "plus" | "pro"; name: string; price: string; details: string; highlights: string[] }> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    details: "1 portfolio site, preview only",
    highlights: ["One site", "All core editor features", "Preview URL access"]
  },
  {
    id: "plus",
    name: "Plus",
    price: "$50 lifetime",
    details: "Up to 5 portfolio sites",
    highlights: ["Five sites", "Launch enabled", "Great for freelancers"]
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    details: "Up to 100 portfolio sites",
    highlights: ["100 sites", "Launch enabled", "Best for agencies"]
  }
];

const steps = [
  { title: "Pick a plan", body: "Start free or choose Plus/Pro for more sites and launch access." },
  { title: "Build in Studio", body: "Edit hero, projects, themes, links, and sections without touching code." },
  { title: "Preview and launch", body: "Free can preview. Plus and Pro can launch production-ready sites." }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 10% 0%, hsl(var(--primary)/0.24), transparent 38%), radial-gradient(circle at 92% 22%, hsl(var(--accent)/0.18), transparent 34%), linear-gradient(180deg, hsl(var(--background)), hsl(var(--background)))"
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl">
          <header className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/55 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <Sparkles size={15} className="text-primary" />
              Portfolio Studio
            </div>
            <div className="flex items-center gap-2">
              <Link to="/studio/login" className="rounded-lg bg-card/65 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link to="/studio/signup" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Get Started
              </Link>
            </div>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">No-code portfolio platform</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
                Sell-ready portfolio builder for creators and agencies.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Create client-ready portfolio websites with visual editing, modern templates, project management, and built-in contact handling.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/studio/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                  Start Building <ArrowRight size={15} />
                </Link>
                <Link to="/portfolio" className="inline-flex items-center gap-2 rounded-xl bg-card/70 px-5 py-3 text-sm font-semibold text-foreground">
                  View Portfolio Demo
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inside the studio</p>
              <ul className="mt-3 space-y-2">
                {["Content + project editing [Without touching Code]", "Theme/UI switcher", "Per-site message inbox", "Plan limits and launch controls"].map((item) => (
                  <li key={item} className="inline-flex w-full items-center gap-2 rounded-lg bg-background/55 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={14} className="text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose your plan</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className={`rounded-2xl border p-5 ${plan.id === "plus" ? "border-primary/45 bg-primary/10" : "border-border/60 bg-card/55"}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm font-semibold text-primary">{plan.price}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.details}</p>
                <ul className="mt-4 space-y-2">
                  {plan.highlights.map((item) => (
                    <li key={item} className="inline-flex w-full items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={13} className="text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Link to={`/studio/signup?plan=${plan.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  {plan.id === "free" ? "Start Free" : `Buy ${plan.name}`}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 sm:px-6">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-border/60 bg-card/55 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">How it works</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-xl bg-background/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step {index + 1}</p>
                <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
