# Portfolio Studio (Landing + Demo + Studio + Admin)

React + TypeScript + Tailwind frontend with an Express + TypeScript API for:
- Landing page
- Demo portfolio (`/portfolio`)
- Public portfolio sites (`/s/:slug`)
- Studio (`/studio`)
- Hidden admin panel (`VITE_ADMIN_PATH`)

## 1) Local setup

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Local URLs:
- Frontend: `http://localhost:8080`
- API: `http://localhost:8787`

## 2) GitHub-ready checklist (already prepared)

This repo now includes:
- Clean `.gitignore` (no local DB/build/artifacts committed)
- `.env.example` template
- `vercel.json` for SPA route rewrites
- Upload/data keep files (`data/.gitkeep`, `uploads/.gitkeep`)

## 3) Push to GitHub

Run these commands in this project folder:

```bash
git init
git add .
git commit -m "Prepare portfolio studio for deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 4) Deploy correctly (important)

To make **everything** work (Studio/Admin/Auth/Messages/Uploads), deploy in 2 parts:

1. Frontend on Vercel
2. API server on a Node host with persistent disk (Railway/Render/Fly)

Reason: this project uses SQLite + local uploads; these are not durable on Vercel serverless.

## 5) Deploy backend (Railway/Render/Fly)

Use these env vars on backend host:

```env
NODE_ENV=production
SERVER_PORT=8787
DATABASE_PATH=./data/portfolio.db
CORS_ORIGIN=https://<your-vercel-domain>
APP_BASE_URL=https://<your-vercel-domain>
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
JWT_SECRET=<very-long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-admin-password>
VITE_ADMIN_PATH=/portal-x9a7m
KHALTI_BASE_URL=https://dev.khalti.com
KHALTI_SECRET_KEY=<optional>
KHALTI_FALLBACK_PHONE=9800000001
PLUS_AMOUNT_NPR=5000
PRO_AMOUNT_NPR=1500
RESEND_API_KEY=<optional-for-email-verification>
MAIL_FROM=Portfolio Studio <no-reply@yourdomain.com>
```

Start command:

```bash
npm run build && node server/dist/index.js
```

## 6) Deploy frontend on Vercel (import from GitHub)

In Vercel project settings:
- Framework: `Vite`
- Build command: `npm run build:client`
- Output directory: `dist`

Frontend env vars:

```env
VITE_API_BASE_URL=https://<your-backend-domain>
VITE_ADMIN_PATH=/portal-x9a7m
```

Then deploy.

## 7) Post-deploy verification

1. Open `https://<your-vercel-domain>/` (landing)
2. Open `https://<your-vercel-domain>/portfolio` (demo)
3. Signup/login in `https://<your-vercel-domain>/studio`
4. Open hidden admin path `https://<your-vercel-domain>/<admin-path>`
5. Submit contact form on public page and confirm message in Studio/Admin
6. Upload a project image and confirm it renders

## 8) Notes

- You can change admin URL via `VITE_ADMIN_PATH`.
- If auth fails after deploy, check:
  - `COOKIE_SECURE=true`
  - `COOKIE_SAME_SITE=none`
  - `CORS_ORIGIN` exactly matches frontend domain
- For custom domains, update both:
  - backend `CORS_ORIGIN`, `APP_BASE_URL`
  - frontend `VITE_API_BASE_URL`
