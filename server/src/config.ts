import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.SERVER_PORT || 8787),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
  appBaseUrl: process.env.APP_BASE_URL || process.env.CORS_ORIGIN || "http://localhost:8080",
  adminPath: process.env.VITE_ADMIN_PATH || "/portal-x9a7m",
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "ChangeMe123!",
  resendApiKey: process.env.RESEND_API_KEY || "",
  mailFrom: process.env.MAIL_FROM || "Portfolio Studio <no-reply@portfolio-studio.app>",
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
  cookieSameSite: (process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "none" : "lax")) as
    | "lax"
    | "strict"
    | "none",
  khaltiBaseUrl: process.env.KHALTI_BASE_URL || "https://dev.khalti.com",
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY || "",
  plusAmountNpr: Number(process.env.PLUS_AMOUNT_NPR || 5000),
  proAmountNpr: Number(process.env.PRO_AMOUNT_NPR || 1500),
  khaltiFallbackPhone: process.env.KHALTI_FALLBACK_PHONE || "9800000001"
};

export const isProduction = config.nodeEnv === "production";
