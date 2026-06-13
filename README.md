# AI Phygital Dining

Fresh Next.js and Prisma rebuild of the restaurant customer-service prototype.

## Stack

- Next.js App Router at the repository root
- React 19
- Prisma ORM with PostgreSQL
- TypeScript
- Tailwind CSS
- Google Gemini integration through `@google/genai`

## Implemented Surface

- QR table entry: `/table/testpizza-table-1`
- Customer session creation: `POST /api/customer-sessions`
- Customer chat: `/session/[sessionToken]`
- Grounded AI response logging through Prisma
- Customer menu browsing: `/session/[sessionToken]/menu`
- Staff dashboard, requests, tables, menu, knowledge-base, and AI-log scaffolds

## Local Setup

```bash
npm install
npm run prisma:generate
npm run dev
```

Copy `.env.example` to `.env` and set `DATABASE_URL`. Add `GEMINI_API_KEY` to enable live Gemini responses.
