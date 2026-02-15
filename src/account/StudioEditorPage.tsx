import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { ArrowDown, ArrowUp, FolderKanban, Inbox, Link2, Mail, Plus, RefreshCw, Save, Settings, Trash2, Upload } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "@/lib/api";
import { bumpContentVersion } from "@/lib/content-sync";
import { PORTFOLIO_THEMES } from "@/lib/portfolio-themes";
import type { AccountSite, ContactMessage, Project, SiteSettings } from "@/types/cms";

type Tab = "content" | "projects" | "themes" | "messages";

const shell = "rounded-2xl bg-card/55 p-5 shadow-[0_14px_28px_hsl(var(--background)/0.22)] sm:p-6";
const inputBase =
  "h-11 w-full rounded-xl border border-border/40 bg-background/65 px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const textareaBase =
  "min-h-24 w-full rounded-xl border border-border/40 bg-background/65 px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

const tabs: Array<{ id: Tab; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "content", label: "Content", icon: Settings },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "themes", label: "Themes / UI", icon: Link2 },
  { id: "messages", label: "Messages", icon: Inbox }
];

const blankProject = (): Omit<Project, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  subtitle: "",
  description: "",
  category: "web",
  tags: [],
  techStack: [],
  thumbnailUrl: null,
  gallery: [],
  githubUrl: null,
  liveUrl: null,
  downloadUrl: null,
  customLinks: [],
  isPublished: true,
  sortOrder: 0
});

export default function StudioEditorPage() {
  const navigate = useNavigate();
  const { siteId = "" } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoSaveMessage, setAutoSaveMessage] = useState("");

  const [sites, setSites] = useState<AccountSite[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<Tab>("content");

  const [editingProjectId, setEditingProjectId] = useState<string | "new" | "">("");
  const [projectDraft, setProjectDraft] = useState<Omit<Project, "id" | "createdAt" | "updatedAt">>(blankProject());
  const [projectTagsInput, setProjectTagsInput] = useState("");
  const [projectTechStackInput, setProjectTechStackInput] = useState("");
  const [projectGalleryInput, setProjectGalleryInput] = useState("");
  const [projectCustomLinksInput, setProjectCustomLinksInput] = useState("");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState("");
  const [messageStatus, setMessageStatus] = useState("all");
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSettingsRef = useRef("");

  const selectedSite = useMemo(() => sites.find((site) => site.id === siteId) || null, [siteId, sites]);
  const selectedMessage = useMemo(() => messages.find((item) => item.id === selectedMessageId) || null, [messages, selectedMessageId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const me = await api.accountMe();
      setSites(me.sites);
      const target = me.sites.find((site) => site.id === siteId);
      if (!target) {
        navigate("/studio", { replace: true });
        return;
      }
      const content = await api.accountSiteContent(siteId);
      setSettings(content.settings);
      setProjects(content.projects);
      const siteMessages = await api.accountSiteMessages(siteId);
      setMessages(siteMessages);
      setSelectedMessageId(siteMessages[0]?.id || "");
      lastSavedSettingsRef.current = JSON.stringify(sanitizeSettings(content.settings));
      setAutoSaveState("idle");
      setAutoSaveMessage("");
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        navigate("/studio/login", { replace: true });
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load editor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSettings(null);
    setProjects([]);
    lastSavedSettingsRef.current = "";
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!settings || loading) {
      return;
    }

    const nextSettings = sanitizeSettings(settings);
    const nextSerialized = JSON.stringify(nextSettings);
    if (!lastSavedSettingsRef.current || nextSerialized === lastSavedSettingsRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveState("idle");
    setAutoSaveMessage("Unsaved changes...");

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveState("saving");
      setAutoSaveMessage("Saving...");
      try {
        const saved = await api.accountSaveSiteSettings(siteId, nextSettings);
        const savedSettings = sanitizeSettings(saved);
        const savedSerialized = JSON.stringify(savedSettings);
        lastSavedSettingsRef.current = savedSerialized;
        setSettings((current) => {
          if (!current) {
            return savedSettings;
          }
          const currentSerialized = JSON.stringify(sanitizeSettings(current));
          return currentSerialized === nextSerialized ? savedSettings : current;
        });
        bumpContentVersion();
        setAutoSaveState("saved");
        setAutoSaveMessage("All changes saved.");
      } catch (autoSaveError) {
        setAutoSaveState("error");
        setAutoSaveMessage(autoSaveError instanceof Error ? autoSaveError.message : "Autosave failed.");
      }
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [settings, siteId, loading]);

  useEffect(() => {
    if (!siteId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      api
        .accountSiteMessages(siteId, messageSearch, messageStatus)
        .then((rows) => {
          setMessages(rows);
          if (!rows.some((item) => item.id === selectedMessageId)) {
            setSelectedMessageId(rows[0]?.id || "");
          }
        })
        .catch(() => undefined);
    }, 250);

    return () => clearTimeout(timeout);
  }, [siteId, messageSearch, messageStatus, selectedMessageId]);

  useEffect(() => {
    if (!messages.length) {
      setSelectedMessageId("");
      return;
    }

    if (!messages.some((item) => item.id === selectedMessageId)) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const saveSettings = async () => {
    if (!settings) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    const nextSettings = sanitizeSettings(settings);
    setSaving(true);
    setError("");
    try {
      const saved = await api.accountSaveSiteSettings(siteId, nextSettings);
      setSettings(saved);
      lastSavedSettingsRef.current = JSON.stringify(sanitizeSettings(saved));
      setAutoSaveState("saved");
      setAutoSaveMessage("All changes saved.");
      bumpContentVersion();
      setNotice("Content saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save content.");
      setAutoSaveState("error");
      setAutoSaveMessage("Autosave is paused due to an error.");
    } finally {
      setSaving(false);
    }
  };

  const startNewProject = () => {
    setEditingProjectId("new");
    const draft = { ...blankProject(), sortOrder: projects.length };
    setProjectDraft(draft);
    setProjectTagsInput("");
    setProjectTechStackInput("");
    setProjectGalleryInput("");
    setProjectCustomLinksInput("");
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = project;
    setProjectDraft(rest);
    setProjectTagsInput(rest.tags.join(", "));
    setProjectTechStackInput(rest.techStack.join(", "));
    setProjectGalleryInput(rest.gallery.join("\n"));
    setProjectCustomLinksInput(rest.customLinks.map((item) => `${item.label}|${item.href}`).join("\n"));
  };

  const saveProject = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = sanitizeProjectDraft({
        ...projectDraft,
        tags: parseCommaSeparated(projectTagsInput),
        techStack: parseCommaSeparated(projectTechStackInput),
        gallery: parseLineSeparated(projectGalleryInput),
        customLinks: parseCustomLinks(projectCustomLinksInput)
      });
      if (editingProjectId === "new") {
        const created = await api.accountCreateSiteProject(siteId, payload);
        setProjects((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
      } else if (editingProjectId) {
        const updated = await api.accountUpdateSiteProject(siteId, editingProjectId, payload);
        setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }

      setEditingProjectId("");
      setProjectDraft(blankProject());
      setProjectTagsInput("");
      setProjectTechStackInput("");
      setProjectGalleryInput("");
      setProjectCustomLinksInput("");
      bumpContentVersion();
      setNotice("Project saved.");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (id: string) => {
    if (!window.confirm("Delete this project?")) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.accountDeleteSiteProject(siteId, id);
      setProjects((current) => current.filter((item) => item.id !== id));
      bumpContentVersion();
      setNotice("Project deleted.");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to delete project.");
    } finally {
      setSaving(false);
    }
  };

  const reorderProject = async (id: string, direction: "up" | "down") => {
    const index = projects.findIndex((project) => project.id === id);
    if (index < 0) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= projects.length) {
      return;
    }

    const nextProjects = [...projects];
    [nextProjects[index], nextProjects[nextIndex]] = [nextProjects[nextIndex], nextProjects[index]];
    const normalized = nextProjects.map((project, sortOrder) => ({ ...project, sortOrder }));
    setProjects(normalized);

    try {
      await api.accountReorderSiteProjects(
        siteId,
        normalized.map((item) => ({ id: item.id, sortOrder: item.sortOrder }))
      );
      bumpContentVersion();
      setNotice("Project order updated.");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to reorder projects.");
      load();
    }
  };

  const uploadProjectImage = async (file: File) => {
    setSaving(true);
    setError("");
    try {
      const uploaded = await api.accountUploadFile(file);
      setProjectDraft((current) => ({ ...current, thumbnailUrl: uploaded.url }));
      setNotice("Image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateMessageStatus = async (id: string, status: "unread" | "read" | "archived") => {
    setError("");
    try {
      const updated = await api.accountSetSiteMessageStatus(siteId, id, status);
      setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice("Message updated.");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to update message.");
    }
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    setError("");
    try {
      await api.accountDeleteSiteMessage(siteId, id);
      const next = messages.filter((item) => item.id !== id);
      setMessages(next);
      setSelectedMessageId(next[0]?.id || "");
      setNotice("Message deleted.");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to delete message.");
    }
  };

  const refreshMessages = async () => {
    setMessagesRefreshing(true);
    setError("");
    try {
      const rows = await api.accountSiteMessages(siteId, messageSearch, messageStatus);
      setMessages(rows);
      setSelectedMessageId((current) => (rows.some((item) => item.id === current) ? current : rows[0]?.id || ""));
      setNotice("Messages refreshed.");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to refresh messages.");
    } finally {
      setMessagesRefreshing(false);
    }
  };

  if (loading || !settings) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6">
        <div className="mb-4 rounded-2xl bg-card/60 px-5 py-4 shadow-[0_8px_20px_hsl(var(--background)/0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Studio Editor</p>
              <h1 className="text-2xl font-bold tracking-tight">{selectedSite?.name || "Site"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={siteId}
                onChange={(event) => navigate(`/studio/editor/${event.target.value}`)}
                className={`${inputBase} h-10 min-w-52`}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.slug})
                  </option>
                ))}
              </select>
              <Link to={`/s/${selectedSite?.slug || ""}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground">
                Preview
              </Link>
              <Link to="/studio" className="inline-flex h-10 items-center rounded-xl bg-card/70 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
                Back to Studio
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    tab === item.id ? "bg-primary text-primary-foreground" : "bg-card/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </div>
          <div
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              autoSaveState === "error"
                ? "border border-destructive/40 bg-destructive/10 text-destructive"
                : autoSaveState === "saving"
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-border/50 bg-card/60 text-muted-foreground"
            }`}
          >
            {autoSaveMessage || "Autosave ready"}
          </div>
        </div>

        {error ? <div className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        {notice ? <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">{notice}</div> : null}

        {tab === "content" && (
          <section className="space-y-4">
            <SectionCard title="Site Settings">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Site Name" value={settings.siteName} onChange={(value) => setSettings({ ...settings, siteName: value })} />
                <Input label="Tagline" value={settings.siteTagline} onChange={(value) => setSettings({ ...settings, siteTagline: value })} />
                <Input label="SEO Title" value={settings.seoTitle} onChange={(value) => setSettings({ ...settings, seoTitle: value })} />
                <Input label="Contact Email" value={settings.contactEmail} onChange={(value) => setSettings({ ...settings, contactEmail: value })} />
              </div>
              <div className="mt-3 grid gap-3">
                <Textarea label="Site Description" value={settings.siteDescription} onChange={(value) => setSettings({ ...settings, siteDescription: value })} />
                <Textarea label="SEO Description" value={settings.seoDescription} onChange={(value) => setSettings({ ...settings, seoDescription: value })} />
              </div>
            </SectionCard>

            <SectionCard title="Hero">
              <div className="grid gap-3">
                <Input label="Badge" value={settings.heroBadge} onChange={(value) => setSettings({ ...settings, heroBadge: value })} />
                <Textarea label="Hero Title" value={settings.heroTitle} onChange={(value) => setSettings({ ...settings, heroTitle: value })} />
                <Textarea label="Hero Description" value={settings.heroDescription} onChange={(value) => setSettings({ ...settings, heroDescription: value })} />
              </div>
            </SectionCard>

            <EditableList
              title="Hero Highlights"
              rows={settings.heroHighlights}
              onChange={(rows) => setSettings({ ...settings, heroHighlights: rows })}
              render={(row, update) => <InputCompact value={row} onChange={update} placeholder="Highlight" />}
              createRow={() => ""}
            />

            <EditableList
              title="Hero Stats"
              rows={settings.heroStats}
              onChange={(rows) => setSettings({ ...settings, heroStats: rows })}
              render={(row, update) => (
                <div className="grid gap-2 md:grid-cols-2">
                  <InputCompact value={row.value} onChange={(value) => update({ ...row, value })} placeholder="Value" />
                  <InputCompact value={row.label} onChange={(value) => update({ ...row, label: value })} placeholder="Label" />
                </div>
              )}
              createRow={() => ({ value: "", label: "" })}
            />

            <SectionCard title="About">
              <div className="grid gap-3">
                <Input label="About Title" value={settings.aboutTitle} onChange={(value) => setSettings({ ...settings, aboutTitle: value })} />
                <Textarea label="About Description" value={settings.aboutDescription} onChange={(value) => setSettings({ ...settings, aboutDescription: value })} />
              </div>
            </SectionCard>

            <EditableList
              title="About Cards"
              rows={settings.aboutCards}
              onChange={(rows) => setSettings({ ...settings, aboutCards: rows })}
              render={(row, update) => (
                <div className="grid gap-2">
                  <InputCompact value={row.title} onChange={(value) => update({ ...row, title: value })} placeholder="Title" />
                  <TextareaCompact value={row.body} onChange={(value) => update({ ...row, body: value })} placeholder="Body" />
                </div>
              )}
              createRow={() => ({ title: "", body: "" })}
            />

            <CustomSectionsEditor sections={settings.customSections} onChange={(sections) => setSettings({ ...settings, customSections: sections })} />

            <EditableList
              title="Skills"
              rows={settings.skillGroups}
              onChange={(rows) => setSettings({ ...settings, skillGroups: rows })}
              render={(row, update) => (
                <div className="grid gap-2">
                  <InputCompact value={row.title} onChange={(value) => update({ ...row, title: value })} placeholder="Group title" />
                  <InputCompact value={row.skills.join(", ")} onChange={(value) => update({ ...row, skills: value.split(",") })} placeholder="React, TypeScript" />
                </div>
              )}
              createRow={() => ({ title: "", skills: [] })}
            />

            <EditableList
              title="Social Links"
              rows={settings.socialLinks}
              onChange={(rows) => setSettings({ ...settings, socialLinks: rows })}
              render={(row, update) => (
                <div className="grid gap-2 md:grid-cols-2">
                  <InputCompact value={row.label} onChange={(value) => update({ ...row, label: value })} placeholder="GitHub" />
                  <InputCompact value={row.href} onChange={(value) => update({ ...row, href: value })} placeholder="https://" />
                </div>
              )}
              createRow={() => ({ label: "", href: "" })}
            />

            <SectionCard title="Contact & Footer">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Contact Title" value={settings.contactTitle} onChange={(value) => setSettings({ ...settings, contactTitle: value })} />
                <Input label="Contact Email" value={settings.contactEmail} onChange={(value) => setSettings({ ...settings, contactEmail: value })} />
              </div>
              <div className="mt-3 grid gap-3">
                <Textarea label="Contact Description" value={settings.contactDescription} onChange={(value) => setSettings({ ...settings, contactDescription: value })} />
                <Input label="Footer Text" value={settings.footerText} onChange={(value) => setSettings({ ...settings, footerText: value })} />
              </div>
            </SectionCard>

            <EditableList
              title="CTA Buttons"
              rows={settings.ctaButtons}
              onChange={(rows) => setSettings({ ...settings, ctaButtons: rows })}
              render={(row, update) => (
                <div className="grid gap-2 md:grid-cols-3">
                  <InputCompact value={row.label} onChange={(value) => update({ ...row, label: value })} placeholder="Label" />
                  <InputCompact value={row.href} onChange={(value) => update({ ...row, href: value })} placeholder="#contact or https://" />
                  <select value={row.style} onChange={(event) => update({ ...row, style: event.target.value as "primary" | "secondary" | "outline" })} className={`${inputBase} h-10`}>
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="outline">outline</option>
                  </select>
                </div>
              )}
              createRow={() => ({ label: "", href: "#", style: "primary" as const })}
            />

            <button onClick={saveSettings} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              <Save size={15} /> Save Content
            </button>
          </section>
        )}

        {tab === "themes" && (
          <section className="space-y-4">
            <SectionCard
              title="Themes / UI"
              description="Select a complete portfolio design style. Structure and colors update without breaking content or features."
            >
              <div className="grid gap-3 xl:grid-cols-2">
                {PORTFOLIO_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSettings({ ...settings, portfolioTheme: theme.id })}
                    className={`rounded-xl bg-background/45 p-4 text-left transition ${
                      settings.portfolioTheme === theme.id ? "ring-2 ring-primary/45" : "ring-1 ring-border/35 hover:ring-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold">{theme.name}</p>
                        <p className="text-xs text-primary">{theme.tagline}</p>
                      </div>
                      {settings.portfolioTheme === theme.id ? (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{theme.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Best for:</span> {theme.recommendedFor}
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {theme.changes.map((item) => (
                        <li key={`${theme.id}-${item}`}>• {item}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <button onClick={saveSettings} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  <Save size={15} /> Save Theme
                </button>
              </div>
            </SectionCard>
          </section>
        )}

        {tab === "projects" && (
          <section className="space-y-4">
            <SectionCard
              title="Projects"
              description="Create and manage project cards for this site."
              action={
                <button onClick={startNewProject} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <Plus size={14} /> New Project
                </button>
              }
            >
              <div className="mb-4 rounded-xl bg-background/45 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">Projects Section Content</h3>
                  <span className="text-xs font-medium text-muted-foreground">Autosaves automatically</span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  These fields control the public Projects heading (kicker/title/description) on the portfolio page.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Kicker" value={settings.projectsKicker} onChange={(value) => setSettings({ ...settings, projectsKicker: value })} />
                  <Input label="Title" value={settings.projectsTitle} onChange={(value) => setSettings({ ...settings, projectsTitle: value })} />
                  <Input label="Description" value={settings.projectsDescription} onChange={(value) => setSettings({ ...settings, projectsDescription: value })} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
                <div className="space-y-3">
                  {projects.map((project, index) => (
                    <article
                      key={project.id}
                      onClick={() => startEditProject(project)}
                      className={`cursor-pointer rounded-xl p-4 transition ${
                        editingProjectId === project.id
                          ? "bg-primary/10 ring-1 ring-primary/45"
                          : "bg-background/45 hover:bg-background/55"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-primary">{project.category}</p>
                          <h3 className="mt-1 text-base font-semibold">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">{project.subtitle}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${project.isPublished ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {project.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            reorderProject(project.id, "up");
                          }}
                          disabled={index === 0}
                          className="rounded-lg border border-border/70 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            reorderProject(project.id, "down");
                          }}
                          disabled={index === projects.length - 1}
                          className="rounded-lg border border-border/70 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditProject(project);
                          }}
                          className="rounded-lg border border-border/70 px-3 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeProject(project.id);
                          }}
                          className="rounded-lg border border-destructive/40 px-3 py-1 text-xs text-destructive"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="rounded-xl bg-background/45 p-4 sm:p-5">
                  <h3 className="text-lg font-semibold">{editingProjectId ? "Project Editor" : "Select or create a project"}</h3>
                  {editingProjectId ? (
                    <div className="mt-4 grid gap-3">
                      <Input label="Title" value={projectDraft.title} onChange={(value) => setProjectDraft({ ...projectDraft, title: value })} />
                      <Input label="Subtitle" value={projectDraft.subtitle} onChange={(value) => setProjectDraft({ ...projectDraft, subtitle: value })} />
                      <Textarea label="Description" value={projectDraft.description} onChange={(value) => setProjectDraft({ ...projectDraft, description: value })} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <Input label="Category" value={projectDraft.category} onChange={(value) => setProjectDraft({ ...projectDraft, category: value })} />
                        <label className="grid gap-1.5 text-sm">
                          Published
                          <select value={String(projectDraft.isPublished)} onChange={(event) => setProjectDraft({ ...projectDraft, isPublished: event.target.value === "true" })} className={inputBase}>
                            <option value="true">Published</option>
                            <option value="false">Draft</option>
                          </select>
                        </label>
                      </div>

                      <Input
                        label="Tags (comma separated)"
                        value={projectTagsInput}
                        onChange={(value) => {
                          setProjectTagsInput(value);
                          setProjectDraft({ ...projectDraft, tags: parseCommaSeparated(value) });
                        }}
                      />
                      <Input
                        label="Tech Stack (comma separated)"
                        value={projectTechStackInput}
                        onChange={(value) => {
                          setProjectTechStackInput(value);
                          setProjectDraft({ ...projectDraft, techStack: parseCommaSeparated(value) });
                        }}
                      />

                      <Input label="Thumbnail URL" value={projectDraft.thumbnailUrl || ""} onChange={(value) => setProjectDraft({ ...projectDraft, thumbnailUrl: value || null })} />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                        <Upload size={14} /> Upload Thumbnail
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              uploadProjectImage(file);
                            }
                          }}
                        />
                      </label>

                      <Input label="GitHub URL" value={projectDraft.githubUrl || ""} onChange={(value) => setProjectDraft({ ...projectDraft, githubUrl: value || null })} />
                      <Input label="Live URL" value={projectDraft.liveUrl || ""} onChange={(value) => setProjectDraft({ ...projectDraft, liveUrl: value || null })} />
                      <Input label="Download URL" value={projectDraft.downloadUrl || ""} onChange={(value) => setProjectDraft({ ...projectDraft, downloadUrl: value || null })} />

                      <Textarea
                        label="Gallery URLs (one per line)"
                        value={projectGalleryInput}
                        onChange={(value) => {
                          setProjectGalleryInput(value);
                          setProjectDraft({ ...projectDraft, gallery: parseLineSeparated(value) });
                        }}
                      />

                      <Textarea
                        label="Custom Links (label|url per line)"
                        value={projectCustomLinksInput}
                        onChange={(value) => {
                          setProjectCustomLinksInput(value);
                          setProjectDraft({ ...projectDraft, customLinks: parseCustomLinks(value) });
                        }}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button onClick={saveProject} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                          <Save size={14} /> Save Project
                        </button>
                        <button
                          onClick={() => {
                            setEditingProjectId("");
                            setProjectTagsInput("");
                            setProjectTechStackInput("");
                            setProjectGalleryInput("");
                            setProjectCustomLinksInput("");
                          }}
                          className="h-10 rounded-xl border border-border/70 px-4 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Select a project card to edit it, or create a new one.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </section>
        )}

        {tab === "messages" && (
          <section className="space-y-4">
            <SectionCard
              title="Messages"
              description="Messages submitted from this site only."
              action={
                <button onClick={refreshMessages} disabled={messagesRefreshing} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-60">
                  <RefreshCw size={13} className={messagesRefreshing ? "animate-spin" : ""} /> Refresh
                </button>
              }
            >
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <input value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search messages..." className={inputBase} />
                <select value={messageStatus} onChange={(event) => setMessageStatus(event.target.value)} className={inputBase}>
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-2 rounded-xl bg-background/45 p-3">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => setSelectedMessageId(message.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                        selectedMessageId === message.id ? "border-primary/50 bg-primary/10" : "border-border/70 bg-background/35 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{message.name}</p>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{message.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{message.email}</p>
                      <p className="mt-1 line-clamp-1 text-sm">{message.subject}</p>
                    </button>
                  ))}
                  {!messages.length && <p className="p-3 text-sm text-muted-foreground">No messages for this site yet.</p>}
                </div>

                <div className="rounded-xl bg-background/45 p-4 sm:p-5">
                  {selectedMessage ? (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            From {selectedMessage.name} ({selectedMessage.email})
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                        </div>
                        <a href={`mailto:${selectedMessage.email}?subject=Re:${encodeURIComponent(selectedMessage.subject)}`} className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                          <Mail size={14} /> Reply
                        </a>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{selectedMessage.message}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => updateMessageStatus(selectedMessage.id, "unread")} className="rounded-lg border border-border/70 px-3 py-1.5 text-xs">Unread</button>
                        <button onClick={() => updateMessageStatus(selectedMessage.id, "read")} className="rounded-lg border border-border/70 px-3 py-1.5 text-xs">Read</button>
                        <button onClick={() => updateMessageStatus(selectedMessage.id, "archived")} className="rounded-lg border border-border/70 px-3 py-1.5 text-xs">Archive</button>
                        <button onClick={() => removeMessage(selectedMessage.id)} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive">Delete</button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a message to view details.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={shell}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={inputBase} />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={textareaBase} />
    </label>
  );
}

function InputCompact({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${inputBase} h-10`} />;
}

function TextareaCompact({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${textareaBase} min-h-20`} />;
}

function EditableList<T>({
  title,
  rows,
  onChange,
  render,
  createRow
}: {
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  render: (row: T, update: (next: T) => void, index: number, rows: T[]) => ReactNode;
  createRow: () => T;
}) {
  return (
    <div className={shell}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={() => onChange([...rows, createRow()])} className="inline-flex items-center gap-1 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="rounded-xl bg-background/45 p-3">
            {render(row, (next) => onChange(rows.map((item, i) => (i === index ? next : item))), index, rows)}
            <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive">
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomSectionsEditor({
  sections,
  onChange
}: {
  sections: SiteSettings["customSections"];
  onChange: (sections: SiteSettings["customSections"]) => void;
}) {
  const addSection = () => {
    const nextIndex = sections.length + 1;
    const title = `New Section ${nextIndex}`;
    onChange([
      ...sections,
      { id: slugify(title), kicker: "Section", title, description: "", cards: [] }
    ]);
  };

  return (
    <div className={shell}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Custom Sections</h3>
        <button onClick={addSection} className="inline-flex items-center gap-1 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
          <Plus size={12} /> Add Section
        </button>
      </div>
      <div className="space-y-3">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.id}-${sectionIndex}`} className="rounded-xl bg-background/45 p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <InputCompact
                value={section.title}
                onChange={(value) => {
                  const next = [...sections];
                  next[sectionIndex] = { ...next[sectionIndex], title: value, id: slugify(value) };
                  onChange(next);
                }}
                placeholder="Section title"
              />
              <InputCompact
                value={section.kicker}
                onChange={(value) => {
                  const next = [...sections];
                  next[sectionIndex] = { ...next[sectionIndex], kicker: value };
                  onChange(next);
                }}
                placeholder="Kicker"
              />
              <MoveButtons
                index={sectionIndex}
                total={sections.length}
                onMoveUp={() => moveItem(sections, sectionIndex, sectionIndex - 1, onChange)}
                onMoveDown={() => moveItem(sections, sectionIndex, sectionIndex + 1, onChange)}
              />
            </div>

            <div className="mt-2 grid gap-2">
              <InputCompact value={section.id} onChange={(value) => {
                const next = [...sections];
                next[sectionIndex] = { ...next[sectionIndex], id: slugify(value) };
                onChange(next);
              }} placeholder="section-id" />
              <TextareaCompact value={section.description} onChange={(value) => {
                const next = [...sections];
                next[sectionIndex] = { ...next[sectionIndex], description: value };
                onChange(next);
              }} placeholder="Section description" />
            </div>

            <div className="mt-3 space-y-2">
              {section.cards.map((card, cardIndex) => (
                <div key={`${section.id}-card-${cardIndex}`} className="rounded-lg bg-background/60 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <InputCompact value={card.meta} onChange={(value) => {
                      const next = [...sections];
                      const cards = [...next[sectionIndex].cards];
                      cards[cardIndex] = { ...cards[cardIndex], meta: value };
                      next[sectionIndex] = { ...next[sectionIndex], cards };
                      onChange(next);
                    }} placeholder="Meta (optional)" />
                    <InputCompact value={card.title} onChange={(value) => {
                      const next = [...sections];
                      const cards = [...next[sectionIndex].cards];
                      cards[cardIndex] = { ...cards[cardIndex], title: value };
                      next[sectionIndex] = { ...next[sectionIndex], cards };
                      onChange(next);
                    }} placeholder="Card title" />
                  </div>
                  <TextareaCompact value={card.body} onChange={(value) => {
                    const next = [...sections];
                    const cards = [...next[sectionIndex].cards];
                    cards[cardIndex] = { ...cards[cardIndex], body: value };
                    next[sectionIndex] = { ...next[sectionIndex], cards };
                    onChange(next);
                  }} placeholder="Card body" />
                  <button onClick={() => {
                    const next = [...sections];
                    const cards = next[sectionIndex].cards.filter((_, idx) => idx !== cardIndex);
                    next[sectionIndex] = { ...next[sectionIndex], cards };
                    onChange(next);
                  }} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive">
                    <Trash2 size={12} /> Remove Card
                  </button>
                </div>
              ))}
              <button onClick={() => {
                const next = [...sections];
                next[sectionIndex] = { ...next[sectionIndex], cards: [...next[sectionIndex].cards, { meta: "", title: "", body: "" }] };
                onChange(next);
              }} className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground">
                <Plus size={12} /> Add Card
              </button>
            </div>

            <button onClick={() => onChange(sections.filter((_, idx) => idx !== sectionIndex))} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive">
              <Trash2 size={12} /> Remove Section
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoveButtons({ index, total, onMoveUp, onMoveDown }: { index: number; total: number; onMoveUp: () => void; onMoveDown: () => void }) {
  return (
    <div className="flex gap-1">
      <button onClick={onMoveUp} disabled={index === 0} className="rounded-lg border border-border/70 px-2 disabled:opacity-50"><ArrowUp size={14} /></button>
      <button onClick={onMoveDown} disabled={index === total - 1} className="rounded-lg border border-border/70 px-2 disabled:opacity-50"><ArrowDown size={14} /></button>
    </div>
  );
}

function moveItem<T>(rows: T[], from: number, to: number, setRows: (rows: T[]) => void) {
  if (to < 0 || to >= rows.length) {
    return;
  }
  const copy = [...rows];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  setRows(copy);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
}

function cleanCommaList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function parseCommaSeparated(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseLineSeparated(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseCustomLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|");
      return { label: (label || "Link").trim(), href: (href || "").trim() };
    })
    .filter((item) => item.href);
}

function sanitizeProjectDraft(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    ...project,
    tags: cleanCommaList(project.tags),
    techStack: cleanCommaList(project.techStack),
    gallery: project.gallery.map((item) => item.trim()).filter(Boolean),
    customLinks: project.customLinks
      .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
      .filter((item) => item.href)
  };
}

function sanitizeSettings(settings: SiteSettings): SiteSettings {
  const allowedThemes = new Set(PORTFOLIO_THEMES.map((theme) => theme.id));
  const skillGroups = settings.skillGroups.map((group) => ({
    ...group,
    skills: cleanCommaList(group.skills)
  }));
  const customSections = settings.customSections
    .map((section) => ({
      ...section,
      id: slugify(section.id || section.title),
      kicker: section.kicker.trim() || "Section",
      title: section.title.trim(),
      description: section.description.trim(),
      cards: section.cards
        .map((card) => ({ meta: card.meta.trim(), title: card.title.trim(), body: card.body.trim() }))
        .filter((card) => card.title && card.body)
    }))
    .filter((section) => section.title);

  return {
    ...settings,
    portfolioTheme: allowedThemes.has(settings.portfolioTheme) ? settings.portfolioTheme : "neon-grid",
    skillGroups,
    customSections
  };
}
