# Test Strategy Implementation Status

Updated: 2026-07-17

This file maps the Word test strategy to the application that currently exists in this repository. It is also the change log for the first risk-prioritized TDD implementation batch.

## Administrator backend completion

- Replaced every administrator mock-data page with authenticated, restaurant-scoped database reads and mutations.
- Added a versioned AI-instruction lifecycle: draft, validation, regression test, approval, atomic publish, monitoring, and rollback.
- Connected the published instruction version to customer chat prompts and retained its ID on AI response logs.
- Added knowledge-document validation, approval, publication, archival, and retrieval gates. Customer retrieval now uses published, ready, active documents only.
- Connected menu search, creation/edit links, availability changes, and deletion to persisted data with audit events.
- Added live dashboard metrics, AI logs, release history, and administrator audit activity.
- Added database constraints and transaction-level locking for instruction releases and open dining sessions.
- Added authenticated administrator routes and tenant ownership checks throughout the new workflows.

## Completed in this batch

### Customer and dining sessions

- Added a concurrent QR-scan integration test using five simultaneous session requests.
- Added a PostgreSQL per-table advisory lock while finding or creating an open dining session.
- Added a partial unique database index as a final guard against more than one `active` or `waiting_staff` dining session per table.
- Prevented closed customer sessions from creating new staff requests.
- Added a validated customer-request schema with supported request types, trimmed descriptions, and a 1,000-character limit.

### Customer storage and table isolation

- Scoped browser cart and customer-session storage keys to the QR table token.
- Added safe parsing for corrupt or hostile cart data in `localStorage`.
- Rejected non-integer, zero, negative, and non-numeric stored cart quantities.
- Updated menu, cart, chat, order, and session-start screens to use the table-scoped keys.

### Orders

- Added integration coverage proving that a session token from another table cannot read or update an order draft.
- Required the owning customer-session token for order-detail reads, confirmation, and quantity changes.
- Updated customer chat and order screens to send the owner token when changing a draft.

### Staff and administrator authorization

- Added unit coverage for cross-restaurant staff-message attempts.
- Staff replies now verify that the customer session belongs to the signed-in staff member's restaurant before writing.
- Staff request queues, table request lookups, and status updates are now scoped to the signed-in staff member's restaurant.
- Request status changes reject unsupported values and cross-restaurant request IDs.
- Image uploads now require a signed-in restaurant administrator.
- Menu reads and mutations now use the administrator's restaurant instead of hard-coded restaurant ID `1`.
- Menu edit, availability, and delete operations verify restaurant ownership.
- Allergen management server actions now require an administrator.
- Ingredient and dietary catalog operations now use the administrator's restaurant.
- Table-list server actions no longer fall back to another restaurant when no staff user is signed in.

### Upload security

- Added tests for upload authorization, path traversal, unsupported types, oversized files, and MIME spoofing.
- Limited menu images to PNG, JPEG, or WebP and 5 MB.
- Validated file signatures rather than trusting only the browser MIME value.
- Replaced timestamp-only filenames with UUID-based, sanitized filenames.

### AI and knowledge retrieval

- Added deterministic tests for unconfigured AI behavior, retry success, bounded retries, and error preservation.
- Refactored Gemini retry orchestration so it can be tested without a live provider or real delays.
- Added tests for handover-rule priority and low-confidence escalation.
- Added document normalization and chunk-boundary tests.
- Fixed knowledge chunks so small configured chunks prefer readable sentence or word boundaries instead of splitting words.

### QR URLs and end-to-end infrastructure

- Added URL encoding and hostile proxy-header tests for generated QR links.
- Replaced Playwright's external example-site tests with application smoke tests.
- Added an application `baseURL` and a Playwright-managed production server.
- Removed hard-coded port `3001` from staff tests.
- Removed an incorrectly nested Playwright test that was never discovered.
- Forced the current shared-seed E2E suite to one worker to prevent cross-test state corruption.
- Added `test:e2e` and `test:all` package scripts.

## Automated coverage added

The Node test suite now contains 84 tests. New coverage includes:

- AI provider retry and fallback behavior
- customer browser-storage isolation and corruption recovery
- concurrent dining-session creation
- customer order ownership and cross-table denial
- staff reply tenant isolation
- staff request queue and status-update tenant isolation
- secure image upload policy
- request validation and closed-session rejection
- handover priority and uncertainty escalation
- QR URL construction and forwarded-header validation
- knowledge document normalization and readable chunking
- AI instruction validation and legal lifecycle transitions
- idempotency, payment allocation, and dining-session transition domain rules
- database-backed administrator instruction, menu, and knowledge workflows

## Verification status

- Node unit/integration suite: 83 passed, 0 failed, 1 database test skipped when network access is sandboxed
- Focused live-database integration test: 1 passed, 0 failed
- TypeScript `--noEmit`: passed
- ESLint: passed with 0 errors and 3 pre-existing warnings
- Administrator Chromium E2E: 3 passed, 0 failed against the production build
- Next.js production build: passed
- Prisma migrations: applied to the development database

## Not yet implemented from the Word strategy

The following requirements describe product capabilities that do not yet have complete domain models or an external-system choice. They should not be faked merely to make a test pass:

- payment records, partial/split payments, refunds, reconciliation, and signed provider callbacks
- checkout, `PAYMENT_PENDING`, `PAID`, departure, cleaning, and full dining-session state transitions
- POS or kitchen-system delivery contracts and exactly-once retry handling
- per-device language preferences and a complete localization system
- production realtime transport; current realtime providers and hooks are still scaffolds
- complete staff-user management
- full WCAG automation, load testing, penetration testing, backup restoration, and multi-browser E2E execution in CI

These areas require separate TDD phases plus product decisions about payment/POS providers, roles, lifecycle rules, retention policy, and deployment infrastructure.

## Recommended next TDD phases

1. Define and test the complete dining-session state machine, including staff-only closure.
2. Replace remaining scaffold API routes and realtime hooks with authenticated, tenant-scoped implementations.
3. Add payment-provider interfaces and a fake provider, then implement idempotent callbacks before choosing a vendor adapter.
4. Build isolated E2E fixtures per test worker, then enable full customer, staff, and mobile browser workflows.
5. Add coverage reporting, accessibility automation, dependency/security scanning, load tests, and release thresholds.
