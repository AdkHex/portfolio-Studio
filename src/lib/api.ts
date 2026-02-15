import type {
  AccountBillingOrder,
  AccountBillingSummary,
  AccountMeResponse,
  AccountSite,
  ContactMessage,
  DashboardStats,
  Project,
  PublicContentResponse,
  SiteSettings
} from "@/types/cms";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function withApi(path: string): string {
  if (!apiBaseUrl) {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function withUploadBase(url: string | null): string | null {
  if (!url) {
    return null;
  }
  if (!apiBaseUrl || /^https?:\/\//i.test(url)) {
    return url;
  }
  if (!url.startsWith("/uploads/")) {
    return url;
  }
  return `${apiBaseUrl}${url}`;
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    thumbnailUrl: withUploadBase(project.thumbnailUrl),
    gallery: project.gallery.map((item) => withUploadBase(item) || item)
  };
}

function normalizeContent(payload: PublicContentResponse): PublicContentResponse {
  return {
    ...payload,
    projects: payload.projects.map(normalizeProject)
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withApi(url), {
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getPublicContent: async (siteSlug?: string) => {
    const payload = await request<PublicContentResponse>(`/api/public/content${siteSlug ? `?site=${encodeURIComponent(siteSlug)}` : ""}`);
    return normalizeContent(payload);
  },
  sendMessage: (payload: { name: string; email: string; subject: string; message: string }, siteSlug?: string) =>
    request<{ id: string }>(`/api/public/messages${siteSlug ? `?site=${encodeURIComponent(siteSlug)}` : ""}`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  accountSignup: (payload: { name: string; email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string }; site: { id: string; name: string; slug: string; status: string } }>(
      "/api/account/auth/signup",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  accountLogin: (payload: { email: string; password: string }) =>
    request<{ success: boolean }>("/api/account/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  accountLogout: () => request<{ success: boolean }>("/api/account/auth/logout", { method: "POST" }),
  accountMe: () => request<AccountMeResponse>("/api/account/auth/me"),
  accountSites: () => request<AccountSite[]>("/api/account/sites"),
  accountCreateSite: (payload: { name: string }) => request<AccountSite>("/api/account/sites", { method: "POST", body: JSON.stringify(payload) }),
  accountSetPlan: (plan: "free" | "plus" | "pro") =>
    request<{ success: boolean; billing: AccountBillingSummary }>("/api/account/billing/plan", { method: "POST", body: JSON.stringify({ plan }) }),
  accountCreateCheckout: (plan: "plus" | "pro") =>
    request<{ paymentUrl: string; pidx: string }>("/api/account/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) }),
  accountVerifyCheckout: (pidx: string) =>
    request<{ success: boolean; status: string; billing: AccountBillingSummary }>(`/api/account/billing/verify?pidx=${encodeURIComponent(pidx)}`),
  accountBillingOrders: () => request<AccountBillingOrder[]>("/api/account/billing/orders"),
  accountDeleteSite: (siteId: string) => request<{ success: boolean }>(`/api/account/sites/${siteId}`, { method: "DELETE" }),
  accountSetSiteStatus: (siteId: string, status: "preview" | "launched") =>
    request<AccountSite>(`/api/account/sites/${siteId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  accountSiteContent: async (siteId: string) => {
    const payload = await request<PublicContentResponse>(`/api/account/sites/${siteId}/content`);
    return normalizeContent(payload);
  },
  accountSaveSiteSettings: (siteId: string, payload: SiteSettings) =>
    request<SiteSettings>(`/api/account/sites/${siteId}/settings`, { method: "PUT", body: JSON.stringify(payload) }),
  accountSiteProjects: async (siteId: string) => {
    const projects = await request<Project[]>(`/api/account/sites/${siteId}/projects`);
    return projects.map(normalizeProject);
  },
  accountCreateSiteProject: async (siteId: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const project = await request<Project>(`/api/account/sites/${siteId}/projects`, { method: "POST", body: JSON.stringify(payload) });
    return normalizeProject(project);
  },
  accountUpdateSiteProject: async (siteId: string, id: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const project = await request<Project>(`/api/account/sites/${siteId}/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    return normalizeProject(project);
  },
  accountDeleteSiteProject: (siteId: string, id: string) => request<{ success: boolean }>(`/api/account/sites/${siteId}/projects/${id}`, { method: "DELETE" }),
  accountReorderSiteProjects: (siteId: string, items: Array<{ id: string; sortOrder: number }>) =>
    request<{ success: boolean }>(`/api/account/sites/${siteId}/projects/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ items })
    }),
  accountSiteMessages: (siteId: string, search = "", status = "all") =>
    request<ContactMessage[]>(`/api/account/sites/${siteId}/messages?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  accountSetSiteMessageStatus: (siteId: string, id: string, status: "unread" | "read" | "archived") =>
    request<ContactMessage>(`/api/account/sites/${siteId}/messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  accountDeleteSiteMessage: (siteId: string, id: string) => request<{ success: boolean }>(`/api/account/sites/${siteId}/messages/${id}`, { method: "DELETE" }),
  accountUploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(withApi("/api/account/upload"), {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const payload = (await response.json()) as { url: string };
    return { url: withUploadBase(payload.url) || payload.url };
  },

  login: (payload: { email: string; password: string }) =>
    request<{ success: boolean }>("/api/admin/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<{ user: { userId: string; email: string; role: string } }>("/api/admin/auth/me"),
  logout: () => request<{ success: boolean }>("/api/admin/auth/logout", { method: "POST" }),

  getDashboard: () => request<DashboardStats>("/api/admin/dashboard"),
  getSettings: () => request<SiteSettings>("/api/admin/settings"),
  saveSettings: (payload: SiteSettings) => request<SiteSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) }),

  getProjects: async () => {
    const projects = await request<Project[]>("/api/admin/projects");
    return projects.map(normalizeProject);
  },
  createProject: async (payload: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const project = await request<Project>("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
    return normalizeProject(project);
  },
  updateProject: async (id: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const project = await request<Project>(`/api/admin/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    return normalizeProject(project);
  },
  deleteProject: (id: string) => request<{ success: boolean }>(`/api/admin/projects/${id}`, { method: "DELETE" }),
  reorderProjects: (items: Array<{ id: string; sortOrder: number }>) =>
    request<{ success: boolean }>("/api/admin/projects/reorder", { method: "PATCH", body: JSON.stringify({ items }) }),

  getMessages: (search = "", status = "all") =>
    request<ContactMessage[]>(`/api/admin/messages?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  setMessageStatus: (id: string, status: "unread" | "read" | "archived") =>
    request<ContactMessage>(`/api/admin/messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteMessage: (id: string) => request<{ success: boolean }>(`/api/admin/messages/${id}`, { method: "DELETE" }),

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(withApi("/api/admin/upload"), {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const payload = (await response.json()) as { url: string };
    return { url: withUploadBase(payload.url) || payload.url };
  }
};
