# Frontend Structure

This folder is prepared for the Next.js customer and staff web interface.

The setup is intentionally minimal. It only defines the project structure so the team can add implementation later without mixing concerns.

## Main Areas

- `app/` - Next.js App Router routes.
- `app/table/[tableId]/` - Customer table experience after QR access.
- `app/admin/` - Staff/admin dashboard routes.
- `components/` - Reusable React components grouped by UI area.
- `features/` - Feature modules for customer session, chat, requests, staff auth, and staff dashboard.
- `hooks/` - Shared React hooks.
- `lib/` - Shared frontend utilities, API clients, auth helpers, config, and validators.
- `styles/` - Global and shared styles.
- `types/` - Shared TypeScript types.
- `tests/` - Future unit and end-to-end tests.
- `public/` - Static assets.

