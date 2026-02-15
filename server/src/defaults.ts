import type { SiteSettings } from "./models.js";

export const defaultSettings: Omit<SiteSettings, "id" | "createdAt" | "updatedAt"> = {
  siteName: "AdkHex",
  siteTagline: "Software Engineer",
  siteDescription: "Portfolio of AdkHex",
  seoTitle: "AdkHex | Software Engineer Portfolio",
  seoDescription: "Cross-platform software engineer focused on creator tools.",
  socialPreviewTitle: "AdkHex Portfolio",
  socialPreviewDesc: "Creator-focused software projects.",
  portfolioTheme: "neon-grid",
  navbarLinks: [
    { label: "About", href: "#about", id: "about", visible: true },
    { label: "Projects", href: "#projects", id: "projects", visible: true },
    { label: "Skills", href: "#skills", id: "skills", visible: true },
    { label: "Contact", href: "#contact", id: "contact", visible: true }
  ],
  heroBadge: "Open to freelance and full-time work",
  heroTitle: "I build reliable tools for creators who care about speed.",
  heroDescription:
    "I design and ship software for video and audio workflows, with an emphasis on practical UX, predictable performance, and maintainable engineering.",
  heroHighlights: ["Cross-platform media tools", "Performance-focused desktop apps", "Modern React and TypeScript workflows"],
  heroStats: [
    { value: "2+", label: "Projects built" },
    { value: "Beginner", label: "Level" },
    { value: "Fast", label: "Learner" }
  ],
  aboutTitle: "Software for serious creator workflows.",
  aboutDescription:
    "I focus on desktop and web applications that solve concrete media production problems. My work sits at the intersection of performance tooling, usability, and automation.",
  aboutCards: [
    { title: "Clarity over complexity", body: "I reduce friction by keeping interfaces straightforward and behavior predictable." },
    { title: "Engineering with intent", body: "I prioritize correctness, observability, and a codebase others can extend without fear." },
    { title: "Product-first delivery", body: "I care about outcomes: fewer manual steps, fewer edge-case failures, faster iteration." }
  ],
  projectsKicker: "Projects",
  projectsTitle: "Selected work.",
  projectsDescription: "A focused selection of shipped work and active experiments.",
  customSections: [],
  skillGroups: [
    { title: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS"] },
    { title: "Desktop", skills: [".NET", "WPF", "WinUI"] },
    { title: "Media / Pipeline", skills: ["FFmpeg", "MKVToolNix", "DSP"] },
    { title: "Workflow", skills: ["Product Scoping", "Rapid Prototyping", "Code Reviews"] }
  ],
  contactTitle: "Let’s build something useful.",
  contactDescription: "Send a brief and timeline. I usually reply within one business day.",
  contactEmail: "adkhex@gmail.com",
  socialLinks: [
    { label: "GitHub", href: "https://github.com/AdkHex" },
    { label: "X", href: "https://x.com/AdkHex" }
  ],
  footerText: "Built with React + TypeScript + Tailwind.",
  ctaButtons: [
    { label: "View projects", href: "#projects", style: "primary" },
    { label: "Get in touch", href: "#contact", style: "secondary" },
    { label: "Resume / GitHub", href: "https://github.com/AdkHex", style: "outline" }
  ]
};

export function createStudioTemplateSettings(siteName = "My Portfolio"): Omit<SiteSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    siteName,
    siteTagline: "Portfolio Website",
    siteDescription: "A clean, modern portfolio website template. Replace this text with your own summary.",
    seoTitle: `${siteName} | Portfolio`,
    seoDescription: "Showcase your projects, skills, and contact details with a polished portfolio template.",
    socialPreviewTitle: `${siteName} Portfolio`,
    socialPreviewDesc: "Customizable portfolio website template.",
    portfolioTheme: "neon-grid",
    navbarLinks: [
      { label: "About", href: "#about", id: "about", visible: true },
      { label: "Projects", href: "#projects", id: "projects", visible: true },
      { label: "Skills", href: "#skills", id: "skills", visible: true },
      { label: "Contact", href: "#contact", id: "contact", visible: true }
    ],
    heroBadge: "Open to opportunities",
    heroTitle: "I build thoughtful digital products.",
    heroDescription:
      "Use this starter template to introduce yourself clearly. Replace this paragraph with your background, strengths, and what you are currently building.",
    heroHighlights: ["Responsive portfolio layout", "Project-focused presentation", "Easy no-code content editing"],
    heroStats: [
      { value: "3+", label: "Projects" },
      { value: "Beginner", label: "Level" },
      { value: "Fast", label: "Learner" }
    ],
    aboutTitle: "A short introduction about me.",
    aboutDescription:
      "Write 2-4 lines about your interests, your learning journey, and the type of roles or projects you are looking for.",
    aboutCards: [
      { title: "What I focus on", body: "Describe your main technical focus areas in simple words." },
      { title: "How I work", body: "Share your approach to solving problems and shipping projects." },
      { title: "What I am learning", body: "Add the technologies and skills you are currently improving." }
    ],
    projectsKicker: "Projects",
    projectsTitle: "Selected work.",
    projectsDescription: "Showcase your strongest projects. Edit this heading and text from the Projects tab.",
    customSections: [],
    skillGroups: [
      { title: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS"] },
      { title: "Backend", skills: ["Node.js", "Express", "APIs"] },
      { title: "Tools", skills: ["Git", "VS Code", "Figma"] }
    ],
    contactTitle: "Let’s connect.",
    contactDescription: "Use this section so visitors can reach out for internships, freelance, or collaboration.",
    contactEmail: "you@example.com",
    socialLinks: [
      { label: "GitHub", href: "https://github.com/your-username" },
      { label: "LinkedIn", href: "https://linkedin.com/in/your-handle" }
    ],
    footerText: "Built with Portfolio Studio.",
    ctaButtons: [
      { label: "View projects", href: "#projects", style: "primary" },
      { label: "Get in touch", href: "#contact", style: "secondary" },
      { label: "My GitHub", href: "https://github.com/your-username", style: "outline" }
    ]
  };
}
