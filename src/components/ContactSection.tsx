import { FormEvent, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/types/cms";

interface Props {
  settings: SiteSettings;
  siteSlug?: string;
}

const ContactSection = ({ settings, siteSlug }: Props) => {
  const { ref, isVisible } = useScrollReveal();
  const theme = settings.portfolioTheme;
  const minimal = theme === "mono-slate" || theme === "midnight-luxe";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus("Please complete all fields before sending.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("Enter a valid email address.");
      return;
    }

    try {
      await api.sendMessage({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }, siteSlug);
      setStatus("Message sent successfully.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send message.");
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(settings.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setStatus("Could not copy email. Please copy it manually.");
    }
  };

  return (
    <footer id="contact" className="section-shell px-4 pb-12 pt-20 sm:px-6">
      <div
        ref={ref}
        className={`mx-auto grid w-full max-w-6xl gap-8 transition-all duration-700 lg:grid-cols-[1fr_1fr] ${
          isVisible ? "reveal-in" : "reveal-out"
        }`}
      >
        <div className={`soft-card p-6 sm:p-7 ${minimal ? "rounded-md border border-border/35" : "rounded-2xl"}`}>
          <p className="section-kicker">Contact</p>
          <h2 className="section-title">{settings.contactTitle}</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{settings.contactDescription}</p>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={`mailto:${settings.contactEmail}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Mail size={16} />
              {settings.contactEmail}
            </a>
            <button
              onClick={copyEmail}
              className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground ${
                minimal ? "rounded-md border border-border/35 bg-secondary/45" : "rounded-lg bg-secondary/75"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy email"}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {settings.socialLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground ${
                  minimal ? "rounded-md border border-border/35 bg-secondary/45" : "rounded-lg bg-secondary/75"
                }`}
              >
                {item.label} <ArrowUpRight size={13} />
              </a>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className={`soft-card p-6 sm:p-7 ${minimal ? "rounded-md border border-border/35" : "rounded-2xl"}`}>
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-lg border border-border/50 bg-background/80 px-3 text-sm outline-none transition focus:border-primary/70"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-lg border border-border/50 bg-background/80 px-3 text-sm outline-none transition focus:border-primary/70"
                placeholder="you@example.com"
                type="email"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Subject
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-11 rounded-lg border border-border/50 bg-background/80 px-3 text-sm outline-none transition focus:border-primary/70"
                placeholder="Project inquiry"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Message
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-32 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 text-sm outline-none transition focus:border-primary/70"
                placeholder="Tell me about your project and goals"
              />
            </label>
            <button
              type="submit"
              className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Send message
            </button>
            <p className="min-h-5 text-xs text-muted-foreground">{status}</p>
          </div>
        </form>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-2 border-t border-border/80 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <p>{settings.footerText}</p>
          <span className="hidden text-border sm:inline">|</span>
          <Link to="/legal/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/legal/refund" className="hover:text-foreground">Refunds</Link>
          <Link to="/legal/acceptable-use" className="hover:text-foreground">Acceptable Use</Link>
        </div>
      </div>
    </footer>
  );
};

export default ContactSection;
