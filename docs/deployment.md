# Deployment

The app deploys as a single Next.js project from the repository root. In Vercel, set the project Root Directory to the repository root, not `client`.

Configure `DATABASE_URL`, `DIRECT_URL`, and optional Gemini variables before deploying the Next.js application. The build uses Node.js 24.x and runs `prisma generate` before `next build`.
