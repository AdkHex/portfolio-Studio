import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

export default function LegalLayout({ title, effectiveDate, children }: Props) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border/60 bg-card/55 p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Effective Date: {effectiveDate}</p>
          </div>
          <Link to="/" className="rounded-lg bg-secondary/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Back To Home
          </Link>
        </div>
        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

