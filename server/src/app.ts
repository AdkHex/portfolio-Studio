import path from "node:path";
import fs from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { clearAuthCookie, clearUserAuthCookie, comparePassword, hashPassword, setAuthCookie, setUserAuthCookie, signToken } from "./auth.js";
import { config } from "./config.js";
import { sendVerificationEmail } from "./mailer.js";
import { noIndexAdmin, requireAdmin, requireUser } from "./middleware.js";
import type { AuthRequest } from "./types.js";
import {
  billingPlanSchema,
  loginSchema,
  messageSchema,
  messageStatusSchema,
  projectSchema,
  reorderSchema,
  resendVerificationSchema,
  settingsSchema,
  signupSchema,
  siteCreateSchema,
  siteStatusSchema
} from "./validators.js";
import {
  bootstrapDatabase,
  createSiteForUser,
  createUserAccount,
  createBillingOrder,
  createMessage,
  createSiteProject,
  createProject,
  dashboardStats,
  deleteSiteForUser,
  deleteMessage,
  deleteSiteMessage,
  deleteSiteProject,
  deleteProject,
  getAdminByEmail,
  getSiteBySlug,
  getBillingOrderByProviderRef,
  getSiteSettings,
  getUserByEmail,
  saveEmailVerificationToken,
  getSettings,
  listSitesForUser,
  listMessages,
  listBillingOrdersForUser,
  listSiteMessages,
  listSiteProjects,
  listProjects,
  getUserBillingSummary,
  reorderSiteProjects,
  reorderProjects,
  saveSiteSettings,
  saveSettings,
  updateSiteStatusForOwner,
  setUserPlan,
  updateBillingOrderByProviderRef,
  userHasSiteAccess,
  updateSiteProject,
  updateMessageStatus,
  updateSiteMessageStatus,
  updateProject,
  verifyUserEmailByTokenHash
} from "./db.js";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    cb(null, safe);
  }
});

const upload = multer({ storage });

const seedHashPromise = hashPassword(config.adminPassword);
seedHashPromise.then((hash) => bootstrapDatabase(config.adminEmail.toLowerCase(), hash));

export const app = express();

const allowedOrigins = config.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    }
  })
);
app.use("/uploads", express.static(uploadDir));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again later." }
});

function priceForPlan(plan: "plus" | "pro") {
  return plan === "plus" ? config.plusAmountNpr : config.proAmountNpr;
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildVerificationUrl(token: string) {
  return `${config.appBaseUrl}/studio/verify-email?token=${encodeURIComponent(token)}`;
}

async function issueVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  saveEmailVerificationToken({ userId: user.id, tokenHash, expiresAt });
  await sendVerificationEmail({ to: user.email, userName: user.name, verifyUrl: buildVerificationUrl(token) });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/public/content", async (_req, res) => {
  await seedHashPromise;
  const slug = typeof _req.query.site === "string" ? _req.query.site : "";
  if (slug) {
    const site = getSiteBySlug(slug);
    if (site) {
      return res.json({ settings: getSiteSettings(site.id), projects: listSiteProjects(site.id, true) });
    }
  }

  res.json({ settings: getSettings(), projects: listProjects(true) });
});

app.post("/api/public/messages", (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }
  const slug = typeof req.query.site === "string" ? req.query.site : "";
  const site = slug ? getSiteBySlug(slug) : null;
  return res.status(201).json(createMessage(parsed.data, site?.id || null));
});

app.post("/api/account/auth/signup", loginLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const existing = getUserByEmail(parsed.data.email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = createUserAccount({
    email: parsed.data.email.toLowerCase(),
    passwordHash,
    name: parsed.data.name.trim()
  });
  const site = createSiteForUser({ userId: user.id, name: "My Portfolio" });
  await issueVerificationEmail({ id: user.id, email: user.email, name: user.name });
  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    site: { id: site.id, name: site.name, slug: site.slug, status: site.status },
    requiresEmailVerification: true
  });
});

app.post("/api/account/auth/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const user = getUserByEmail(parsed.data.email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.emailVerified) {
    await issueVerificationEmail({ id: user.id, email: user.email, name: user.name });
    return res.status(403).json({ error: "Please verify your email before signing in.", code: "EMAIL_NOT_VERIFIED" });
  }

  const token = signToken({ userId: user.id, email: user.email, role: "user", scope: "user" });
  setUserAuthCookie(res, token);
  return res.json({ success: true });
});

app.post("/api/account/auth/resend-verification", loginLimiter, async (req, res) => {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const user = getUserByEmail(parsed.data.email.toLowerCase());
  if (!user) {
    return res.json({ success: true });
  }
  if (user.emailVerified) {
    return res.json({ success: true });
  }

  await issueVerificationEmail({ id: user.id, email: user.email, name: user.name });
  return res.json({ success: true });
});

app.get("/api/account/auth/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token) {
    return res.status(400).json({ error: "Missing verification token." });
  }

  const user = verifyUserEmailByTokenHash(hashVerificationToken(token));
  if (!user) {
    return res.status(400).json({ error: "Verification link is invalid or expired." });
  }

  const authToken = signToken({ userId: user.id, email: user.email, role: "user", scope: "user" });
  setUserAuthCookie(res, authToken);
  return res.json({ success: true });
});

app.post("/api/account/auth/logout", (_req, res) => {
  clearUserAuthCookie(res);
  return res.json({ success: true });
});

app.get("/api/account/auth/me", requireUser, (req, res) => {
  const auth = (req as AuthRequest).auth!;
  const sites = listSitesForUser(auth.userId);
  const billing = getUserBillingSummary(auth.userId);
  return res.json({ user: auth, sites, billing });
});

app.get("/api/account/sites", requireUser, (req, res) => {
  const auth = (req as AuthRequest).auth!;
  return res.json(listSitesForUser(auth.userId));
});

app.post("/api/account/sites", requireUser, (req, res) => {
  const parsed = siteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const auth = (req as AuthRequest).auth!;
  const billing = getUserBillingSummary(auth.userId);
  if (!billing.canCreateSite) {
    return res.status(403).json({
      error: `Site limit reached for ${billing.plan} plan.`,
      code: "SITE_LIMIT_REACHED",
      billing
    });
  }

  const site = createSiteForUser({ userId: auth.userId, name: parsed.data.name.trim() });
  return res.status(201).json({
    id: site.id,
    ownerUserId: site.owner_user_id,
    name: site.name,
    slug: site.slug,
    status: site.status,
    createdAt: site.created_at,
    updatedAt: site.updated_at
  });
});

app.post("/api/account/billing/upgrade", requireUser, (req, res) => {
  return res.status(410).json({ error: "Deprecated endpoint. Use /api/account/billing/checkout." });
});

app.post("/api/account/billing/plan", requireUser, (req, res) => {
  const parsed = billingPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const auth = (req as AuthRequest).auth!;
  if (parsed.data.plan !== "free") {
    return res.status(403).json({ error: "Paid plans require checkout.", code: "CHECKOUT_REQUIRED" });
  }
  const billing = setUserPlan(auth.userId, parsed.data.plan);
  return res.json({ success: true, billing });
});

app.post("/api/account/billing/checkout", requireUser, async (req, res) => {
  const parsed = billingPlanSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.plan === "free") {
    return res.status(400).json({ error: "Invalid plan for checkout." });
  }
  if (!config.khaltiSecretKey) {
    return res.status(503).json({ error: "Payment provider is not configured yet." });
  }

  const auth = (req as AuthRequest).auth!;
  const amountNpr = priceForPlan(parsed.data.plan);
  const websiteUrl = config.appBaseUrl;
  const returnUrl = `${config.appBaseUrl}/studio/billing/callback`;
  const purchaseOrderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const purchaseOrderName = `${parsed.data.plan.toUpperCase()} plan`;
  const displayName = auth.email.split("@")[0] || "user";

  const initRes = await fetch(`${config.khaltiBaseUrl}/api/v2/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.khaltiSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountNpr * 100,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: {
        name: displayName,
        email: auth.email,
        phone: config.khaltiFallbackPhone
      }
    })
  });

  if (!initRes.ok) {
    const payload = await initRes.json().catch(() => ({}));
    return res.status(502).json({ error: payload.detail || payload.error_key || "Failed to initiate payment." });
  }

  const initPayload = (await initRes.json()) as { pidx?: string; payment_url?: string };
  if (!initPayload.pidx || !initPayload.payment_url) {
    return res.status(502).json({ error: "Payment provider returned invalid response." });
  }

  createBillingOrder({
    userId: auth.userId,
    plan: parsed.data.plan,
    amountNpr,
    provider: "khalti",
    providerRef: initPayload.pidx,
    paymentUrl: initPayload.payment_url,
    metadata: { purchaseOrderId, purchaseOrderName }
  });

  return res.json({ paymentUrl: initPayload.payment_url, pidx: initPayload.pidx });
});

app.get("/api/account/billing/verify", requireUser, async (req, res) => {
  const pidx = typeof req.query.pidx === "string" ? req.query.pidx : "";
  if (!pidx) {
    return res.status(400).json({ error: "Missing payment reference." });
  }
  if (!config.khaltiSecretKey) {
    return res.status(503).json({ error: "Payment provider is not configured yet." });
  }

  const auth = (req as AuthRequest).auth!;
  const order = getBillingOrderByProviderRef("khalti", pidx);
  if (!order || order.user_id !== auth.userId) {
    return res.status(404).json({ error: "Order not found." });
  }
  if (order.status === "completed") {
    return res.json({ success: true, billing: getUserBillingSummary(auth.userId), status: "Completed" });
  }

  const lookupRes = await fetch(`${config.khaltiBaseUrl}/api/v2/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.khaltiSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pidx })
  });

  if (!lookupRes.ok) {
    const payload = await lookupRes.json().catch(() => ({}));
    return res.status(502).json({ error: payload.detail || payload.error_key || "Failed to verify payment." });
  }

  const lookupPayload = (await lookupRes.json()) as { status?: string };
  const paymentStatus = lookupPayload.status || "Pending";

  if (paymentStatus.toLowerCase() === "completed") {
    setUserPlan(auth.userId, order.plan);
    updateBillingOrderByProviderRef("khalti", pidx, { status: "completed", metadata: lookupPayload as Record<string, unknown> });
    return res.json({ success: true, billing: getUserBillingSummary(auth.userId), status: paymentStatus });
  }

  if (["expired", "canceled", "cancelled", "failed", "refunded"].includes(paymentStatus.toLowerCase())) {
    updateBillingOrderByProviderRef("khalti", pidx, { status: "failed", metadata: lookupPayload as Record<string, unknown> });
  } else {
    updateBillingOrderByProviderRef("khalti", pidx, { status: "initiated", metadata: lookupPayload as Record<string, unknown> });
  }

  return res.status(202).json({ success: false, status: paymentStatus, billing: getUserBillingSummary(auth.userId) });
});

app.get("/api/account/billing/orders", requireUser, (req, res) => {
  const auth = (req as AuthRequest).auth!;
  return res.json(listBillingOrdersForUser(auth.userId));
});

app.delete("/api/account/sites/:siteId", requireUser, (req, res) => {
  const auth = (req as AuthRequest).auth!;
  const siteId = getRouteParam(req as AuthRequest, "siteId");
  if (!siteId) {
    return res.status(400).json({ error: "Invalid site id" });
  }

  const role = userHasSiteAccess(auth.userId, siteId);
  if (!role) {
    return res.status(404).json({ error: "Site not found" });
  }
  if (role !== "owner") {
    return res.status(403).json({ error: "Only site owner can delete this site." });
  }

  const removed = deleteSiteForUser(auth.userId, siteId);
  if (!removed) {
    return res.status(404).json({ error: "Site not found" });
  }

  return res.json({ success: true });
});

app.patch("/api/account/sites/:siteId/status", requireUser, (req, res) => {
  const parsed = siteStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const auth = (req as AuthRequest).auth!;
  const siteId = getRouteParam(req as AuthRequest, "siteId");
  if (!siteId) {
    return res.status(400).json({ error: "Invalid site id" });
  }
  const role = userHasSiteAccess(auth.userId, siteId);
  if (!role) {
    return res.status(404).json({ error: "Site not found" });
  }
  if (role !== "owner") {
    return res.status(403).json({ error: "Only site owner can update site status." });
  }

  const billing = getUserBillingSummary(auth.userId);
  if (parsed.data.status === "launched" && !billing.canLaunch) {
    return res.status(403).json({
      error: "Free plan can preview only. Upgrade to Plus or Pro to launch.",
      code: "PLAN_LAUNCH_RESTRICTED",
      billing
    });
  }

  const site = updateSiteStatusForOwner({ userId: auth.userId, siteId, status: parsed.data.status });
  if (!site) {
    return res.status(404).json({ error: "Site not found" });
  }

  return res.json({
    id: site.id,
    ownerUserId: site.owner_user_id,
    name: site.name,
    slug: site.slug,
    status: site.status,
    createdAt: site.created_at,
    updatedAt: site.updated_at
  });
});

function getRouteParam(req: AuthRequest, key: string): string | null {
  const value = req.params[key];
  return typeof value === "string" ? value : null;
}

function assertSiteAccess(req: AuthRequest, res: express.Response): string | null {
  const auth = req.auth!;
  const siteId = getRouteParam(req, "siteId");
  if (!siteId) {
    res.status(400).json({ error: "Invalid site id" });
    return null;
  }
  const role = userHasSiteAccess(auth.userId, siteId);
  if (!role) {
    res.status(404).json({ error: "Site not found" });
    return null;
  }
  return siteId;
}

app.get("/api/account/sites/:siteId/content", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  res.json({
    settings: getSiteSettings(siteId),
    projects: listSiteProjects(siteId)
  });
});

app.put("/api/account/sites/:siteId/settings", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  res.json(saveSiteSettings(siteId, parsed.data));
});

app.get("/api/account/sites/:siteId/projects", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  res.json(listSiteProjects(siteId));
});

app.post("/api/account/sites/:siteId/projects", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = {
    ...parsed.data,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    githubUrl: parsed.data.githubUrl ?? null,
    liveUrl: parsed.data.liveUrl ?? null,
    downloadUrl: parsed.data.downloadUrl ?? null
  };

  res.status(201).json(createSiteProject(siteId, payload));
});

app.put("/api/account/sites/:siteId/projects/:id", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = {
    ...parsed.data,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    githubUrl: parsed.data.githubUrl ?? null,
    liveUrl: parsed.data.liveUrl ?? null,
    downloadUrl: parsed.data.downloadUrl ?? null
  };

  const projectId = getRouteParam(req as AuthRequest, "id");
  if (!projectId) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  res.json(updateSiteProject(siteId, projectId, payload));
});

app.delete("/api/account/sites/:siteId/projects/:id", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const projectId = getRouteParam(req as AuthRequest, "id");
  if (!projectId) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  deleteSiteProject(siteId, projectId);
  res.json({ success: true });
});

app.patch("/api/account/sites/:siteId/projects/reorder", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  reorderSiteProjects(siteId, parsed.data.items);
  res.json({ success: true });
});

app.get("/api/account/sites/:siteId/messages", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const search = typeof req.query.search === "string" ? req.query.search : "";
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  res.json(listSiteMessages(siteId, search, status));
});

app.patch("/api/account/sites/:siteId/messages/:id/status", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const parsed = messageStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const messageId = getRouteParam(req as AuthRequest, "id");
  if (!messageId) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  const updated = updateSiteMessageStatus(siteId, messageId, parsed.data.status);
  if (!updated) {
    return res.status(404).json({ error: "Message not found" });
  }

  res.json(updated);
});

app.delete("/api/account/sites/:siteId/messages/:id", requireUser, (req, res) => {
  const siteId = assertSiteAccess(req as AuthRequest, res);
  if (!siteId) {
    return;
  }

  const messageId = getRouteParam(req as AuthRequest, "id");
  if (!messageId) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  deleteSiteMessage(siteId, messageId);
  res.json({ success: true });
});

app.post("/api/account/upload", requireUser, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }

  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.post("/api/admin/auth/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const user = getAdminByEmail(parsed.data.email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);
  return res.json({ success: true });
});

app.post("/api/admin/auth/logout", noIndexAdmin, (_req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true });
});

app.get("/api/admin/auth/me", noIndexAdmin, requireAdmin, async (req, res) => {
  return res.json({ user: (req as AuthRequest).auth });
});

app.use("/api/admin", noIndexAdmin, requireAdmin);

app.get("/api/admin/dashboard", (_req, res) => {
  res.json(dashboardStats());
});

app.get("/api/admin/settings", (_req, res) => {
  res.json(getSettings());
});

app.put("/api/admin/settings", (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  res.json(saveSettings(parsed.data));
});

app.get("/api/admin/projects", (_req, res) => {
  res.json(listProjects());
});

app.post("/api/admin/projects", (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = {
    ...parsed.data,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    githubUrl: parsed.data.githubUrl ?? null,
    liveUrl: parsed.data.liveUrl ?? null,
    downloadUrl: parsed.data.downloadUrl ?? null
  };

  res.status(201).json(createProject(payload));
});

app.put("/api/admin/projects/:id", (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = {
    ...parsed.data,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    githubUrl: parsed.data.githubUrl ?? null,
    liveUrl: parsed.data.liveUrl ?? null,
    downloadUrl: parsed.data.downloadUrl ?? null
  };

  res.json(updateProject(req.params.id, payload));
});

app.delete("/api/admin/projects/:id", (req, res) => {
  deleteProject(req.params.id);
  res.json({ success: true });
});

app.patch("/api/admin/projects/reorder", (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  reorderProjects(parsed.data.items);
  res.json({ success: true });
});

app.get("/api/admin/messages", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  res.json(listMessages(search, status));
});

app.patch("/api/admin/messages/:id/status", (req, res) => {
  const parsed = messageStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const updated = updateMessageStatus(req.params.id, parsed.data.status);
  res.json(updated);
});

app.delete("/api/admin/messages/:id", (req, res) => {
  deleteMessage(req.params.id);
  res.json({ success: true });
});

app.post("/api/admin/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }

  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
