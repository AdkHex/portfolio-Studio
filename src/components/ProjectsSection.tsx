import { useMemo, useState } from "react";
import { ArrowUpRight, Github, Link as LinkIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { Project, SiteSettings } from "@/types/cms";

interface Props {
  projects: Project[];
  settings: SiteSettings;
}

const ProjectsSection = ({ projects, settings }: Props) => {
  const { ref, isVisible } = useScrollReveal();
  const [filter, setFilter] = useState<string>("all");
  const theme = document.documentElement.getAttribute("data-portfolio-theme") || "neon-grid";
  const editorial = theme === "amber-editor" || theme === "sandstone-pro";
  const minimal = theme === "mono-slate" || theme === "midnight-luxe";
  const structured = theme === "forest-signal" || theme === "cobalt-grid";

  const filters = useMemo(() => {
    const categories = Array.from(new Set(projects.map((project) => project.category)));
    return ["all", ...categories];
  }, [projects]);

  const visibleProjects = useMemo(
    () => projects.filter((project) => filter === "all" || project.category === filter),
    [filter, projects]
  );

  return (
    <section id="projects" className="section-shell px-4 py-20 sm:px-6">
      <div
        ref={ref}
        className={`mx-auto w-full max-w-6xl transition-all duration-700 ${isVisible ? "reveal-in" : "reveal-out"}`}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="section-kicker">{settings.projectsKicker}</p>
            <h2 className="section-title">{settings.projectsTitle}</h2>
            {settings.projectsDescription ? <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{settings.projectsDescription}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  filter === item
                    ? "bg-primary text-primary-foreground"
                    : minimal
                      ? "rounded-md border border-border/35 bg-card/55 text-muted-foreground hover:text-foreground"
                      : "bg-card/65 text-muted-foreground shadow-[0_6px_16px_hsl(var(--background)/0.2)] hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-8 grid gap-4 sm:mt-10 ${editorial ? "lg:grid-cols-2" : ""}`}>
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={`soft-card p-5 sm:p-6 ${
                minimal
                  ? "rounded-md border border-border/35"
                  : structured
                    ? "rounded-2xl border-l-4 border-l-primary"
                    : "rounded-2xl"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{project.category}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{project.title}</h3>
                  <p className="mt-2 text-sm font-medium text-foreground/85">{project.subtitle}</p>
                  <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground ${
                        minimal ? "rounded-md border border-border/35 bg-secondary/45" : "rounded-lg bg-secondary/70"
                      }`}
                    >
                      <Github size={14} /> Source
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-95"
                    >
                      Live <ArrowUpRight size={14} />
                    </a>
                  )}
                  {!project.liveUrl && project.downloadUrl && (
                    <a
                      href={project.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-95"
                    >
                      Download <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {project.techStack.map((tag) => (
                  <li
                    key={tag}
                    className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${
                      editorial ? "rounded-md bg-secondary/85" : "rounded-full bg-secondary/85"
                    }`}
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              {project.customLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.customLinks.map((item) => (
                    <a
                      key={`${project.id}-${item.href}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground ${
                        minimal ? "rounded-md border border-border/35 bg-secondary/45" : "rounded-lg bg-secondary/70"
                      }`}
                    >
                      <LinkIcon size={12} /> {item.label}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
