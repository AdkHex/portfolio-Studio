import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8)
});

export const siteCreateSchema = z.object({
  name: z.string().min(2).max(120)
});

export const billingPlanSchema = z.object({
  plan: z.enum(["free", "plus", "pro"])
});

export const siteStatusSchema = z.object({
  status: z.enum(["preview", "launched"])
});

export const messageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000)
});

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  id: z.string().min(1),
  visible: z.boolean().default(true)
});

const statSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1)
});

const aboutCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1)
});

const customSectionCardSchema = z.object({
  meta: z.string(),
  title: z.string().min(1),
  body: z.string().min(1)
});

const customSectionSchema = z.object({
  id: z.string().min(1),
  kicker: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  cards: z.array(customSectionCardSchema)
});

const skillGroupSchema = z.object({
  title: z.string().min(1),
  skills: z.array(z.string())
});

const socialLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
});

const ctaButtonSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  style: z.enum(["primary", "secondary", "outline"])
});

export const settingsSchema = z.object({
  siteName: z.string().min(1),
  siteTagline: z.string().min(1),
  siteDescription: z.string().min(1),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  socialPreviewTitle: z.string().min(1),
  socialPreviewDesc: z.string().min(1),
  portfolioTheme: z.enum([
    "neon-grid",
    "ocean-slate",
    "amber-editor",
    "forest-signal",
    "mono-slate",
    "midnight-luxe",
    "sandstone-pro",
    "cobalt-grid",
    "graphite-sunset"
  ]),
  navbarLinks: z.array(linkSchema),
  heroBadge: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDescription: z.string().min(1),
  heroHighlights: z.array(z.string().min(1)),
  heroStats: z.array(statSchema),
  aboutTitle: z.string().min(1),
  aboutDescription: z.string().min(1),
  aboutCards: z.array(aboutCardSchema),
  projectsKicker: z.string().min(1),
  projectsTitle: z.string().min(1),
  projectsDescription: z.string().min(1),
  customSections: z.array(customSectionSchema),
  skillGroups: z.array(skillGroupSchema),
  contactTitle: z.string().min(1),
  contactDescription: z.string().min(1),
  contactEmail: z.string().email(),
  socialLinks: z.array(socialLinkSchema),
  footerText: z.string().min(1),
  ctaButtons: z.array(ctaButtonSchema)
});

export const projectSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  techStack: z.array(z.string()),
  thumbnailUrl: z.string().optional().nullable(),
  gallery: z.array(z.string()),
  githubUrl: z.string().url().optional().or(z.literal("")).nullable(),
  liveUrl: z.string().url().optional().or(z.literal("")).nullable(),
  downloadUrl: z.string().url().optional().or(z.literal("")).nullable(),
  customLinks: z.array(z.object({ label: z.string(), href: z.string().url() })),
  isPublished: z.boolean(),
  sortOrder: z.number().int().nonnegative()
});

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int().nonnegative() }))
});

export const messageStatusSchema = z.object({
  status: z.enum(["unread", "read", "archived"])
});
