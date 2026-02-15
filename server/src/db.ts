import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { MessageStatus, Project, SiteSettings } from "./models.js";
import { createStudioTemplateSettings, defaultSettings } from "./defaults.js";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "portfolio.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verified_at TEXT,
  email_verification_token_hash TEXT,
  email_verification_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS site_memberships (
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, site_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_site_settings (
  site_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  thumbnail_url TEXT,
  gallery TEXT NOT NULL,
  github_url TEXT,
  live_url TEXT,
  download_url TEXT,
  custom_links TEXT NOT NULL,
  is_published INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_projects (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  thumbnail_url TEXT,
  gallery TEXT NOT NULL,
  github_url TEXT,
  live_url TEXT,
  download_url TEXT,
  custom_links TEXT NOT NULL,
  is_published INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  site_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS billing_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount_npr INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_ref TEXT,
  status TEXT NOT NULL,
  payment_url TEXT,
  payload TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

const messageColumns = db.prepare("PRAGMA table_info(messages)").all() as Array<{ name: string }>;
if (!messageColumns.some((column) => column.name === "site_id")) {
  db.exec("ALTER TABLE messages ADD COLUMN site_id TEXT");
}

const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
if (!userColumns.some((column) => column.name === "plan")) {
  db.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'");
}
if (!userColumns.some((column) => column.name === "email_verified")) {
  db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE users SET email_verified = 1, email_verified_at = COALESCE(email_verified_at, datetime('now'))");
}
if (!userColumns.some((column) => column.name === "email_verified_at")) {
  db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
}
if (!userColumns.some((column) => column.name === "email_verification_token_hash")) {
  db.exec("ALTER TABLE users ADD COLUMN email_verification_token_hash TEXT");
}
if (!userColumns.some((column) => column.name === "email_verification_expires_at")) {
  db.exec("ALTER TABLE users ADD COLUMN email_verification_expires_at TEXT");
}

const parseJson = <T>(value: string) => JSON.parse(value) as T;
const now = () => new Date().toISOString();

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUniqueSiteSlug(baseValue: string) {
  const base = toSlug(baseValue) || "site";
  let slug = base;
  let suffix = 1;

  while (db.prepare("SELECT id FROM sites WHERE slug = ?").get(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

function normalizeSettingsPayload(payload: Record<string, unknown>) {
  const normalized = {
    ...defaultSettings,
    ...(payload as Partial<typeof defaultSettings>)
  };

  if (!Array.isArray(normalized.customSections)) {
    const legacyTitle = typeof payload.experienceTitle === "string" ? payload.experienceTitle : "";
    const legacyDescription = typeof payload.experienceDescription === "string" ? payload.experienceDescription : "";
    const legacyCardsRaw = Array.isArray(payload.experienceCards) ? payload.experienceCards : [];
    const legacyCards = legacyCardsRaw
      .map((item) => {
        const card = item as { period?: unknown; title?: unknown; body?: unknown };
        return {
          meta: typeof card.period === "string" ? card.period : "",
          title: typeof card.title === "string" ? card.title : "",
          body: typeof card.body === "string" ? card.body : ""
        };
      })
      .filter((item) => item.title && item.body);

    normalized.customSections = legacyTitle
      ? [
          {
            id: toSlug(legacyTitle) || "section",
            kicker: "Section",
            title: legacyTitle,
            description: legacyDescription,
            cards: legacyCards
          }
        ]
      : [];
  }

  normalized.customSections = normalized.customSections.map((section) => ({
    id: toSlug(section.id || section.title || "section") || "section",
    kicker: section.kicker || "Section",
    title: section.title || "Untitled section",
    description: section.description || "",
    cards: Array.isArray(section.cards)
      ? section.cards
          .map((card) => ({
            meta: card.meta || "",
            title: card.title || "",
            body: card.body || ""
          }))
          .filter((card) => card.title && card.body)
      : []
  }));

  const allowedThemes = new Set([
    "neon-grid",
    "ocean-slate",
    "amber-editor",
    "forest-signal",
    "mono-slate",
    "midnight-luxe",
    "sandstone-pro",
    "cobalt-grid",
    "graphite-sunset"
  ]);
  if (!allowedThemes.has(String(normalized.portfolioTheme || ""))) {
    normalized.portfolioTheme = "neon-grid";
  }

  return normalized;
}

function ensureTenantDefaults(siteId: string) {
  const timestamp = now();
  const site = db.prepare("SELECT name FROM sites WHERE id = ?").get(siteId) as { name: string } | undefined;
  const studioTemplate = createStudioTemplateSettings(site?.name || "My Portfolio");
  const settingsRow = db.prepare("SELECT site_id, payload FROM tenant_site_settings WHERE site_id = ?").get(siteId) as
    | { site_id: string; payload: string }
    | undefined;
  const hasLegacyPersonalSeed = (() => {
    if (!settingsRow) {
      return false;
    }
    try {
      const payload = parseJson<Record<string, unknown>>(settingsRow.payload);
      const siteName = typeof payload.siteName === "string" ? payload.siteName.trim().toLowerCase() : "";
      const contactEmail = typeof payload.contactEmail === "string" ? payload.contactEmail.trim().toLowerCase() : "";
      return siteName === "adkhex" || contactEmail === "adkhex@gmail.com";
    } catch {
      return false;
    }
  })();

  if (!settingsRow) {
    db.prepare("INSERT INTO tenant_site_settings (site_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?)").run(
      siteId,
      JSON.stringify(studioTemplate),
      timestamp,
      timestamp
    );
  } else if (hasLegacyPersonalSeed) {
    db.prepare("UPDATE tenant_site_settings SET payload = ?, updated_at = ? WHERE site_id = ?").run(
      JSON.stringify(studioTemplate),
      timestamp,
      siteId
    );
  }

  const count = db.prepare("SELECT COUNT(*) as count FROM tenant_projects WHERE site_id = ?").get(siteId) as { count: number };
  if (count.count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO tenant_projects (
      id, site_id, title, subtitle, description, category, tags, tech_stack, thumbnail_url, gallery,
      github_url, live_url, download_url, custom_links, is_published, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sample = [
    {
      title: "Starter Portfolio Project",
      subtitle: "Edit this in your dashboard",
      description: "This sample project helps you get started with your own portfolio content.",
      category: "web",
      tags: ["starter", "portfolio"],
      techStack: ["React", "TypeScript"],
      githubUrl: null
    },
    {
      title: "Second Sample Card",
      subtitle: "Replace with your own work",
      description: "Use this as a second project placeholder to understand layout and structure.",
      category: "app",
      tags: ["sample"],
      techStack: ["API", "UI"],
      githubUrl: null
    }
  ];

  sample.forEach((item, index) => {
    insert.run(
      randomUUID(),
      siteId,
      item.title,
      item.subtitle,
      item.description,
      item.category,
      JSON.stringify(item.tags),
      JSON.stringify(item.techStack),
      null,
      JSON.stringify([]),
      item.githubUrl,
      null,
      null,
      JSON.stringify([]),
      1,
      index,
      timestamp,
      timestamp
    );
  });
}

interface ProjectRow {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string;
  tech_stack: string;
  thumbnail_url: string | null;
  gallery: string;
  github_url: string | null;
  live_url: string | null;
  download_url: string | null;
  custom_links: string;
  is_published: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface TenantProjectRow extends ProjectRow {
  site_id: string;
}

interface MessageRow {
  id: string;
  site_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: number;
  emailVerifiedAt: string | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: string | null;
  plan: "free" | "plus" | "pro";
  createdAt: string;
  updatedAt: string;
}

interface SiteRow {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BillingOrderRow {
  id: string;
  user_id: string;
  plan: "free" | "plus" | "pro";
  amount_npr: number;
  provider: string;
  provider_ref: string | null;
  status: "initiated" | "completed" | "failed";
  payment_url: string | null;
  payload: string | null;
  created_at: string;
  updated_at: string;
}

export function bootstrapDatabase(adminEmail: string, passwordHash: string) {
  const timestamp = now();

  const existingAdmin = db.prepare("SELECT id FROM admin_users WHERE email = ?").get(adminEmail) as { id: string } | undefined;
  if (!existingAdmin) {
    db.prepare(
      "INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(randomUUID(), adminEmail, passwordHash, "admin", timestamp, timestamp);
  } else {
    db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE email = ?").run(passwordHash, timestamp, adminEmail);
  }

  const settings = db.prepare("SELECT id FROM site_settings WHERE id = 1").get() as { id: number } | undefined;
  if (!settings) {
    db.prepare("INSERT INTO site_settings (id, payload, created_at, updated_at) VALUES (1, ?, ?, ?)").run(
      JSON.stringify(defaultSettings),
      timestamp,
      timestamp
    );
  }

  const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
  if (projectCount.count === 0) {
    const insert = db.prepare(`
      INSERT INTO projects (
        id, title, subtitle, description, category, tags, tech_stack, thumbnail_url, gallery,
        github_url, live_url, download_url, custom_links, is_published, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sample = [
      {
        title: "MkvBatchMux",
        subtitle: "Batch video muxing without command-line overhead",
        description: "Streamlines large MKV packaging jobs with safer defaults and queue-based processing.",
        category: "desktop",
        tags: ["desktop", "media"],
        techStack: [".NET", "FFmpeg", "MKVToolNix"],
        githubUrl: "https://github.com/AdkHex/MkvBatchMux"
      },
      {
        title: "Hybrid-DV-HDR-GUI",
        subtitle: "GUI-first Dolby Vision and HDR workflow utility",
        description: "Wraps advanced HDR and Dolby Vision tasks into an approachable interface for daily use.",
        category: "desktop",
        tags: ["desktop", "hdr"],
        techStack: ["Windows", "Media Processing", "UX"],
        githubUrl: "https://github.com/AdkHex/Hybrid-DV-HDR-GUI"
      }
    ];

    sample.forEach((item, index) => {
      insert.run(
        randomUUID(),
        item.title,
        item.subtitle,
        item.description,
        item.category,
        JSON.stringify(item.tags),
        JSON.stringify(item.techStack),
        null,
        JSON.stringify([]),
        item.githubUrl,
        null,
        null,
        JSON.stringify([]),
        1,
        index,
        timestamp,
        timestamp
      );
    });
  }
}

export function getAdminByEmail(email: string) {
  return db
    .prepare("SELECT id, email, password_hash as passwordHash, role FROM admin_users WHERE email = ?")
    .get(email) as { id: string; email: string; passwordHash: string; role: string } | undefined;
}

export function getUserByEmail(email: string) {
  return db
    .prepare(
      `SELECT id, email, password_hash as passwordHash, name,
              COALESCE(email_verified, 0) as emailVerified,
              email_verified_at as emailVerifiedAt,
              email_verification_token_hash as emailVerificationTokenHash,
              email_verification_expires_at as emailVerificationExpiresAt,
              COALESCE(plan, 'free') as plan, created_at as createdAt, updated_at as updatedAt
       FROM users WHERE email = ?`
    )
    .get(email) as UserRow | undefined;
}

export function getUserById(id: string) {
  return db
    .prepare(
      `SELECT id, email, password_hash as passwordHash, name,
              COALESCE(email_verified, 0) as emailVerified,
              email_verified_at as emailVerifiedAt,
              email_verification_token_hash as emailVerificationTokenHash,
              email_verification_expires_at as emailVerificationExpiresAt,
              COALESCE(plan, 'free') as plan, created_at as createdAt, updated_at as updatedAt
       FROM users WHERE id = ?`
    )
    .get(id) as UserRow | undefined;
}

export function createUserAccount(payload: { email: string; passwordHash: string; name: string }) {
  const timestamp = now();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, email_verified, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, payload.email, payload.passwordHash, payload.name, 0, "free", timestamp, timestamp);
  return getUserById(id)!;
}

export function saveEmailVerificationToken(payload: { userId: string; tokenHash: string; expiresAt: string }) {
  const timestamp = now();
  db.prepare(
    "UPDATE users SET email_verification_token_hash = ?, email_verification_expires_at = ?, updated_at = ? WHERE id = ?"
  ).run(payload.tokenHash, payload.expiresAt, timestamp, payload.userId);
}

export function verifyUserEmailByTokenHash(tokenHash: string) {
  const timestamp = now();
  const user = db
    .prepare(
      `SELECT id, email, password_hash as passwordHash, name,
              COALESCE(email_verified, 0) as emailVerified,
              email_verified_at as emailVerifiedAt,
              email_verification_token_hash as emailVerificationTokenHash,
              email_verification_expires_at as emailVerificationExpiresAt,
              COALESCE(plan, 'free') as plan, created_at as createdAt, updated_at as updatedAt
       FROM users
       WHERE email_verification_token_hash = ?
       LIMIT 1`
    )
    .get(tokenHash) as UserRow | undefined;

  if (!user || !user.emailVerificationExpiresAt) {
    return null;
  }

  if (new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
    return null;
  }

  db.prepare(
    "UPDATE users SET email_verified = 1, email_verified_at = ?, email_verification_token_hash = NULL, email_verification_expires_at = NULL, updated_at = ? WHERE id = ?"
  ).run(timestamp, timestamp, user.id);

  return getUserById(user.id) || null;
}

export function createSiteForUser(payload: { userId: string; name: string }) {
  const timestamp = now();
  const id = randomUUID();
  const slug = ensureUniqueSiteSlug(payload.name);

  db.prepare(
    "INSERT INTO sites (id, owner_user_id, name, slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, payload.userId, payload.name, slug, "preview", timestamp, timestamp);

  db.prepare("INSERT OR IGNORE INTO site_memberships (user_id, site_id, role, created_at) VALUES (?, ?, ?, ?)").run(
    payload.userId,
    id,
    "owner",
    timestamp
  );

  ensureTenantDefaults(id);

  return db
    .prepare("SELECT id, owner_user_id, name, slug, status, created_at, updated_at FROM sites WHERE id = ?")
    .get(id) as SiteRow;
}

export function getSiteBySlug(slug: string) {
  return db
    .prepare("SELECT id, owner_user_id, name, slug, status, created_at, updated_at FROM sites WHERE slug = ?")
    .get(slug) as SiteRow | undefined;
}

export function userHasSiteAccess(userId: string, siteId: string) {
  const row = db.prepare("SELECT role FROM site_memberships WHERE user_id = ? AND site_id = ?").get(userId, siteId) as
    | { role: string }
    | undefined;
  return row?.role || null;
}

export function listSitesForUser(userId: string) {
  const rows = db
    .prepare(
      `SELECT s.id, s.owner_user_id, s.name, s.slug, s.status, s.created_at, s.updated_at
       FROM sites s
       INNER JOIN site_memberships m ON m.site_id = s.id
       WHERE m.user_id = ?
       ORDER BY s.created_at DESC`
    )
    .all(userId) as SiteRow[];

  return rows.map((row) => ({
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

function resolveSiteLimit(plan: "free" | "plus" | "pro") {
  if (plan === "free") {
    return 1;
  }
  if (plan === "plus") {
    return 5;
  }
  return 100;
}

export function getUserBillingSummary(userId: string) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const ownedCount = db.prepare("SELECT COUNT(*) as count FROM sites WHERE owner_user_id = ?").get(userId) as { count: number };
  const plan = user.plan === "pro" || user.plan === "plus" ? user.plan : "free";
  const maxSites = resolveSiteLimit(plan);
  const canCreateSite = ownedCount.count < maxSites;

  return {
    plan,
    siteCount: ownedCount.count,
    maxSites,
    canCreateSite,
    canLaunch: plan !== "free"
  };
}

export function setUserPlan(userId: string, plan: "free" | "plus" | "pro") {
  const timestamp = now();
  db.prepare("UPDATE users SET plan = ?, updated_at = ? WHERE id = ?").run(plan, timestamp, userId);
  return getUserBillingSummary(userId);
}

export function createBillingOrder(payload: {
  userId: string;
  plan: "plus" | "pro";
  amountNpr: number;
  provider: "khalti";
  providerRef?: string;
  paymentUrl?: string;
  status?: "initiated" | "completed" | "failed";
  metadata?: Record<string, unknown>;
}) {
  const timestamp = now();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO billing_orders (
      id, user_id, plan, amount_npr, provider, provider_ref, status, payment_url, payload, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    payload.userId,
    payload.plan,
    payload.amountNpr,
    payload.provider,
    payload.providerRef || null,
    payload.status || "initiated",
    payload.paymentUrl || null,
    payload.metadata ? JSON.stringify(payload.metadata) : null,
    timestamp,
    timestamp
  );
  return id;
}

export function getBillingOrderByProviderRef(provider: "khalti", providerRef: string) {
  return db
    .prepare("SELECT * FROM billing_orders WHERE provider = ? AND provider_ref = ? ORDER BY created_at DESC LIMIT 1")
    .get(provider, providerRef) as BillingOrderRow | undefined;
}

export function updateBillingOrderByProviderRef(
  provider: "khalti",
  providerRef: string,
  patch: { status?: "initiated" | "completed" | "failed"; paymentUrl?: string; metadata?: Record<string, unknown> }
) {
  const current = getBillingOrderByProviderRef(provider, providerRef);
  if (!current) {
    return undefined;
  }
  const timestamp = now();
  db.prepare(
    "UPDATE billing_orders SET status = ?, payment_url = ?, payload = ?, updated_at = ? WHERE id = ?"
  ).run(
    patch.status || current.status,
    patch.paymentUrl ?? current.payment_url,
    patch.metadata ? JSON.stringify(patch.metadata) : current.payload,
    timestamp,
    current.id
  );
  return db.prepare("SELECT * FROM billing_orders WHERE id = ?").get(current.id) as BillingOrderRow;
}

export function listBillingOrdersForUser(userId: string) {
  const rows = db
    .prepare("SELECT * FROM billing_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(userId) as BillingOrderRow[];

  return rows.map((row) => ({
    id: row.id,
    plan: row.plan,
    amountNpr: row.amount_npr,
    provider: row.provider,
    providerRef: row.provider_ref,
    status: row.status,
    paymentUrl: row.payment_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export function updateSiteStatusForOwner(payload: { userId: string; siteId: string; status: "preview" | "launched" }) {
  const timestamp = now();
  db.prepare("UPDATE sites SET status = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?").run(
    payload.status,
    timestamp,
    payload.siteId,
    payload.userId
  );

  return db
    .prepare("SELECT id, owner_user_id, name, slug, status, created_at, updated_at FROM sites WHERE id = ?")
    .get(payload.siteId) as SiteRow | undefined;
}

export function deleteSiteForUser(userId: string, siteId: string) {
  const site = db
    .prepare("SELECT id FROM sites WHERE id = ? AND owner_user_id = ?")
    .get(siteId, userId) as { id: string } | undefined;

  if (!site) {
    return false;
  }

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM tenant_projects WHERE site_id = ?").run(siteId);
    db.prepare("DELETE FROM tenant_site_settings WHERE site_id = ?").run(siteId);
    db.prepare("DELETE FROM messages WHERE site_id = ?").run(siteId);
    db.prepare("DELETE FROM site_memberships WHERE site_id = ?").run(siteId);
    db.prepare("DELETE FROM sites WHERE id = ?").run(siteId);
  });

  transaction();
  return true;
}

export function getSettings(): SiteSettings {
  const row = db.prepare("SELECT payload, created_at as createdAt, updated_at as updatedAt FROM site_settings WHERE id = 1").get() as
    | { payload: string; createdAt: string; updatedAt: string }
    | undefined;

  if (!row) {
    throw new Error("Site settings not initialized");
  }

  return {
    id: 1,
    ...(normalizeSettingsPayload(parseJson<Record<string, unknown>>(row.payload)) as Omit<SiteSettings, "id" | "createdAt" | "updatedAt">),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function saveSettings(payload: Omit<SiteSettings, "id" | "createdAt" | "updatedAt">): SiteSettings {
  const timestamp = now();
  db.prepare("UPDATE site_settings SET payload = ?, updated_at = ? WHERE id = 1").run(JSON.stringify(payload), timestamp);
  return getSettings();
}

export function getSiteSettings(siteId: string): SiteSettings {
  ensureTenantDefaults(siteId);
  const row = db
    .prepare("SELECT payload, created_at as createdAt, updated_at as updatedAt FROM tenant_site_settings WHERE site_id = ?")
    .get(siteId) as { payload: string; createdAt: string; updatedAt: string } | undefined;

  if (!row) {
    throw new Error("Site settings not initialized");
  }

  return {
    id: 1,
    ...(normalizeSettingsPayload(parseJson<Record<string, unknown>>(row.payload)) as Omit<SiteSettings, "id" | "createdAt" | "updatedAt">),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function saveSiteSettings(siteId: string, payload: Omit<SiteSettings, "id" | "createdAt" | "updatedAt">): SiteSettings {
  ensureTenantDefaults(siteId);
  const timestamp = now();
  db.prepare("UPDATE tenant_site_settings SET payload = ?, updated_at = ? WHERE site_id = ?").run(
    JSON.stringify(payload),
    timestamp,
    siteId
  );
  return getSiteSettings(siteId);
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    tags: parseJson<string[]>(row.tags),
    techStack: parseJson<string[]>(row.tech_stack),
    thumbnailUrl: row.thumbnail_url,
    gallery: parseJson<string[]>(row.gallery),
    githubUrl: row.github_url,
    liveUrl: row.live_url,
    downloadUrl: row.download_url,
    customLinks: parseJson<Array<{ label: string; href: string }>>(row.custom_links),
    isPublished: Boolean(row.is_published),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listProjects(publicOnly = false): Project[] {
  const rows = publicOnly
    ? (db.prepare("SELECT * FROM projects WHERE is_published = 1 ORDER BY sort_order ASC").all() as ProjectRow[])
    : (db.prepare("SELECT * FROM projects ORDER BY sort_order ASC").all() as ProjectRow[]);

  return rows.map(mapProject);
}

export function listSiteProjects(siteId: string, publicOnly = false): Project[] {
  ensureTenantDefaults(siteId);
  const rows = publicOnly
    ? (db
        .prepare("SELECT * FROM tenant_projects WHERE site_id = ? AND is_published = 1 ORDER BY sort_order ASC")
        .all(siteId) as TenantProjectRow[])
    : (db.prepare("SELECT * FROM tenant_projects WHERE site_id = ? ORDER BY sort_order ASC").all(siteId) as TenantProjectRow[]);

  return rows.map(mapProject);
}

export function createSiteProject(siteId: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  ensureTenantDefaults(siteId);
  const timestamp = now();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO tenant_projects (
      id, site_id, title, subtitle, description, category, tags, tech_stack, thumbnail_url, gallery,
      github_url, live_url, download_url, custom_links, is_published, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    siteId,
    payload.title,
    payload.subtitle,
    payload.description,
    payload.category,
    JSON.stringify(payload.tags),
    JSON.stringify(payload.techStack),
    payload.thumbnailUrl,
    JSON.stringify(payload.gallery),
    payload.githubUrl,
    payload.liveUrl,
    payload.downloadUrl,
    JSON.stringify(payload.customLinks),
    payload.isPublished ? 1 : 0,
    payload.sortOrder,
    timestamp,
    timestamp
  );

  return listSiteProjects(siteId).find((item) => item.id === id)!;
}

export function updateSiteProject(siteId: string, id: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  ensureTenantDefaults(siteId);
  const timestamp = now();

  db.prepare(`
    UPDATE tenant_projects
    SET title = ?, subtitle = ?, description = ?, category = ?, tags = ?, tech_stack = ?, thumbnail_url = ?,
        gallery = ?, github_url = ?, live_url = ?, download_url = ?, custom_links = ?, is_published = ?,
        sort_order = ?, updated_at = ?
    WHERE id = ? AND site_id = ?
  `).run(
    payload.title,
    payload.subtitle,
    payload.description,
    payload.category,
    JSON.stringify(payload.tags),
    JSON.stringify(payload.techStack),
    payload.thumbnailUrl,
    JSON.stringify(payload.gallery),
    payload.githubUrl,
    payload.liveUrl,
    payload.downloadUrl,
    JSON.stringify(payload.customLinks),
    payload.isPublished ? 1 : 0,
    payload.sortOrder,
    timestamp,
    id,
    siteId
  );

  return listSiteProjects(siteId).find((item) => item.id === id)!;
}

export function deleteSiteProject(siteId: string, id: string) {
  db.prepare("DELETE FROM tenant_projects WHERE id = ? AND site_id = ?").run(id, siteId);
}

export function reorderSiteProjects(siteId: string, items: Array<{ id: string; sortOrder: number }>) {
  const update = db.prepare("UPDATE tenant_projects SET sort_order = ?, updated_at = ? WHERE id = ? AND site_id = ?");
  const transaction = db.transaction((rows: Array<{ id: string; sortOrder: number }>) => {
    const timestamp = now();
    rows.forEach((item) => update.run(item.sortOrder, timestamp, item.id, siteId));
  });

  transaction(items);
}

export function createProject(payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const timestamp = now();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO projects (
      id, title, subtitle, description, category, tags, tech_stack, thumbnail_url, gallery,
      github_url, live_url, download_url, custom_links, is_published, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    payload.title,
    payload.subtitle,
    payload.description,
    payload.category,
    JSON.stringify(payload.tags),
    JSON.stringify(payload.techStack),
    payload.thumbnailUrl,
    JSON.stringify(payload.gallery),
    payload.githubUrl,
    payload.liveUrl,
    payload.downloadUrl,
    JSON.stringify(payload.customLinks),
    payload.isPublished ? 1 : 0,
    payload.sortOrder,
    timestamp,
    timestamp
  );

  return listProjects().find((item) => item.id === id)!;
}

export function updateProject(id: string, payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const timestamp = now();

  db.prepare(`
    UPDATE projects
    SET title = ?, subtitle = ?, description = ?, category = ?, tags = ?, tech_stack = ?, thumbnail_url = ?,
        gallery = ?, github_url = ?, live_url = ?, download_url = ?, custom_links = ?, is_published = ?,
        sort_order = ?, updated_at = ?
    WHERE id = ?
  `).run(
    payload.title,
    payload.subtitle,
    payload.description,
    payload.category,
    JSON.stringify(payload.tags),
    JSON.stringify(payload.techStack),
    payload.thumbnailUrl,
    JSON.stringify(payload.gallery),
    payload.githubUrl,
    payload.liveUrl,
    payload.downloadUrl,
    JSON.stringify(payload.customLinks),
    payload.isPublished ? 1 : 0,
    payload.sortOrder,
    timestamp,
    id
  );

  return listProjects().find((item) => item.id === id)!;
}

export function deleteProject(id: string) {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function reorderProjects(items: Array<{ id: string; sortOrder: number }>) {
  const update = db.prepare("UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?");
  const transaction = db.transaction((rows: Array<{ id: string; sortOrder: number }>) => {
    const timestamp = now();
    rows.forEach((item) => update.run(item.sortOrder, timestamp, item.id));
  });

  transaction(items);
}

export function dashboardStats() {
  const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
  const unreadMessages = db.prepare("SELECT COUNT(*) as count FROM messages WHERE status = 'unread'").get() as { count: number };
  const settings = db.prepare("SELECT updated_at as updatedAt FROM site_settings WHERE id = 1").get() as { updatedAt: string };

  return {
    projectCount: projectCount.count,
    unreadMessages: unreadMessages.count,
    lastUpdated: settings.updatedAt
  };
}

export function createMessage(payload: { name: string; email: string; subject: string; message: string }, siteId: string | null = null) {
  const id = randomUUID();
  const timestamp = now();
  db.prepare(
    "INSERT INTO messages (id, site_id, name, email, subject, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, siteId, payload.name, payload.email, payload.subject, payload.message, "unread", timestamp, timestamp);

  return { id };
}

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listMessages(search = "", status = "all", siteId?: string) {
  let query = "SELECT * FROM messages";
  const conditions: string[] = [];
  const params: string[] = [];

  if (siteId) {
    conditions.push("site_id = ?");
    params.push(siteId);
  }

  if (status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }

  if (search) {
    conditions.push("(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)");
    const value = `%${search}%`;
    params.push(value, value, value, value);
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params) as MessageRow[];
  return rows.map(mapMessage);
}

export function listSiteMessages(siteId: string, search = "", status = "all") {
  return listMessages(search, status, siteId);
}

export function updateMessageStatus(id: string, status: MessageStatus) {
  const timestamp = now();
  db.prepare("UPDATE messages SET status = ?, updated_at = ? WHERE id = ?").run(status, timestamp, id);
  return listMessages().find((item) => item.id === id);
}

export function updateSiteMessageStatus(siteId: string, id: string, status: MessageStatus) {
  const timestamp = now();
  db.prepare("UPDATE messages SET status = ?, updated_at = ? WHERE id = ? AND site_id = ?").run(status, timestamp, id, siteId);
  return listMessages("", "all", siteId).find((item) => item.id === id);
}

export function deleteMessage(id: string) {
  db.prepare("DELETE FROM messages WHERE id = ?").run(id);
}

export function deleteSiteMessage(siteId: string, id: string) {
  db.prepare("DELETE FROM messages WHERE id = ? AND site_id = ?").run(id, siteId);
}
