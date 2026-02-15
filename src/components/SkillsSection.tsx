import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { SiteSettings } from "@/types/cms";

interface Props {
  settings: SiteSettings;
}

const SkillsSection = ({ settings }: Props) => {
  const { ref, isVisible } = useScrollReveal();
  const theme = settings.portfolioTheme;
  const editorial = theme === "amber-editor" || theme === "sandstone-pro";
  const minimal = theme === "mono-slate" || theme === "midnight-luxe";
  const structured = theme === "forest-signal" || theme === "cobalt-grid";

  return (
    <section id="skills" className="section-shell px-4 py-20 sm:px-6">
      <div
        ref={ref}
        className={`mx-auto w-full max-w-6xl transition-all duration-700 ${isVisible ? "reveal-in" : "reveal-out"}`}
      >
        <p className="section-kicker">Skills</p>
        <h2 className="section-title">Tools and systems I work with.</h2>

        <div className={`mt-8 grid gap-4 sm:mt-10 ${editorial ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {settings.skillGroups.map((group) => (
            <article
              key={group.title}
              className={`soft-card p-5 sm:p-6 ${
                minimal
                  ? "rounded-md border border-border/35"
                  : structured
                    ? "rounded-2xl border-t-2 border-t-primary/60"
                    : "rounded-2xl"
              }`}
            >
              <h3 className="text-lg font-semibold tracking-tight">{group.title}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className={`px-3 py-2 text-xs font-medium text-foreground/85 ${
                      editorial ? "rounded-md bg-secondary/85" : "rounded-lg bg-secondary/85"
                    }`}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
