import type { Project, SiteSettings } from "@/types/cms";

const now = new Date().toISOString();

export const demoSettings: SiteSettings = {
  id: 1,
  siteName: "AdkHex",
  siteTagline: "Frontend Developer",
  siteDescription: "Demo portfolio template with sample content.",
  seoTitle: "Portfolio Demo | Portfolio Studio",
  seoDescription: "Sample portfolio page for previewing templates and themes.",
  socialPreviewTitle: "Portfolio Studio Demo",
  socialPreviewDesc: "Preview a ready-to-use portfolio template.",
  portfolioTheme: "neon-grid",
  navbarLinks: [
    { label: "About", href: "#about", id: "about", visible: true },
    { label: "Projects", href: "#projects", id: "projects", visible: true },
    { label: "Skills", href: "#skills", id: "skills", visible: true },
    { label: "Contact", href: "#contact", id: "contact", visible: true }
  ],
  heroBadge: "Available for internships and freelance",
  heroTitle: "I build modern web interfaces with clean UX.",
  heroDescription:
    "This is demo content. Replace it with your own story, skillset, and project goals from Studio without touching code.",
  heroHighlights: ["Responsive portfolio sections", "Fast editing from Studio", "Multiple visual themes"],
  heroStats: [
    { value: "8+", label: "Demo Projects" },
    { value: "3", label: "Theme Families" },
    { value: "24h", label: "Avg Response" }
  ],
  aboutTitle: "A portfolio template that feels production-ready.",
  aboutDescription:
    "Use this layout as a starting point. Every headline, card, section, and link can be updated from the Studio admin.",
  aboutCards: [
    { title: "Content-first", body: "Show your work clearly with flexible section editing." },
    { title: "Theme-ready", body: "Switch visual styles without breaking structure or functionality." },
    { title: "Client-friendly", body: "Use polished defaults to launch quickly." }
  ],
  projectsKicker: "Projects",
  projectsTitle: "Featured demo work.",
  projectsDescription: "These are sample cards to show final website presentation.",
  customSections: [],
  skillGroups: [
    { title: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS", "Vite"] },
    { title: "Backend", skills: ["Node.js", "Express", "REST APIs"] },
    { title: "Tools", skills: ["Git", "Figma", "Postman"] }
  ],
  contactTitle: "Let’s collaborate.",
  contactDescription: "This contact form is active and connected to your backend message inbox.",
  contactEmail: "hello@portfolio-demo.com",
  socialLinks: [
    { label: "GitHub", href: "https://github.com/example" },
    { label: "LinkedIn", href: "https://linkedin.com/in/example" }
  ],
  footerText: "Demo template by Portfolio Studio.",
  ctaButtons: [
    { label: "View projects", href: "#projects", style: "primary" },
    { label: "Contact me", href: "#contact", style: "secondary" },
    { label: "GitHub profile", href: "https://github.com/example", style: "outline" }
  ],
  createdAt: now,
  updatedAt: now
};

export const demoProjects: Project[] = [
  {
    id: "demo-1",
    title: "Creator Dashboard",
    subtitle: "Analytics and campaign management UI",
    description: "A full dashboard layout with reusable widgets, chart blocks, and team collaboration flows.",
    category: "web",
    tags: ["dashboard", "saas"],
    techStack: ["React", "TypeScript", "Tailwind"],
    thumbnailUrl: null,
    gallery: [],
    githubUrl: "https://github.com/example/creator-dashboard",
    liveUrl: "https://example.com/demo-dashboard",
    downloadUrl: null,
    customLinks: [],
    isPublished: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "demo-2",
    title: "Portfolio Theme Engine",
    subtitle: "Switch between premium layouts instantly",
    description: "Theme system demo with dynamic CSS variables and maintainable component-level styling.",
    category: "frontend",
    tags: ["design-system", "theming"],
    techStack: ["TypeScript", "CSS Variables", "React Router"],
    thumbnailUrl: null,
    gallery: [],
    githubUrl: "https://github.com/example/theme-engine",
    liveUrl: "https://example.com/demo-theme",
    downloadUrl: null,
    customLinks: [],
    isPublished: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "demo-3",
    title: "Client Onboarding Portal",
    subtitle: "Guided intake and document flow",
    description: "A clean onboarding workflow with status tracking, upload steps, and communication shortcuts.",
    category: "product",
    tags: ["onboarding", "workflow"],
    techStack: ["React", "Node.js", "SQLite"],
    thumbnailUrl: null,
    gallery: [],
    githubUrl: "https://github.com/example/onboarding-portal",
    liveUrl: null,
    downloadUrl: null,
    customLinks: [],
    isPublished: true,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now
  }
];
