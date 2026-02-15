import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { SiteSettings } from "@/types/cms";

interface Props {
  settings: SiteSettings;
}

const CustomSections = ({ settings }: Props) => {
  return (
    <>
      {settings.customSections.map((section, sectionIndex) => (
        <CustomSectionBlock key={`${section.id}-${sectionIndex}`} section={section} />
      ))}
    </>
  );
};

function CustomSectionBlock({
  section
}: {
  section: SiteSettings["customSections"][number];
}) {
  const { ref, isVisible } = useScrollReveal();
  const theme = document.documentElement.getAttribute("data-portfolio-theme") || "neon-grid";
  const editorial = theme === "amber-editor" || theme === "sandstone-pro";
  const minimal = theme === "mono-slate" || theme === "midnight-luxe";
  const structured = theme === "forest-signal" || theme === "cobalt-grid";

  return (
    <section id={section.id} className="section-shell px-4 py-20 sm:px-6">
      <div
        ref={ref}
        className={`mx-auto w-full max-w-6xl transition-all duration-700 ${isVisible ? "reveal-in" : "reveal-out"}`}
      >
        <div className="mb-8 max-w-3xl">
          <p className="section-kicker">{section.kicker}</p>
          <h2 className="section-title">{section.title}</h2>
          {section.description ? (
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{section.description}</p>
          ) : null}
        </div>

        <div className={`space-y-4 ${editorial ? "md:grid md:grid-cols-2 md:gap-4 md:space-y-0" : ""}`}>
          {section.cards.map((item, idx) => (
            <article
              key={`${section.id}-${item.title}-${idx}`}
              className={`soft-card p-5 sm:p-6 ${
                minimal
                  ? "rounded-md border border-border/35"
                  : structured
                    ? "rounded-2xl border-l-4 border-l-primary"
                    : "rounded-2xl"
              }`}
            >
              {item.meta ? <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{item.meta}</p> : null}
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomSections;
