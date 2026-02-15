import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import CustomSections from "@/components/CustomSections";
import ProjectsSection from "@/components/ProjectsSection";
import SkillsSection from "@/components/SkillsSection";
import ContactSection from "@/components/ContactSection";
import BackToTop from "@/components/BackToTop";
import { api } from "@/lib/api";
import { listenContentVersion } from "@/lib/content-sync";
import { demoProjects, demoSettings } from "@/lib/demo-portfolio";
import { PORTFOLIO_THEMES } from "@/lib/portfolio-themes";
import type { Project, SiteSettings } from "@/types/cms";

const Index = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const siteSlug = useMemo(() => params.slug || searchParams.get("site") || "", [params.slug, searchParams]);
  const isDemoPortfolio = useMemo(() => location.pathname === "/portfolio" && !siteSlug, [location.pathname, siteSlug]);
  const demoTheme = useMemo(() => {
    const value = searchParams.get("theme") || demoSettings.portfolioTheme;
    return PORTFOLIO_THEMES.some((item) => item.id === value) ? value : demoSettings.portfolioTheme;
  }, [searchParams]);

  const loadContent = useCallback(() => {
    if (isDemoPortfolio) {
      const nextSettings: SiteSettings = {
        ...demoSettings,
        portfolioTheme: demoTheme,
        seoTitle: `Portfolio Demo (${demoTheme}) | Portfolio Studio`
      };
      setSettings(nextSettings);
      setProjects(demoProjects);
      document.title = nextSettings.seoTitle;
      setError("");
      return;
    }

    api
      .getPublicContent(siteSlug || undefined)
      .then((data) => {
        setSettings(data.settings);
        setProjects(data.projects);
        document.title = data.settings.seoTitle;
        setError("");
      })
      .catch(() => setError("Failed to load content."));
  }, [demoTheme, isDemoPortfolio, siteSlug]);

  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute("data-portfolio-theme", settings.portfolioTheme || "neon-grid");
    }
  }, [settings]);

  useEffect(() => {
    loadContent();
    if (isDemoPortfolio) {
      setShowDemoPopup(true);
      return;
    }

    const onFocus = () => loadContent();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadContent();
      }
    };

    const unlisten = listenContentVersion(loadContent);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unlisten();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isDemoPortfolio, loadContent]);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-muted-foreground">
        {error || "Loading portfolio..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isDemoPortfolio && showDemoPopup ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/95 p-6 shadow-[0_20px_48px_hsl(var(--background)/0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Demo Notice</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Live Demo - What your portfolio page will look like after you create one.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Click on pricing and start creating one for you and your friends.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/#pricing" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                View Pricing
              </Link>
              <button onClick={() => setShowDemoPopup(false)} className="inline-flex h-10 items-center rounded-xl border border-border/70 px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                Continue Demo
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isDemoPortfolio ? (
        <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border/60 bg-card/85 p-2 shadow-[0_10px_24px_hsl(var(--background)/0.3)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Theme</span>
            <select
              value={settings.portfolioTheme}
              onChange={(event) => navigate(`/portfolio?theme=${event.target.value}`)}
              className="h-8 rounded-lg border border-border/60 bg-background/70 px-2 text-xs font-semibold text-foreground outline-none transition focus:border-primary/60"
            >
              {PORTFOLIO_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <Navbar links={settings.navbarLinks} siteName={settings.siteName} portfolioTheme={settings.portfolioTheme} />
      <main>
        <HeroSection settings={settings} />
        <AboutSection settings={settings} />
        <CustomSections settings={settings} />
        <ProjectsSection projects={projects} settings={settings} />
        <SkillsSection settings={settings} />
        <ContactSection settings={settings} siteSlug={siteSlug || undefined} />
      </main>
      <BackToTop />
    </div>
  );
};

export default Index;
