import path from "node:path";
import { describe, expect, it } from "vitest";
import { hashPassword } from "./auth.js";

process.env.DATABASE_PATH = path.resolve(process.cwd(), `data/test-db-${Date.now()}.sqlite`);

const dbModule = await import("./db.js");

describe("database flows", () => {
  it("bootstraps settings/admin and lists public content", async () => {
    const hash = await hashPassword("StrongPass123!");
    dbModule.bootstrapDatabase("admin@test.dev", hash);

    const settings = dbModule.getSettings();
    const projects = dbModule.listProjects(true);

    expect(settings.siteName.length).toBeGreaterThan(0);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("creates and updates project and message", () => {
    const project = dbModule.createProject({
      title: "Test Project",
      subtitle: "Subtitle",
      description: "Description",
      category: "web",
      tags: ["test"],
      techStack: ["react"],
      thumbnailUrl: null,
      gallery: [],
      githubUrl: null,
      liveUrl: null,
      downloadUrl: null,
      customLinks: [],
      isPublished: true,
      sortOrder: 99
    });

    expect(project.title).toBe("Test Project");

    const message = dbModule.createMessage({
      name: "A",
      email: "a@b.com",
      subject: "S",
      message: "Hello"
    });

    const messages = dbModule.listMessages("Hello", "all");
    expect(messages.some((item) => item.id === message.id)).toBe(true);
  });

  it("creates account user and multiple sites", async () => {
    const userHash = await hashPassword("UserStrongPass123!");
    const user = dbModule.createUserAccount({
      email: "user@test.dev",
      passwordHash: userHash,
      name: "Site Owner"
    });

    const existing = dbModule.getUserByEmail("user@test.dev");
    expect(existing?.id).toBe(user.id);

    const firstSite = dbModule.createSiteForUser({ userId: user.id, name: "My Portfolio" });
    const secondSite = dbModule.createSiteForUser({ userId: user.id, name: "My Portfolio" });
    expect(firstSite.slug).toBe("my-portfolio");
    expect(secondSite.slug).not.toBe(firstSite.slug);

    const sites = dbModule.listSitesForUser(user.id);
    expect(sites.length).toBeGreaterThanOrEqual(2);

    const tenantSettings = dbModule.getSiteSettings(firstSite.id);
    expect(tenantSettings.siteName).toBe("My Portfolio");
    expect(tenantSettings.contactEmail).toBe("you@example.com");
    expect(tenantSettings.siteName).not.toBe("AdkHex");

    const billingBeforeUpgrade = dbModule.getUserBillingSummary(user.id);
    expect(billingBeforeUpgrade.plan).toBe("free");
    expect(billingBeforeUpgrade.maxSites).toBe(1);
    expect(billingBeforeUpgrade.siteCount).toBeGreaterThanOrEqual(2);
    expect(billingBeforeUpgrade.canCreateSite).toBe(false);
    expect(billingBeforeUpgrade.canLaunch).toBe(false);

    const plus = dbModule.setUserPlan(user.id, "plus");
    expect(plus.plan).toBe("plus");
    expect(plus.maxSites).toBe(5);
    expect(plus.canLaunch).toBe(true);

    const pro = dbModule.setUserPlan(user.id, "pro");
    expect(pro.plan).toBe("pro");
    expect(pro.maxSites).toBe(100);
    expect(pro.canCreateSite).toBe(true);

    const removed = dbModule.deleteSiteForUser(user.id, firstSite.id);
    expect(removed).toBe(true);

    const afterDelete = dbModule.listSitesForUser(user.id);
    expect(afterDelete.some((site) => site.id === firstSite.id)).toBe(false);
  });
});
