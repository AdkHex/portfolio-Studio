import { useEffect, useMemo, useState } from "react";
import { Menu, MoonStar, Sun, X } from "lucide-react";
import type { NavLinkItem, PortfolioTheme } from "@/types/cms";

type Theme = "dark" | "light";

interface Props {
  links: NavLinkItem[];
  siteName: string;
  portfolioTheme: PortfolioTheme;
}

const Navbar = ({ links, siteName, portfolioTheme }: Props) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [active, setActive] = useState("");

  const visibleLinks = useMemo(() => links.filter((item) => item.visible), [links]);

  useEffect(() => {
    const stored = window.localStorage.getItem("portfolio-theme") as Theme | null;
    const preferred =
      stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = visibleLinks
      .map((link) => document.getElementById(link.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.1, 0.2, 0.4, 0.7] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [visibleLinks]);

  const goTo = (href: string) => {
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-mono text-sm tracking-[0.18em] text-foreground/85 transition hover:text-foreground"
        >
          {siteName.toUpperCase()}
        </button>

        <nav
          className={`hidden items-center gap-1 p-1 md:flex ${
            portfolioTheme === "amber-editor" || portfolioTheme === "sandstone-pro"
              ? "rounded-xl bg-card/80 shadow-[0_10px_30px_hsl(var(--background)/0.25)]"
              : portfolioTheme === "mono-slate" || portfolioTheme === "midnight-luxe"
                ? "rounded-md border border-border/45 bg-card/55"
                : "rounded-full bg-card/70 shadow-[0_10px_28px_hsl(var(--background)/0.28)]"
          }`}
        >
          {visibleLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => goTo(link.href)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                portfolioTheme === "amber-editor" || portfolioTheme === "sandstone-pro" ? "rounded-md" : "rounded-full"
              } ${
                active === link.id
                  ? "bg-primary text-primary-foreground"
                  : portfolioTheme === "mono-slate" || portfolioTheme === "midnight-luxe"
                    ? "text-muted-foreground hover:bg-secondary/55 hover:text-foreground"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-muted-foreground shadow-[0_6px_18px_hsl(var(--background)/0.25)] transition hover:text-foreground"
          >
            {theme === "dark" ? <Sun size={16} /> : <MoonStar size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-muted-foreground shadow-[0_6px_18px_hsl(var(--background)/0.25)] transition hover:text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden bg-background/95 backdrop-blur-lg transition-all duration-300 md:hidden ${
          mobileOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {visibleLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => goTo(link.href)}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                active === link.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
