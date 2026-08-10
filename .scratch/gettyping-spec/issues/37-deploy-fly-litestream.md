# 37 — Deploy to Fly.io with a persistent volume and Litestream

Type: task
Blocked by: 18
Status: ready-for-agent

## What to build

The running deployment, taken as early as the skeleton allows rather than saved for the end.

A **single Fly.io VM with a persistent volume** holding the SQLite file, and **Litestream** streaming it to object storage for backup and disaster recovery. Single-writer SQLite is appropriate at this scale: nothing in the spec requires horizontal scale, and the read-heavy Leaderboard workload is served from the same file.

Migrations run on deploy.

The Attempt handshake records live in the database **precisely so that a deploy does not void every Attempt in flight** — landing on a five-year-old mid-Stage. This ticket must not undo that property by replacing the volume or the file on each release.

Turso is the documented upgrade path if write volume or a multi-region need ever justifies it, and is explicitly not needed at launch. Record that where a future reader will find it.

## Acceptance criteria

- [ ] The app deploys to a single Fly.io VM and serves over HTTPS.
- [ ] The SQLite file lives on a persistent volume and survives a redeploy with its data intact.
- [ ] Migrations run as part of deploy.
- [ ] Litestream streams the database to object storage, and a restore has been performed at least once to prove the backup is real.
- [ ] A redeploy does not destroy in-flight Attempt handshake records.
- [ ] The Turso upgrade path is recorded where a future reader will find it.
