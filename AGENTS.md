<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TypeScript migration in progress

This codebase is migrating from plain JavaScript to TypeScript, incrementally, file by file — not a single rewrite. `tsconfig.json` has `allowJs: true`, so `.js` and `.ts`/`.tsx` coexist throughout; the codebase must stay buildable at every step.

- **New files**: always `.ts` (or `.tsx` for anything returning JSX).
- **Existing `.js` files**: only convert one when you're already touching it for a real reason, or when explicitly asked — don't rename files just to rename them.
- **Domain types**: put shared types in `types/`, importing from Prisma's generated client (`@/lib/generated/prisma/client`) where a shape already exists there rather than hand-duplicating it.
- **Strictness**: `strict: false` for now — the plan is to ratchet it on once the bulk of the codebase is converted, not before.
- Migration order (safest/highest-leverage first): `utils/`, `data/` → `services/` → `lib/` → `pages/api/` → `components/`, `features/` → `pages/`.
