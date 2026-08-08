# Research SQLite concurrency & hosting patterns for a multi-user web app

Type: research
Status: resolved
Research branch: research/sqlite-hosting (merged to master)

## Question

GetTyping is an online multi-user web app with a shared SQLite database (per the destination). SQLite is file-based and has known concurrency limits. What are the practical write-concurrency limits for SQLite under a multi-user web workload like this (frequent small writes: one row per completed Attempt, occasional Leaderboard reads), and what hosting/deployment patterns (e.g. a single Node process owning the file, WAL mode, tools like Litestream or Turso/libSQL for replication) are appropriate for a small-to-medium indie web app? Findings should give the tech-stack ticket ([02-tech-stack.md](./02-tech-stack.md)) enough to choose a backend + hosting approach that won't hit concurrency problems as the user base grows.

## Answer

Full findings: [research/sqlite-hosting.md](../research/sqlite-hosting.md).

SQLite allows exactly one writer at a time regardless of journaling mode; WAL mode just stops that writer from blocking concurrent readers. GetTyping's workload (~1 INSERT per completed Attempt, naturally rate-limited to well under 0.1 writes/sec/user) sits nowhere near even a conservative WAL throughput ceiling (hundreds to low-thousands of writes/sec), comfortably covering thousands of simultaneous users.

**Recommendation: Pattern A + B — a single Node.js process owning a WAL-mode SQLite file on one VM (Fly.io/Render/a small VPS), with Litestream replicating continuously to S3-compatible storage for backup/DR.** Cheapest and operationally simplest option, appropriate for a solo/indie project with no fixed budget; Litestream closes the single-VM durability gap for pennies a day with no code changes.

Turso/libSQL is the documented upgrade path if sustained writes/sec approach the low hundreds, or if multi-region low-latency reads/writes are needed — it keeps the same single-primary-writer model but removes the "you operate the VM" burden. Cloudflare D1 is not recommended: it requires committing to the Workers runtime (a much bigger architectural bet than the marginal benefit justifies here) and its free-tier write allowance (100K rows/day) is the tightest of the options considered.

Feeds [02-tech-stack.md](./02-tech-stack.md) directly.
