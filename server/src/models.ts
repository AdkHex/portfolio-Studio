export interface NavLinkItem {
  label: string;
  href: string;
  id: string;
  visible: boolean;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface AboutCard {
  title: string;
  body: string;
}

export interface CustomSectionCard {
  meta: string;
  title: string;
  body: string;
}

export interface CustomSection {
  id: string;
  kicker: string;
  title: string;
  description: string;
  cards: CustomSectionCard[];
}

export interface SkillGroup {
  title: string;
  skills: string[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export type CtaStyle = "primary" | "secondary" | "outline";
export type PortfolioTheme =
  | "neon-grid"
  | "ocean-slate"
  | "amber-editor"
  | "forest-signal"
  | "mono-slate"
  | "midnight-luxe"
  | "sandstone-pro"
  | "cobalt-grid"
  | "graphite-sunset";

export interface CtaButton {
  label: string;
  href: string;
  style: CtaStyle;
}

export interface SiteSettings {
  id: number;
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  seoTitle: string;
  seoDescription: string;
  socialPreviewTitle: string;
  socialPreviewDesc: string;
  portfolioTheme: PortfolioTheme;
  navbarLinks: NavLinkItem[];
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroHighlights: string[];
  heroStats: HeroStat[];
  aboutTitle: string;
  aboutDescription: string;
  aboutCards: AboutCard[];
  projectsKicker: string;
  projectsTitle: string;
  projectsDescription: string;
  customSections: CustomSection[];
  skillGroups: SkillGroup[];
  contactTitle: string;
  contactDescription: string;
  contactEmail: string;
  socialLinks: SocialLink[];
  footerText: string;
  ctaButtons: CtaButton[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  techStack: string[];
  thumbnailUrl: string | null;
  gallery: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  downloadUrl: string | null;
  customLinks: ProjectLink[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = "unread" | "read" | "archived";
