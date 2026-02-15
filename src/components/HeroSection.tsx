import { ArrowRight, ArrowUpRight, Download, Mail, Sparkles } from "lucide-react";
import type { SiteSettings } from "@/types/cms";

interface Props {
  settings: SiteSettings;
}

const HeroSection = ({ settings }: Props) => {
  const theme = settings.portfolioTheme;
  const isCentered = theme === "amber-editor" || theme === "sandstone-pro";
  const isMinimal = theme === "mono-slate" || theme === "midnight-luxe";
  const isReversed = theme === "forest-signal" || theme === "cobalt-grid";

  const resolveIcon = (href: string) => {
    const normalized = href.trim().toLowerCase();
    const isAnchor = normalized.startsWith("#");
    const isMail = normalized.startsWith("mailto:");
    const isDownload =
      normalized.includes("/download") ||
      normalized.endsWith(".zip") ||
      normalized.endsWith(".exe") ||
      normalized.endsWith(".pdf") ||
      normalized.endsWith(".dmg") ||
      normalized.endsWith(".msi");

    if (isAnchor) {
      return <ArrowRight size={16} />;
    }
    if (isMail) {
      return <Mail size={15} />;
    }
    if (isDownload) {
      return <Download size={15} />;
    }
    return <ArrowUpRight size={15} />;
  };

  const styleMap = {
    primary:
      `inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px] hover:opacity-95 ${
        theme === "amber-editor" || theme === "sandstone-pro"
          ? "rounded-md bg-primary text-primary-foreground"
          : "rounded-xl bg-primary text-primary-foreground"
      }`,
    secondary:
      `inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-foreground shadow-[0_8px_20px_hsl(var(--background)/0.28)] transition hover:bg-card/80 ${
        theme === "mono-slate" || theme === "midnight-luxe"
          ? "rounded-md bg-card/55 border border-border/35"
          : "rounded-xl bg-card/65"
      }`,
    outline:
      `inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-foreground shadow-[0_8px_20px_hsl(var(--background)/0.28)] transition hover:bg-card/80 ${
        theme === "mono-slate" || theme === "midnight-luxe"
          ? "rounded-md bg-card/55 border border-border/35"
          : "rounded-xl bg-card/65"
      }`
  } as const;

  return (
    <section className="hero-background relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32" id="home">
      <div className="hero-noise pointer-events-none absolute inset-0" />
      <div
        className={`mx-auto grid w-full max-w-6xl gap-12 ${
          isCentered
            ? "text-center"
            : isReversed
              ? "lg:grid-cols-[0.82fr_1.18fr] lg:items-end"
              : "lg:grid-cols-[1.25fr_0.75fr] lg:items-end"
        }`}
      >
        <div>
          <div
            className={`mb-6 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary ${
              theme === "amber-editor" || theme === "sandstone-pro" ? "rounded-md bg-primary/18" : "rounded-full bg-primary/14"
            } ${isCentered ? "mx-auto" : ""}`}
          >
            <Sparkles size={14} />
            {settings.heroBadge}
          </div>

          <p className={`mb-4 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground ${isCentered ? "text-center" : ""}`}>Portfolio</p>
          <h1
            className={`text-balance font-extrabold leading-[0.95] tracking-tight ${
              isCentered ? "mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl" : "text-4xl sm:text-5xl lg:text-7xl"
            }`}
          >
            {settings.heroTitle}
          </h1>

          <p className={`mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg ${isCentered ? "mx-auto max-w-3xl" : "max-w-2xl"}`}>
            {settings.heroDescription}
          </p>

          <div className={`mt-8 flex flex-wrap gap-3 ${isCentered ? "justify-center" : ""}`}>
            {settings.ctaButtons.map((button, index) => {
              const external = button.href.startsWith("http");
              return (
                <a
                  key={`${button.href}-${index}`}
                  href={button.href}
                  onClick={(event) => {
                    if (button.href.startsWith("#")) {
                      event.preventDefault();
                      document.querySelector(button.href)?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className={styleMap[button.style]}
                >
                  {button.label}
                  {resolveIcon(button.href)}
                </a>
              );
            })}
          </div>
        </div>

        {!isMinimal && (
          <aside
            className={`hero-panel p-6 sm:p-7 ${
              theme === "amber-editor" || theme === "sandstone-pro"
                ? "mx-auto mt-4 w-full max-w-5xl rounded-2xl lg:col-span-2"
                : "rounded-2xl"
            } ${isReversed ? "lg:order-first" : ""}`}
          >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">What I deliver</p>
          <ul className={`space-y-3 ${theme === "amber-editor" || theme === "sandstone-pro" ? "md:grid md:grid-cols-2 md:gap-3 md:space-y-0" : ""}`}>
            {settings.heroHighlights.map((item) => (
              <li
                key={item}
                className={`px-4 py-3 text-sm text-foreground/90 ${
                  theme === "mono-slate" || theme === "midnight-luxe"
                    ? "rounded-md bg-card/48 border border-border/35"
                    : "rounded-xl bg-card/62"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
          <div className={`mt-6 grid gap-3 text-center ${theme === "amber-editor" ? "grid-cols-3" : "grid-cols-3"}`}>
            {settings.heroStats.map((stat) => (
              <div
                key={stat.label}
                className={`p-3 ${
                  theme === "mono-slate" || theme === "midnight-luxe"
                    ? "rounded-md bg-card/48 border border-border/35"
                    : "rounded-xl bg-card/58"
                }`}
              >
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
          </aside>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
