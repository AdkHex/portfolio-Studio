import type { PortfolioTheme } from "@/types/cms";

export interface PortfolioThemeMeta {
  id: PortfolioTheme;
  name: string;
  tagline: string;
  description: string;
  recommendedFor: string;
  changes: string[];
}

export const PORTFOLIO_THEMES: PortfolioThemeMeta[] = [
  {
    id: "neon-grid",
    name: "Neon Grid",
    tagline: "High-contrast creator style",
    description: "Electric cyan highlights with dark grid atmosphere.",
    recommendedFor: "Product-focused portfolios and developer creators",
    changes: ["Primary color and accents", "Hero glow intensity", "Card contrast and edge lighting"]
  },
  {
    id: "ocean-slate",
    name: "Ocean Slate",
    tagline: "Calm product design",
    description: "Deep blue palette with restrained, modern surfaces.",
    recommendedFor: "Agency-like professional portfolios",
    changes: ["Cool blue tones", "Softer highlights", "Smoother card depth"]
  },
  {
    id: "amber-editor",
    name: "Amber Editor",
    tagline: "Warm and editorial",
    description: "Warm amber accents with a studio-like look.",
    recommendedFor: "Storytelling portfolios and personal brands",
    changes: ["Warm accent palette", "Panel warmth", "Typography contrast mood"]
  },
  {
    id: "forest-signal",
    name: "Forest Signal",
    tagline: "Professional green palette",
    description: "Balanced green accents with grounded dark neutrals.",
    recommendedFor: "Freelancers and consulting profiles",
    changes: ["Green-focused CTAs", "Natural highlight glow", "Balanced section surfaces"]
  },
  {
    id: "mono-slate",
    name: "Mono Slate",
    tagline: "Minimal neutral",
    description: "Monochrome-first style with subtle interactions.",
    recommendedFor: "Resume-style minimal portfolios",
    changes: ["Neutral color system", "Low-chroma hero", "Minimal button and card appearance"]
  },
  {
    id: "midnight-luxe",
    name: "Midnight Luxe",
    tagline: "Premium dark glass",
    description: "Luxury dark palette with polished highlights and softer glow.",
    recommendedFor: "Executive or senior-level portfolio presence",
    changes: ["Deeper premium contrast", "Refined glow and panels", "Elegant call-to-action emphasis"]
  },
  {
    id: "sandstone-pro",
    name: "Sandstone Pro",
    tagline: "Warm corporate modern",
    description: "Warm neutral professional style with controlled contrast.",
    recommendedFor: "Corporate-friendly freelancer portfolios",
    changes: ["Warm neutral palette", "Softer cards and chips", "Professional section tone"]
  },
  {
    id: "cobalt-grid",
    name: "Cobalt Grid",
    tagline: "Tech product sharpness",
    description: "Cobalt accents with crisp contrast and energetic hierarchy.",
    recommendedFor: "Startup builders and SaaS portfolios",
    changes: ["Sharper blue highlights", "Structured UI feel", "More assertive interface energy"]
  },
  {
    id: "graphite-sunset",
    name: "Graphite Sunset",
    tagline: "Dark neutral + warm signal",
    description: "Graphite baseline with sunset accents for balanced personality.",
    recommendedFor: "General-purpose polished personal portfolios",
    changes: ["Graphite base tones", "Warm CTA accents", "Balanced premium mood"]
  }
];
