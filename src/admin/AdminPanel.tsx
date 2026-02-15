import { useCallback, useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload
} from "lucide-react";
import { api } from "@/lib/api";
import { bumpContentVersion } from "@/lib/content-sync";
import { PORTFOLIO_THEMES } from "@/lib/portfolio-themes";
import type { ContactMessage, DashboardStats, Project, SiteSettings } from "@/types/cms";

type Tab = "dashboard" | "settings" | "themes" | "projects" | "messages";
type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const shell = "rounded-2xl bg-card/55 shadow-[0_14px_28px_hsl(var(--background)/0.22)]";
const inputBase =
  "h-11 w-full rounded-xl border border-border/40 bg-background/65 px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const textareaBase =
  "min-h-24 w-full rounded-xl border border-border/40 bg-background/65 px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

const tabs: Array<{ id: Tab; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "settings", label: "Content", icon: Settings },
  { id: "themes", label: "Themes / UI", icon: Palette },
  { id: "projects", label: "Projects", icon: FolderKanban },
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

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const [messageSearch, setMessageSearch] = useState("");
  const [messageStatus, setMessageStatus] = useState("all");
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string | "new" | "">("");
  const [projectDraft, setProjectDraft] = useState<Omit<Project, "id" | "createdAt" | "updatedAt">>(blankProject());

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );

  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [projects]);
  const recentMessages = useMemo(() => messages.slice(0, 5), [messages]);

  const clearAlerts = () => {
    setError("");
  };

  const pushToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2200);
  }, []);

  const loadAll = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [dashboardData, settingsData, projectsData, messagesData] = await Promise.all([
        api.getDashboard(),
        api.getSettings(),
        api.getProjects(),
        api.getMessages()
      ]);

      setDashboard(dashboardData);
      setSettings(settingsData);
      setProjects(projectsData);
      setMessages(messagesData);
      if (messagesData[0]) {
        setSelectedMessageId((current) => current || messagesData[0].id);
      }
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin data.");
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex,nofollow,noarchive";
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.me();
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthed) {
      loadAll("initial");
    } else {
      setLoading(false);
    }
  }, [isAuthed, loadAll]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    const timeout = setTimeout(() => {
      api
        .getMessages(messageSearch, messageStatus)
        .then(setMessages)
        .catch(() => undefined);
    }, 250);

    return () => clearTimeout(timeout);
  }, [isAuthed, messageSearch, messageStatus]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    const onFocus = () => loadAll("refresh");
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadAll("refresh");
      }
    };

    const interval = window.setInterval(() => loadAll("refresh"), 45000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthed, loadAll]);

  useEffect(() => {
    if (!messages.length) {
      if (selectedMessageId) {
        setSelectedMessageId("");
      }
      return;
    }

    if (!messages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    clearAlerts();

    try {
      await api.login({ email, password });
      setPassword("");
      setIsAuthed(true);
      pushToast("Signed in.", "success");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
      pushToast("Login failed.", "error");
    }
  };

  const logout = async () => {
    await api.logout();
    setIsAuthed(false);
    setDashboard(null);
    setSettings(null);
    setProjects([]);
    setMessages([]);
    pushToast("Logged out.", "success");
  };

  const saveSettings = async () => {
    if (!settings) {
      return;
    }

    clearAlerts();
    try {
      const saved = await api.saveSettings(sanitizeSettings(settings));
      setSettings(saved);
      setDashboard(await api.getDashboard());
      bumpContentVersion();
      pushToast("Content saved.", "success");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings.");
      pushToast("Could not save content.", "error");
    }
  };

  const startNewProject = () => {
    setEditingProjectId("new");
    setProjectDraft({ ...blankProject(), sortOrder: projects.length });
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = project;
    setProjectDraft(rest);
  };

  const saveProject = async () => {
    clearAlerts();

    try {
      const payload = sanitizeProjectDraft(projectDraft);
      if (editingProjectId === "new") {
        const created = await api.createProject(payload);
        setProjects((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
      } else if (editingProjectId) {
        const updated = await api.updateProject(editingProjectId, payload);
        setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }

      setEditingProjectId("");
      setProjectDraft(blankProject());
      setDashboard(await api.getDashboard());
      bumpContentVersion();
      pushToast("Project saved.", "success");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to save project.");
      pushToast("Could not save project.", "error");
    }
  };

  const removeProject = async (id: string) => {
    if (!window.confirm("Delete this project?")) {
      return;
    }

    clearAlerts();
    try {
      await api.deleteProject(id);
      setProjects((current) => current.filter((item) => item.id !== id));
      setDashboard(await api.getDashboard());
      bumpContentVersion();
      pushToast("Project deleted.", "success");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to delete project.");
      pushToast("Could not delete project.", "error");
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
      await api.reorderProjects(normalized.map((item) => ({ id: item.id, sortOrder: item.sortOrder })));
      bumpContentVersion();
      pushToast("Project order updated.", "success");
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Failed to reorder projects.");
      pushToast("Could not reorder projects.", "error");
      loadAll("refresh");
    }
  };

  const uploadProjectImage = async (file: File) => {
    clearAlerts();
    try {
      const uploaded = await api.uploadFile(file);
      setProjectDraft((current) => ({ ...current, thumbnailUrl: uploaded.url }));
      pushToast("Image uploaded.", "success");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      pushToast("Upload failed.", "error");
    }
  };

  const updateMessageStatus = async (id: string, status: "unread" | "read" | "archived") => {
    clearAlerts();
    try {
      const updated = await api.setMessageStatus(id, status);
      setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setDashboard(await api.getDashboard());
      pushToast("Message updated.", "success");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to update message.");
      pushToast("Could not update message.", "error");
    }
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    clearAlerts();
    try {
      await api.deleteMessage(id);
      const next = messages.filter((item) => item.id !== id);
      setMessages(next);
      setSelectedMessageId(next[0]?.id || "");
      setDashboard(await api.getDashboard());
      pushToast("Message deleted.", "success");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to delete message.");
      pushToast("Could not delete message.", "error");
    }
  };

  const refreshMessages = async () => {
    setMessagesRefreshing(true);
    clearAlerts();
    try {
      const rows = await api.getMessages(messageSearch, messageStatus);
      setMessages(rows);
      setSelectedMessageId((current) => (rows.some((item) => item.id === current) ? current : rows[0]?.id || ""));
      pushToast("Messages refreshed.", "success");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Failed to refresh messages.");
      pushToast("Could not refresh messages.", "error");
    } finally {
      setMessagesRefreshing(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-muted-foreground">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 15% 5%, hsl(var(--primary)/0.28), transparent 42%), radial-gradient(circle at 90% 85%, hsl(var(--accent)/0.18), transparent 32%)"
          }}
        />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 0%, hsl(var(--primary)/0.2), transparent 38%), radial-gradient(circle at 0% 100%, hsl(var(--accent)/0.16), transparent 34%)"
          }}
        />

        <form onSubmit={login} className={`relative z-10 w-full max-w-md p-7 sm:p-8 ${shell}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Restricted Area</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Access</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to manage projects, website text, links, and incoming messages.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputBase} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputBase}
                required
              />
            </label>

            <button
              type="submit"
              className="mt-2 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Sign In
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            <Shield size={14} /> Secure cookie auth, protected APIs, and no-index policy enabled.
          </div>
        </form>
      </div>
    );
  }

  if (!settings || !dashboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-6 sm:px-6">
        <div className="mb-5 rounded-2xl bg-card/60 px-5 py-4 shadow-[0_8px_20px_hsl(var(--background)/0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Control Center</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Portfolio Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAll("refresh")}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
          <aside className={`p-3 ${shell} lg:sticky lg:top-6 lg:h-[calc(100vh-4rem)]`}>
            <div className="mb-4 rounded-xl bg-background/45 px-3 py-3">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">CMS</p>
              <p className="mt-1 text-sm text-muted-foreground">Private management panel</p>
            </div>

            <nav className="space-y-1.5">
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      tab === item.id
                        ? "bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/0.35)]"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-5">
            {error && (
              <div
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {tab === "dashboard" && (
              <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Projects" value={String(dashboard.projectCount)} />
                  <StatCard label="Unread Messages" value={String(dashboard.unreadMessages)} />
                  <StatCard label="Last Content Update" value={new Date(dashboard.lastUpdated).toLocaleString()} valueClassName="text-base sm:text-lg" />
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className={`p-5 sm:p-6 ${shell}`}>
                    <h3 className="text-base font-semibold">Quick Actions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Jump to frequent management tasks.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <ActionCard icon={FolderKanban} title="Manage Projects" body="Create, reorder, and publish projects." onClick={() => setTab("projects")} />
                      <ActionCard icon={Inbox} title="Open Inbox" body="Read and organize incoming messages." onClick={() => setTab("messages")} />
                      <ActionCard icon={Settings} title="Edit Content" body="Update texts, links, and sections." onClick={() => setTab("settings")} />
                      <ActionCard icon={Palette} title="Change Theme UI" body="Switch portfolio visual styles and layout." onClick={() => setTab("themes")} />
                      <ActionCard icon={RefreshCw} title="Sync Data" body="Reload latest backend data." onClick={() => loadAll("refresh")} />
                    </div>
                  </div>

                  <div className={`p-5 sm:p-6 ${shell}`}>
                    <h3 className="text-base font-semibold">Recent Activity</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Projects</p>
                        <ul className="mt-2 space-y-2">
                          {recentProjects.length > 0 ? (
                            recentProjects.map((project) => (
                              <li key={project.id} className="rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm">
                                <p className="font-medium">{project.title}</p>
                                <p className="text-xs text-muted-foreground">{project.category}</p>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No projects yet.</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Messages</p>
                        <ul className="mt-2 space-y-2">
                          {recentMessages.length > 0 ? (
                            recentMessages.map((message) => (
                              <li key={message.id} className="rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm">
                                <p className="font-medium">{message.subject}</p>
                                <p className="text-xs text-muted-foreground">{message.name}</p>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No messages yet.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {tab === "settings" && (
              <section className="space-y-4">
                <SectionCard title="Site Settings">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Site Name" value={settings.siteName} onChange={(value) => setSettings({ ...settings, siteName: value })} />
                    <Input label="Tagline" value={settings.siteTagline} onChange={(value) => setSettings({ ...settings, siteTagline: value })} />
                    <Input label="SEO Title" value={settings.seoTitle} onChange={(value) => setSettings({ ...settings, seoTitle: value })} />
                    <Input
                      label="Social Preview Title"
                      value={settings.socialPreviewTitle}
                      onChange={(value) => setSettings({ ...settings, socialPreviewTitle: value })}
                    />
                  </div>
                  <div className="mt-3 grid gap-3">
                    <Textarea label="Site Description" value={settings.siteDescription} onChange={(value) => setSettings({ ...settings, siteDescription: value })} />
                    <Textarea label="SEO Description" value={settings.seoDescription} onChange={(value) => setSettings({ ...settings, seoDescription: value })} />
                    <Textarea
                      label="Social Preview Description"
                      value={settings.socialPreviewDesc}
                      onChange={(value) => setSettings({ ...settings, socialPreviewDesc: value })}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Hero">
                  <div className="grid gap-3">
                    <Input label="Badge" value={settings.heroBadge} onChange={(value) => setSettings({ ...settings, heroBadge: value })} />
                    <Textarea label="Hero Title" value={settings.heroTitle} onChange={(value) => setSettings({ ...settings, heroTitle: value })} />
                    <Textarea label="Hero Description" value={settings.heroDescription} onChange={(value) => setSettings({ ...settings, heroDescription: value })} />
                    <Textarea label="Hero Highlights (one per line)" value={settings.heroHighlights.join("\n")} onChange={(value) => setSettings({ ...settings, heroHighlights: value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
                  </div>
                </SectionCard>

                <SectionCard title="About">
                  <div className="grid gap-3">
                    <Input label="About Title" value={settings.aboutTitle} onChange={(value) => setSettings({ ...settings, aboutTitle: value })} />
                    <Textarea
                      label="About Description"
                      value={settings.aboutDescription}
                      onChange={(value) => setSettings({ ...settings, aboutDescription: value })}
                    />
                  </div>
                </SectionCard>

                <EditableList
                  title="Navbar Links"
                  rows={settings.navbarLinks}
                  onChange={(rows) => setSettings({ ...settings, navbarLinks: rows })}
                  render={(row, update, index, rows) => (
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                      <InputCompact value={row.label} onChange={(value) => update({ ...row, label: value })} placeholder="Label" />
                      <InputCompact value={row.href} onChange={(value) => update({ ...row, href: value })} placeholder="#section" />
                      <InputCompact value={row.id} onChange={(value) => update({ ...row, id: value })} placeholder="section-id" />
                      <button className="rounded-lg border border-border/70 px-2" onClick={() => update({ ...row, visible: !row.visible })}>
                        {row.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <MoveButtons
                        index={index}
                        total={rows.length}
                        onMoveUp={() => moveItem(rows, index, index - 1, (nextRows) => setSettings({ ...settings, navbarLinks: nextRows }))}
                        onMoveDown={() => moveItem(rows, index, index + 1, (nextRows) => setSettings({ ...settings, navbarLinks: nextRows }))}
                      />
                    </div>
                  )}
                  createRow={() => ({ label: "New", href: "#", id: `item-${Date.now()}`, visible: true })}
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

                <CustomSectionsEditor
                  sections={settings.customSections}
                  onChange={(sections) => setSettings({ ...settings, customSections: sections })}
                />

                <EditableList
                  title="Skill Groups"
                  rows={settings.skillGroups}
                  onChange={(rows) => setSettings({ ...settings, skillGroups: rows })}
                  render={(row, update) => (
                    <div className="grid gap-2">
                      <InputCompact value={row.title} onChange={(value) => update({ ...row, title: value })} placeholder="Group title" />
                      <InputCompact value={row.skills.join(", ")} onChange={(value) => update({ ...row, skills: value.split(",").map((item) => item.trim()) })} placeholder="React, TypeScript" />
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
                    <Textarea
                      label="Contact Description"
                      value={settings.contactDescription}
                      onChange={(value) => setSettings({ ...settings, contactDescription: value })}
                    />
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

                <button onClick={saveSettings} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                  <Save size={15} /> Save Content
                </button>
              </section>
            )}

            {tab === "themes" && (
              <section className="space-y-4">
                <SectionCard
                  title="Themes / UI"
                  description="Select a complete portfolio design style. These templates change structure, component styling, spacing rhythm, and color system while keeping your content and features intact."
                >
                  <div className="mb-4 rounded-xl bg-background/45 p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">How this works</p>
                    <p className="mt-1">
                      Pick any theme below, then click Save Theme UI. Your public portfolio keeps the same content, links, cards, and actions, only the visual system changes.
                    </p>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-2">
                    {PORTFOLIO_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings({ ...settings, portfolioTheme: theme.id })}
                        className={`rounded-xl bg-background/45 p-4 text-left transition ${
                          settings.portfolioTheme === theme.id
                            ? "ring-2 ring-primary/45"
                            : "ring-1 ring-border/35 hover:ring-primary/30"
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
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">What changes</p>
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                          {theme.changes.map((item) => (
                            <li key={`${theme.id}-${item}`}>• {item}</li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button onClick={saveSettings} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                      <Save size={15} /> Save Theme UI
                    </button>
                  </div>
                </SectionCard>
              </section>
            )}

            {tab === "projects" && (
              <section className="space-y-4">
                <SectionCard
                  title="Projects"
                  description="Add, publish, reorder, and edit project cards."
                  action={
                    <button onClick={startNewProject} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                      <Plus size={14} /> New Project
                    </button>
                  }
                >
                  <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
                    <div className="space-y-3">
                      {projects.map((project, index) => (
                        <article key={project.id} className="rounded-xl bg-background/45 p-4">
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
                            <button onClick={() => reorderProject(project.id, "up")} disabled={index === 0} className="rounded-lg border border-border/70 px-2 py-1 text-xs disabled:opacity-50"><ArrowUp size={14} /></button>
                            <button onClick={() => reorderProject(project.id, "down")} disabled={index === projects.length - 1} className="rounded-lg border border-border/70 px-2 py-1 text-xs disabled:opacity-50"><ArrowDown size={14} /></button>
                            <button onClick={() => startEditProject(project)} className="rounded-lg border border-border/70 px-3 py-1 text-xs">Edit</button>
                            <button onClick={() => removeProject(project.id)} className="rounded-lg border border-destructive/40 px-3 py-1 text-xs text-destructive"><Trash2 size={12} /></button>
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

                          <Input label="Tags (comma separated)" value={projectDraft.tags.join(", ")} onChange={(value) => setProjectDraft({ ...projectDraft, tags: value.split(",").map((item) => item.trim()) })} />
                          <Input label="Tech Stack (comma separated)" value={projectDraft.techStack.join(", ")} onChange={(value) => setProjectDraft({ ...projectDraft, techStack: value.split(",").map((item) => item.trim()) })} />

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
                            value={projectDraft.gallery.join("\n")}
                            onChange={(value) =>
                              setProjectDraft({
                                ...projectDraft,
                                gallery: value
                                  .split("\n")
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                              })
                            }
                          />

                          <Textarea
                            label="Custom Links (label|url per line)"
                            value={projectDraft.customLinks.map((item) => `${item.label}|${item.href}`).join("\n")}
                            onChange={(value) =>
                              setProjectDraft({
                                ...projectDraft,
                                customLinks: value
                                  .split("\n")
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                                  .map((line) => {
                                    const [label, href] = line.split("|");
                                    return { label: (label || "Link").trim(), href: (href || "").trim() };
                                  })
                                  .filter((item) => item.href)
                              })
                            }
                          />

                          <div className="flex flex-wrap gap-2">
                            <button onClick={saveProject} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95">
                              <Save size={14} /> Save Project
                            </button>
                            <button onClick={() => setEditingProjectId("")} className="h-10 rounded-xl border border-border/70 px-4 text-sm">
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
                  description="Search, review, and manage contact submissions."
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
                            selectedMessageId === message.id
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/70 bg-background/35 hover:border-primary/40"
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
                      {!messages.length && <p className="p-3 text-sm text-muted-foreground">No messages found.</p>}
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
                            <a href={`mailto:${selectedMessage.email}?subject=Re:${encodeURIComponent(selectedMessage.subject)}`} className="rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                              Reply
                            </a>
                          </div>
                          <p className="mt-4 whitespace-pre-line rounded-xl border border-border/70 bg-background/55 p-4 text-sm leading-relaxed">
                            {selectedMessage.message}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button onClick={() => updateMessageStatus(selectedMessage.id, "unread")} className="rounded-xl border border-border/70 px-3 py-1.5 text-xs">Mark unread</button>
                            <button onClick={() => updateMessageStatus(selectedMessage.id, "read")} className="rounded-xl border border-border/70 px-3 py-1.5 text-xs">Mark read</button>
                            <button onClick={() => updateMessageStatus(selectedMessage.id, "archived")} className="rounded-xl border border-border/70 px-3 py-1.5 text-xs">Archive</button>
                            <button onClick={() => removeMessage(selectedMessage.id)} className="rounded-xl border border-destructive/40 px-3 py-1.5 text-xs text-destructive">Delete</button>
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
          </main>
        </div>

        <div className="pointer-events-none fixed right-4 top-4 z-[70] space-y-2 sm:right-6 sm:top-6">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`min-w-[220px] rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${
                toast.type === "success"
                  ? "border-primary/35 bg-card/95 text-foreground"
                  : "border-destructive/45 bg-destructive/15 text-destructive"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <article className={`relative overflow-hidden p-5 ${shell}`}>
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-primary/15 blur-2xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${valueClassName || ""}`}>{value}</p>
    </article>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  onClick
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-xl bg-background/45 px-3 py-3 text-left transition hover:bg-background/70">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-primary">
          <Icon size={15} />
        </span>
        <span>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        </span>
      </div>
    </button>
  );
}

function SectionCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card/40 p-5 sm:p-6">
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
      {
        id: slugify(title),
        kicker: "Section",
        title,
        description: "",
        cards: []
      }
    ]);
  };

  return (
    <div className="rounded-2xl bg-card/40 p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Custom Sections</h3>
          <p className="text-xs text-muted-foreground">Create sections like Experience, Education, Services, or anything else.</p>
        </div>
        <button
          onClick={addSection}
          className="inline-flex items-center gap-1 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
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
                  const current = next[sectionIndex];
                  next[sectionIndex] = { ...current, title: value, id: current.id || slugify(value) };
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
              <InputCompact
                value={section.id}
                onChange={(value) => {
                  const next = [...sections];
                  next[sectionIndex] = { ...next[sectionIndex], id: slugify(value) };
                  onChange(next);
                }}
                placeholder="section-id"
              />
              <TextareaCompact
                value={section.description}
                onChange={(value) => {
                  const next = [...sections];
                  next[sectionIndex] = { ...next[sectionIndex], description: value };
                  onChange(next);
                }}
                placeholder="Section description"
              />
            </div>

            <div className="mt-3 space-y-2">
              {section.cards.map((card, cardIndex) => (
                <div key={`${section.id}-card-${cardIndex}`} className="rounded-lg bg-background/60 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <InputCompact
                      value={card.meta}
                      onChange={(value) => {
                        const next = [...sections];
                        const cards = [...next[sectionIndex].cards];
                        cards[cardIndex] = { ...cards[cardIndex], meta: value };
                        next[sectionIndex] = { ...next[sectionIndex], cards };
                        onChange(next);
                      }}
                      placeholder="Meta (optional)"
                    />
                    <InputCompact
                      value={card.title}
                      onChange={(value) => {
                        const next = [...sections];
                        const cards = [...next[sectionIndex].cards];
                        cards[cardIndex] = { ...cards[cardIndex], title: value };
                        next[sectionIndex] = { ...next[sectionIndex], cards };
                        onChange(next);
                      }}
                      placeholder="Card title"
                    />
                  </div>
                  <TextareaCompact
                    value={card.body}
                    onChange={(value) => {
                      const next = [...sections];
                      const cards = [...next[sectionIndex].cards];
                      cards[cardIndex] = { ...cards[cardIndex], body: value };
                      next[sectionIndex] = { ...next[sectionIndex], cards };
                      onChange(next);
                    }}
                    placeholder="Card body"
                  />
                  <button
                    onClick={() => {
                      const next = [...sections];
                      const cards = next[sectionIndex].cards.filter((_, idx) => idx !== cardIndex);
                      next[sectionIndex] = { ...next[sectionIndex], cards };
                      onChange(next);
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive"
                  >
                    <Trash2 size={12} /> Remove Card
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  const next = [...sections];
                  next[sectionIndex] = {
                    ...next[sectionIndex],
                    cards: [...next[sectionIndex].cards, { meta: "", title: "", body: "" }]
                  };
                  onChange(next);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Plus size={12} /> Add Card
              </button>
            </div>

            <button
              onClick={() => onChange(sections.filter((_, idx) => idx !== sectionIndex))}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive"
            >
              <Trash2 size={12} /> Remove Section
            </button>
          </div>
        ))}

        {!sections.length ? <p className="rounded-lg bg-background/45 p-3 text-sm text-muted-foreground">No custom sections yet. Add one to create new content blocks on your public site.</p> : null}
      </div>
    </div>
  );
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
    <div className="rounded-2xl bg-card/40 p-5 sm:p-6">
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
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
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
        .map((card) => ({
          meta: card.meta.trim(),
          title: card.title.trim(),
          body: card.body.trim()
        }))
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

function sanitizeProjectDraft(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    ...project,
    tags: cleanCommaList(project.tags),
    techStack: cleanCommaList(project.techStack)
  };
}

function cleanCommaList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}
