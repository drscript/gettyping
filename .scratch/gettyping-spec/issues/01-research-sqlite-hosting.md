# Research SQLite concurrency & hosting patterns for a multi-user web app

Type: research
Research branch: research/sqlite-hosting (findings land there; not yet merged)

## Question

GetTyping is an online multi-user web app with a shared SQLite database (per the destination). SQLite is file-based and has known concurrency limits. What are the practical write-concurrency limits for SQLite under a multi-user web workload like this (frequent small writes: one row per completed Attempt, occasional Leaderboard reads), and what hosting/deployment patterns (e.g. a single Node process owning the file, WAL mode, tools like Litestream or Turso/libSQL for replication) are appropriate for a small-to-medium indie web app? Findings should give the tech-stack ticket ([02-tech-stack.md](./02-tech-stack.md)) enough to choose a backend + hosting approach that won't hit concurrency problems as the user base grows.
