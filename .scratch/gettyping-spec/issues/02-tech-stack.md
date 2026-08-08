# Choose tech stack: frontend framework, backend, hosting

Type: grilling
Blocked by: 01

## Question

The frontend will be React or Svelte (confirmed during destination-naming) — which one, and why? What backend framework/runtime serves the SQLite database and API to that frontend, and where is the whole thing hosted? Should be informed by the findings in [01-research-sqlite-hosting.md](./01-research-sqlite-hosting.md) on SQLite concurrency limits and hosting patterns. This decision determines the shape of the API layer that the DB schema ticket ([09-db-schema.md](./09-db-schema.md)) and every future implementation ticket will build against.
