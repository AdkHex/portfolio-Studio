import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { AccountBillingOrder, AccountBillingSummary, AccountSessionUser, AccountSite, Project, SiteSettings } from "@/types/cms";

const SELECTED_SITE_KEY = "studio-selected-site-id";
const PLAN_OPTIONS: Array<{ id: "free" | "plus" | "pro"; name: string; price: string; limit: string; description: string }> = [
  { id: "free", name: "Free", price: "$0", limit: "1 site", description: "Preview only. Launch disabled." },
  { id: "plus", name: "Plus", price: "$50 lifetime", limit: "Up to 5 sites", description: "Good for creators with multiple portfolios." },
  { id: "pro", name: "Pro", price: "$15", limit: "Up to 100 sites", description: "Built for agencies and heavy usage." }
];

export default function StudioPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AccountSessionUser | null>(null);
  const [billing, setBilling] = useState<AccountBillingSummary | null>(null);
  const [sites, setSites] = useState<AccountSite[]>([]);
  const [billingOrders, setBillingOrders] = useState<AccountBillingOrder[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [content, setContent] = useState<{ settings: SiteSettings; projects: Project[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedSite = useMemo(() => sites.find((site) => site.id === selectedSiteId) || null, [sites, selectedSiteId]);

  const loadAccount = async () => {
    setLoading(true);
    setError("");
    try {
      const me = await api.accountMe();
      setUser(me.user);
      setBilling(me.billing);
      setSites(me.sites);
      setBillingOrders(await api.accountBillingOrders());
      const stored = window.localStorage.getItem(SELECTED_SITE_KEY);
      const fallbackId = me.sites[0]?.id || "";
      const resolved = me.sites.some((site) => site.id === stored) ? (stored as string) : fallbackId;
      setSelectedSiteId(resolved);
      if (resolved) {
        setContent(await api.accountSiteContent(resolved));
      }
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        navigate("/studio/login", { replace: true });
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load studio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSiteId) {
      return;
    }
    window.localStorage.setItem(SELECTED_SITE_KEY, selectedSiteId);
    api
      .accountSiteContent(selectedSiteId)
      .then(setContent)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load site content."));
  }, [selectedSiteId]);

  const createSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteName.trim()) {
      return;
    }
    if (billing && !billing.canCreateSite) {
      setError("Site limit reached for your plan. Upgrade Plus/Pro to create more sites.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await api.accountCreateSite({ name: siteName.trim() });
      const nextSites = [created, ...sites];
      setSites(nextSites);
      setBilling((current) =>
        current
          ? {
              ...current,
              siteCount: current.siteCount + 1,
              canCreateSite: current.siteCount + 1 < current.maxSites
            }
          : current
      );
      setSiteName("");
      setSelectedSiteId(created.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create site.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.accountLogout();
    navigate("/studio/login", { replace: true });
  };

  const setPlan = async (plan: "free" | "plus" | "pro") => {
    setBusy(true);
    setError("");
    try {
      if (plan === "free") {
        const result = await api.accountSetPlan("free");
        setBilling(result.billing);
      } else {
        const checkout = await api.accountCreateCheckout(plan);
        window.location.href = checkout.paymentUrl;
        return;
      }
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "Failed to change plan.");
    } finally {
      setBusy(false);
    }
  };

  const refreshBillingOrders = async () => {
    setBusy(true);
    setError("");
    try {
      setBillingOrders(await api.accountBillingOrders());
    } catch (ordersError) {
      setError(ordersError instanceof Error ? ordersError.message : "Failed to load billing orders.");
    } finally {
      setBusy(false);
    }
  };

  const deleteSite = async (siteToDelete: AccountSite) => {
    if (!window.confirm(`Delete "${siteToDelete.name}" and all its content?\nThis action cannot be undone.`)) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await api.accountDeleteSite(siteToDelete.id);
      const nextSites = sites.filter((site) => site.id !== siteToDelete.id);
      setSites(nextSites);
      setBilling((current) =>
        current
          ? {
              ...current,
              siteCount: Math.max(0, current.siteCount - 1),
              canCreateSite: Math.max(0, current.siteCount - 1) < current.maxSites
            }
          : current
      );
      const fallbackId = nextSites[0]?.id || "";
      setSelectedSiteId(fallbackId);
      if (fallbackId) {
        setContent(await api.accountSiteContent(fallbackId));
        window.localStorage.setItem(SELECTED_SITE_KEY, fallbackId);
      } else {
        setContent(null);
        window.localStorage.removeItem(SELECTED_SITE_KEY);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete site.");
    } finally {
      setBusy(false);
    }
  };

  const toggleLaunch = async () => {
    if (!selectedSite) {
      return;
    }
    const nextStatus = selectedSite.status === "launched" ? "preview" : "launched";
    setBusy(true);
    setError("");
    try {
      const updated = await api.accountSetSiteStatus(selectedSite.id, nextStatus);
      setSites((current) => current.map((site) => (site.id === updated.id ? updated : site)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update launch status.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading studio...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Portfolio Studio</p>
          <h1 className="text-2xl font-bold tracking-tight">Welcome {user?.email}</h1>
          {billing ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Plan: <span className="font-semibold uppercase text-foreground">{billing.plan}</span> · Sites:{" "}
              <span className="font-semibold text-foreground">
                {billing.siteCount}
                {` / ${billing.maxSites}`}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAccount} className="inline-flex items-center gap-2 rounded-xl bg-card/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={logout} className="rounded-xl bg-card/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl bg-card/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your Sites</h2>
          <div className="mt-3 space-y-2">
            {sites.map((site) => (
              <div key={site.id} className="group relative">
                <button
                  onClick={() => {
                    setSelectedSiteId(site.id);
                    navigate(`/studio/editor/${site.id}`);
                  }}
                  className={`w-full rounded-xl px-3 py-2 pr-10 text-left text-sm transition ${
                    selectedSiteId === site.id ? "bg-primary text-primary-foreground" : "bg-background/50 text-foreground hover:bg-background/80"
                  }`}
                >
                  <p className="font-semibold">{site.name}</p>
                  <p className={`text-xs ${selectedSiteId === site.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{site.slug}</p>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteSite(site);
                  }}
                  disabled={busy}
                  aria-label={`Delete ${site.name}`}
                  className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
                    selectedSiteId === site.id
                      ? "border-primary-foreground/35 text-primary-foreground/90 hover:bg-primary-foreground/15"
                      : "border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                  } opacity-0 group-hover:opacity-100 focus:opacity-100`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {!sites.length ? <p className="text-sm text-muted-foreground">No sites yet.</p> : null}
          </div>

          <form onSubmit={createSite} className="mt-4 space-y-2 rounded-xl bg-background/40 p-3">
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Create Site
              <input value={siteName} onChange={(event) => setSiteName(event.target.value)} className="h-10 rounded-lg border border-border/50 bg-background/80 px-3 text-sm outline-none transition focus:border-primary/60" placeholder="My Client Portfolio" />
            </label>
            <button type="submit" disabled={busy || Boolean(billing && !billing.canCreateSite)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60">
              <Plus size={14} /> {busy ? "Creating..." : "Create Site"}
            </button>
            {billing && !billing.canCreateSite ? (
              <p className="text-xs text-muted-foreground">
                Site limit reached. Upgrade to Plus or Pro to create more.
              </p>
            ) : null}
          </form>

          <div className="mt-4 space-y-2 rounded-xl bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Plans</p>
            {PLAN_OPTIONS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setPlan(plan.id)}
                  disabled={busy}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  billing?.plan === plan.id ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/45 hover:border-primary/35"
                }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <span className="text-xs font-semibold text-primary">{plan.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.limit} · {plan.description}</p>
                </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          {error ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

          <section className="rounded-2xl bg-card/50 p-5">
            <h2 className="text-xl font-bold tracking-tight">Site Context</h2>
            {selectedSite ? (
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Site:</span> {selectedSite.name}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Slug:</span> {selectedSite.slug}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Public Preview:</span>{" "}
                  <Link to={`/s/${selectedSite.slug}`} target="_blank" className="text-primary hover:underline">
                    /s/{selectedSite.slug}
                  </Link>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Editor:</span>{" "}
                  <Link to={`/studio/editor/${selectedSite.id}`} className="text-primary hover:underline">
                    Open studio editor
                  </Link>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Theme:</span> {content?.settings?.portfolioTheme || "loading..."}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Projects:</span> {content?.projects?.length ?? 0}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Launch Status:</span> {selectedSite.status}
                </p>
                <div className="pt-1">
                  <button
                    onClick={toggleLaunch}
                    disabled={busy || Boolean(billing && !billing.canLaunch)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                  >
                    {selectedSite.status === "launched" ? "Set Preview" : "Launch Site"}
                  </button>
                  {billing && !billing.canLaunch ? <p className="mt-1 text-xs text-muted-foreground">Free plan can preview only. Plus/Pro required to launch.</p> : null}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Create or select a site to start managing content.</p>
            )}
          </section>

          <section className="rounded-2xl bg-card/50 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold tracking-tight">Billing History</h2>
              <button onClick={refreshBillingOrders} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-60">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {billingOrders.length ? (
                billingOrders.map((order) => (
                  <div key={order.id} className="rounded-xl bg-background/45 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold uppercase">
                        {order.plan} · NPR {order.amountNpr}
                      </p>
                      <span className={`rounded-full px-2 py-1 text-[11px] ${
                        order.status === "completed"
                          ? "bg-primary/20 text-primary"
                          : order.status === "failed"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                    {order.status === "initiated" && order.paymentUrl ? (
                      <a href={order.paymentUrl} className="mt-2 inline-flex rounded-lg border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground">
                        Continue Payment
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No billing orders yet.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
