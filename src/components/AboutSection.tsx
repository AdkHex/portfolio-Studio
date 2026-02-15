import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { SiteSettings } from "@/types/cms";

interface Props {
  settings: SiteSettings;
}

const AboutSection = ({ settings }: Props) => {
  const { ref, isVisible } = useScrollReveal();
  const theme = settings.portfolioTheme;
  const editorial = theme === "amber-editor" || theme === "sandstone-pro";
  const minimal = theme === "mono-slate" || theme === "midnight-luxe";

  return (
    <section id="about" className="section-shell px-4 py-20 sm:px-6">
      <div
        ref={ref}
        className={`mx-auto grid w-full max-w-6xl gap-10 transition-all duration-700 ${
          editorial ? "lg:grid-cols-1" : "lg:grid-cols-[0.85fr_1.15fr]"
        } ${
          isVisible ? "reveal-in" : "reveal-out"
        }`}
      >
        <div>
          <p className="section-kicker">About</p>
          <h2 className="section-title">{settings.aboutTitle}</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{settings.aboutDescription}</p>
        </div>

        <div className={`space-y-4 ${editorial ? "grid md:grid-cols-2 md:gap-4 md:space-y-0" : ""}`}>
          {settings.aboutCards.map((value) => (
            <article
              key={value.title}
              className={`soft-card p-5 sm:p-6 ${
                minimal ? "rounded-md border border-border/35" : "rounded-2xl"
              }`}
            >
              <h3 className="text-lg font-semibold tracking-tight">{value.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
