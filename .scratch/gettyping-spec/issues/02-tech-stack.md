# Choose tech stack: frontend framework, backend, hosting

Type: grilling
Status: resolved
Blocked by: 01 (resolved)

## Question

The frontend will be React or Svelte (confirmed during destination-naming) — which one, and why? What backend framework/runtime serves the SQLite database and API to that frontend, and where is the whole thing hosted? Should be informed by the findings in [01-research-sqlite-hosting.md](./01-research-sqlite-hosting.md) on SQLite concurrency limits and hosting patterns. This decision determines the shape of the API layer that the DB schema ticket ([09-db-schema.md](./09-db-schema.md)) and every future implementation ticket will build against.

## Answer

**Frontend/full-stack framework: Svelte + SvelteKit**, deployed with `@sveltejs/adapter-node` — a single long-lived Node process, not serverless/edge, since it must own the one SQLite connection (per [01-research-sqlite-hosting.md](./01-research-sqlite-hosting.md)'s single-writer constraint). Svelte over React because the core UX loop is per-keystroke state updates, where Svelte's compiler-based reactivity and smaller runtime suit the "visually simple, snappy" destination better than React's virtual-DOM overhead, and the app's surface area doesn't need React's larger ecosystem. SvelteKit over a separate frontend+backend split because it keeps everything — routing, SSR, API endpoints — in the one deployable process the hosting research calls for.

**Hosting: Fly.io**, with a persistent volume for the SQLite file and **Litestream** replicating continuously to S3-compatible object storage for backup/DR (per the hosting research's Pattern A+B recommendation). Turso remains the documented upgrade path if sustained write volume or multi-region needs ever materialize.

**Database access: Drizzle ORM on better-sqlite3** — a synchronous native driver (a good fit for a single-process app with no connection-pool needs) wrapped in a lightweight, type-safe ORM (chosen over Prisma to avoid a separate query-engine process, and over raw SQL to get migrations + generated types) that plugs directly into SvelteKit's server routes and load functions.

This fixes the API-layer shape for [09-db-schema.md](./09-db-schema.md) and all downstream implementation tickets.
