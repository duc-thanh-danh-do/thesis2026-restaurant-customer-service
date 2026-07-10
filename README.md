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
- **Staff dashboard: Real-time order management with Optimistic UI updates**
- Scaffolds for: requests, tables, menu, knowledge-base, and AI-logs

## Local Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy .env.example to .env and set your variables:

DATABASE_URL (Required for Prisma/PostgreSQL)

GEMINI_API_KEY (Required for live Gemini responses)

3. Initialize the database and seed test data:

# Apply database migrations to your PostgreSQL instance

npx prisma migrate dev

# Seed the database with mock restaurant, menu, and test order data

npx tsx prisma/seed.ts

# Generate the Prisma Client

npx prisma generate

4. Start the development server:
   npm run dev

## Testing

```bash
npm test            # Node unit and database-backed integration tests
npm run typecheck   # TypeScript validation
npm run lint        # ESLint
npm run test:e2e    # Playwright application tests
npm run test:all    # Complete local verification sequence
```

The current implementation status against the application test strategy is documented in [docs/test-strategy-implementation.md](docs/test-strategy-implementation.md).
