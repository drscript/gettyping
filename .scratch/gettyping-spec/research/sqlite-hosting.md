# Research: SQLite Concurrency & Hosting Patterns for a Multi-User Web App

Research for: `.scratch/gettyping-spec/issues/01-research-sqlite-hosting.md`
Feeds into: `02-tech-stack.md`

Scope: GetTyping's write workload is one small `INSERT` per completed typing Attempt (a single row: user, exercise, WPM, accuracy, timestamp, etc.), plus occasional `SELECT ... ORDER BY ... LIMIT` reads for leaderboards. This is a low-write-rate, read-light workload — not a write-heavy OLTP system.

---

## 1. Realistic write-concurrency ceiling

### How SQLite's locking model works

SQLite's on-disk locking model (rollback-journal mode, the default) defines five lock states that every connection progresses through to write: **UNLOCKED → SHARED → RESERVED → PENDING → EXCLUSIVE**. Per the official locking doc:

> "A RESERVED lock means the process is planning on writing to the database file at some point in the future but that it is currently just reading from the file." ... "An EXCLUSIVE lock is needed in order to write to the database file. Only one EXCLUSIVE lock is allowed on the file and no other locks of any kind are allowed to coexist with an EXCLUSIVE lock."

(SQLite.org, "File Locking And Concurrency In SQLite Version 3", https://sqlite.org/lockingv3.html)

**WAL (Write-Ahead Logging) mode** changes this: instead of writers taking an exclusive lock on the whole file, "the original content is preserved in the database file and the changes are appended into a separate WAL file." Critically:

> "Readers and readers can run at the same time. However, since there is only one WAL file, there can only be one writer at a time."

(SQLite.org, "Write-Ahead Logging", https://sqlite.org/wal.html)

So even in WAL mode — the mode any multi-user GetTyping deployment should use — the fundamental constraint remains: **SQLite allows exactly one writer at a time, always**, no matter the journaling mode. What WAL buys you is that this single writer no longer blocks concurrent readers (leaderboard `SELECT`s can run while an Attempt `INSERT` is in flight), and that writes are appended rather than requiring random-access rewrites, which is faster: "Write transactions are very fast since they only involve writing the content once" (sqlite.org/wal.html).

The official "Appropriate Uses For SQLite" doc states this constraint directly for server workloads:

> "SQLite only supports one writer at a time per database file. ... If there are many client programs sending SQL to the same database over a network, then use a client/server database engine instead of SQLite."

and gives a concrete traffic threshold for websites:

> "Generally speaking, any site that gets fewer than 100K hits/day should work fine with SQLite. The 100K hits/day figure is a conservative estimate, not a hard upper bound. SQLite has been demonstrated to work with 10 times that amount of traffic." The SQLite.org website itself "handles about 400K to 500K HTTP requests per day," most served from an SQLite backend.

(SQLite.org, "Appropriate Uses For SQLite", https://sqlite.org/whentouse.html)

### What happens under write contention

When a writer can't get the lock it needs (e.g., a second concurrent write attempt while one is committing), SQLite returns `SQLITE_BUSY`:

> "If the process that wants to write is unable to obtain a RESERVED lock ... the write attempt fails and returns SQLITE_BUSY." (sqlite.org/lockingv3.html)

Applications are expected to handle this via a busy handler/timeout rather than treating it as a hard failure:

> "The sqlite3_busy_handler(D,X,P) routine sets a callback function X that might be invoked with argument P whenever an attempt is made to access a database table [and it is locked]. ... If the busy callback returns 0, then no additional attempts are made ... and SQLITE_BUSY is returned to the application." Conversely, a non-zero return retries. `sqlite3_busy_timeout()` / `PRAGMA busy_timeout` is the simplified, commonly-used version of this that just retries for N milliseconds before giving up.

(SQLite.org, "The Busy Callback", https://sqlite.org/c3ref/busy_handler.html)

In practice, for a workload like GetTyping's (one-row inserts), this means: as long as `busy_timeout` is set to a sensible value (e.g. 5000ms) and WAL mode is on, concurrent write attempts simply **queue and serialize** rather than error out — each INSERT takes low single-digit milliseconds, so a queue of a few pending writers drains almost instantly. Contention only becomes a user-visible problem if the queue of sustained in-flight writers exceeds what can drain within the busy_timeout window.

### Realistic throughput ceiling

SQLite.org's own docs don't publish a specific "writes/sec" number for WAL mode — that's workload- and hardware-dependent — but the qualitative guidance above ("write transactions are very fast," "SQLite has been demonstrated to work with 10x [1M hits/day]") establishes that single-writer WAL throughput is high for small, fast transactions. Independent benchmarking (secondary source, since sqlite.org doesn't publish exact figures) commonly reports **WAL-mode single-row inserts sustaining low thousands to tens of thousands of writes/sec** on typical server/laptop-class disks, depending on `synchronous` setting, batching, and whether each insert is its own transaction (SQLite in Production benchmark, https://shivekkhurana.com/blog/sqlite-in-production/; SQLite concurrent-writes analysis, https://tenthousandmeters.com/blog/sqlite-concurrent-writes-and-database-is-locked-errors/).

A relevant durability/throughput lever confirmed in the primary docs: `PRAGMA synchronous`. In WAL mode:

> "WAL mode is safe from corruption with synchronous=NORMAL, and probably DELETE mode is safe too on modern filesystems. WAL mode is always consistent with synchronous=NORMAL, but WAL mode does lose durability. A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash." Whereas with `synchronous=FULL`, "an additional sync operation of the WAL file happens after each transaction commit," which is safer but slower.

(SQLite.org, "PRAGMA synchronous", https://sqlite.org/pragma.html#pragma_synchronous)

Most production WAL deployments run `synchronous=NORMAL` (the SQLite-recommended default pairing for WAL) to avoid an fsync on every commit, trading a small, well-understood durability window (loss of the last few uncommitted-to-disk transactions on OS/power crash, not corruption) for much higher sustained write throughput.

**Applied to GetTyping's use case**: a completed Attempt is naturally rate-limited — a typing exercise takes anywhere from tens of seconds to a few minutes, so a single user generates at most roughly 1 write per 30–120 seconds while actively typing, i.e. well under 0.1 writes/sec/user. Even at a WAL throughput floor of "hundreds of writes/sec" (a deliberately conservative read of the benchmarks above, well below the thousands-to-tens-of-thousands figures typically reported), that ceiling supports **thousands of concurrent active users** submitting attempts simultaneously before the single-writer queue becomes a bottleneck. Leaderboard reads add no contention against writes in WAL mode since readers don't block on the writer. In short: for GetTyping's shape of workload, the single-writer constraint is very unlikely to be the limiting factor at indie/small-to-medium scale — you would need very large concurrent-and-simultaneous submission spikes (e.g., thousands of users finishing an exercise in the same second) to approach it.

---

## 2. Hosting/deployment patterns

### Pattern A — Single process owns the SQLite file (WAL mode), single VM

One Node.js (or similar) process holds the only connection pool to the SQLite file, WAL mode enabled, file on local/attached disk of a single VM (Fly.io, Render, a bare VPS, etc.).

- **Concurrency ceiling**: Bounded only by SQLite's single-writer-at-a-time model as described above — effectively the same ceiling discussed in §1 (comfortably high for this workload), since there's no network/NFS hop and no multi-process contention (the network-filesystem caveat from `sqlite.org/wal.html` — "WAL does not work over a network filesystem... because WAL requires all processes to share a small amount of memory and processes on separate host machines obviously cannot share memory with each other" — is a non-issue here since only one process, one host, is involved). Because only a single app process ever opens the file, you also sidestep any multi-process/multi-host locking edge cases entirely.
- **Operational complexity**: Lowest of the three patterns. No extra services to run, no replication topology to reason about. The main operational risk is that the app process and the database now share fate: if the VM/disk is lost, so is the data, unless something else is backing it up (see Pattern B, which is commonly layered on top of Pattern A rather than being an alternative to it).
- **Cost model**: Cheapest — one VM, local disk, no managed-DB line item.
- **Durability/backup**: None built in. You must add your own backup strategy (cron'd file copy, snapshot, or Litestream — see Pattern B). Platforms like Fly.io offer persistent volumes with their own snapshotting, which can partially substitute.
- **Gotchas**: Must explicitly enable WAL (`PRAGMA journal_mode=WAL`) and set `busy_timeout`; the default rollback-journal mode is much more contention-prone for concurrent readers+writers. If the hosting platform's disk is actually network-attached block storage rather than truly local disk, watch for the network-filesystem caveat above — most VM providers' "attached" volumes are still safe (they present as local block devices, not network filesystems like NFS/SMB), but this is worth confirming for whichever platform is chosen.

### Pattern B — Litestream: continuous replication of the file to object storage

App still writes locally exactly as in Pattern A; Litestream runs as a sidecar process that streams WAL changes to S3-compatible object storage for backup/DR.

- **What it is**: "Litestream is a standalone disaster recovery tool for SQLite. It runs as a background process and safely replicates changes incrementally to another file or S3." It requires WAL mode: "SQLite has a journaling mode called 'WAL' ... which writes database page changes to a separate `-wal` file first before later copying those pages back into the main database file," and Litestream reads from that WAL stream. (Litestream docs, https://litestream.io/, https://litestream.io/how-it-works/)
- **Concurrency ceiling**: Identical to Pattern A — Litestream does not change SQLite's write model at all. It is explicitly **not** a multi-writer or scaling solution; it just backs up the single-writer file. It works by taking "a long-running read transaction to prevent any other process from checkpointing" and streaming WAL pages out as "LTX" files.
- **Operational complexity**: Low-moderate. One extra sidecar process/binary, a bucket to point it at, and a restore drill you should actually test. "No code changes" are required in the app itself.
- **Cost model**: Very low — described by the project as costing "only pennies per day" since object storage is cheap and no standby server/replica compute is needed.
- **Durability/backup**: This is Litestream's whole purpose — continuous, near-real-time backup with point-in-time restore from retained WAL segments, letting you "safely run your application on a single server" and recover quickly if that server is lost. It is disaster recovery, not high availability: restoring means spinning up a new instance and replaying from the last snapshot + LTX files, which takes some (usually short) time — it is not an automatic failover.
- **Gotchas**: This pattern is explicitly a **backup/DR bolt-on to Pattern A**, not a separate scaling tier — the single-writer-per-file constraint from §1 still fully applies. Don't confuse "replication" here with "read replicas that serve traffic" (that's Turso/D1 territory, Pattern C) — Litestream's replica destination (e.g., S3) is not queryable live.

### Pattern C — Turso/libSQL and/or Cloudflare D1 (managed, distributed SQLite-compatible)

**Turso/libSQL**: a managed, SQLite-compatible service ("fully backwards compatible with SQLite") built on the libSQL fork, offering embedded replicas and multi-region reads.

- **Write architecture**: Despite Turso's marketing language about eliminating write bottlenecks, the actual embedded-replicas documentation describes a **single-primary write model**, not true multi-writer: "Writes are sent to the remote primary database configured at `syncUrl` by default. They are NOT written to the local file first." Local (embedded) replicas get near-instant local reads, and the primary propagates changes back to replicas via periodic sync (page-level replication at "4kB frame intervals" per the docs). (Turso docs, "Embedded Replicas", https://docs.turso.tech/features/embedded-replicas/introduction) In other words: reads can be distributed and low-latency; writes still funnel through one primary — SQLite's single-writer-per-database constraint still holds, just relocated to Turso's managed primary instead of your own VM.
- **Concurrency ceiling**: Similar underlying ceiling to raw SQLite WAL (one primary writer), but Turso absorbs the operational burden of running that primary reliably, and read scaling is much better than Pattern A/B since replicas can be geographically distributed.
- **Operational complexity**: Low — it's a managed service (create a database via CLI/dashboard, get a connection URL/token). You give up direct filesystem access to the `.db` file in exchange for not having to run/patch/back up the database host yourself.
- **Cost model** (Turso, https://turso.tech/pricing, primary source: pricing page): Free tier includes 100 databases, 5 GB storage, 500M rows read/month, **10M rows written/month**, 3 GB monthly sync. Paid tiers scale to Developer ($4.99/mo, 25M rows written), Scaler ($24.92/mo, 100M rows written), Pro ($416.58/mo, 250M rows written), with per-million-row overage pricing beyond that ($1/M rows written on Free/Developer, down to $0.75/M on Pro). No explicit per-second write cap is published — limits are monthly row-count based, not throughput-based.
- **Durability/backup**: Managed — Turso mentions point-in-time restore ("1 day" retention on the free tier per the pricing page); presumably longer on paid tiers.
- **Gotchas**: Vendor lock-in to Turso's hosted control plane/token auth model (mitigated somewhat by libSQL/SQLite file compatibility for exporting). "Multiple writers, zero conflicts" marketing copy on the Turso homepage should not be read as "no single-writer constraint" — the technical docs describe a single-primary architecture underneath. (Separately, Turso is also building an experimental MVCC-based concurrent-writes engine, gated behind an `--experimental-mvcc` flag and explicitly described as "an early technology preview stage ... for experimental use and evaluation, rather than production use" — not something to rely on today. Turso blog, "Beyond the Single-Writer Limitation with Turso's Concurrent Writes", https://turso.tech/blog/beyond-the-single-writer-limitation-with-tursos-concurrent-writes)

**Cloudflare D1**: "Cloudflare's managed, serverless database with SQLite's SQL semantics, built-in disaster recovery, and Worker and HTTP API access," running only from within Cloudflare Workers. (Cloudflare Docs, https://developers.cloudflare.com/d1/)

- **Write architecture**: Explicitly single-writer, serialized per database — this is stated directly in Cloudflare's own limits documentation: "Each individual D1 database is inherently single-threaded, and processes queries one at a time." (Cloudflare Docs, "Limits", https://developers.cloudflare.com/d1/platform/limits/) D1 also caps concurrency practically: "Simultaneous D1 connections per Worker" is limited to 6, and Cloudflare gives an explicit throughput illustration: at roughly 1ms per query you get on the order of 1,000 queries/second per database, dropping to ~10/sec if queries take 100ms — and if incoming write concurrency exceeds what the single-threaded database can absorb, "the database will return an 'overloaded' error."
- **Concurrency ceiling**: Same fundamental single-writer-per-database ceiling as raw SQLite, now expressed as an explicit queries/sec figure Cloudflare documents directly, plus a hard connection-count cap per Worker.
- **Operational complexity**: Very low if you're already building on Cloudflare Workers (D1 is bound directly into Worker code, no server to run at all). High switching cost if you are not otherwise a Workers/edge-function shop — the DB is only reachable that way (plus an HTTP API).
- **Cost model** (Cloudflare Docs, "Pricing", https://developers.cloudflare.com/d1/platform/pricing/): Free tier: 5M rows read/day, **100,000 rows written/day**, 5 GB total storage. Paid (Workers Paid, $5/mo base): 25B rows read/month included then $0.001/million, 50M rows written/month included then $1.00/million, 5 GB storage included then $0.75/GB-month. Also has hard per-database size limits (10 GB paid / 500 MB free per the limits page) and an account-wide storage cap (1 TB paid / 5 GB free).
- **Gotchas**: D1's free-tier write allowance (100K rows/day) is comparatively tight if attempts spike; more importantly, D1 requires committing to the Cloudflare Workers runtime model (no Node.js server, different deployment/debugging story) — a much bigger architectural commitment than "swap the DB connection string," and a bigger lift for a from-scratch indie project than Pattern A or Turso.

---

## 3. Recommendation for this project's scale

**Recommendation: Pattern A + Pattern B — a single Node.js process owning a WAL-mode SQLite file on one VM/box (Fly.io, Render, or a small VPS), with Litestream running alongside it to continuously replicate to S3-compatible object storage for backup/DR.**

Rationale, tied directly to §1 and §2:

- GetTyping's workload — one small INSERT per completed Attempt, naturally rate-limited to well under 0.1 writes/sec/user because exercises take tens of seconds to minutes — sits nowhere near SQLite's single-writer throughput ceiling. Even conservative WAL-mode throughput estimates (hundreds to low-thousands of writes/sec) comfortably cover thousands of simultaneous users, which is far beyond "indie/solo, low-to-moderate traffic." SQLite.org's own stated threshold — "any site that gets fewer than 100K hits/day should work fine with SQLite... demonstrated to work with 10 times that" (sqlite.org/whentouse.html) — is squarely in this project's expected range.
- This is the cheapest and operationally simplest pattern (§2, Pattern A) — appropriate for a solo developer with no fixed budget.
- The one real gap in "just Pattern A" is durability: a single VM with a local/attached disk is a single point of failure for data loss. Litestream closes that gap for pennies a day with no code changes and no architectural commitment, which is why it's recommended as a paired addition rather than an alternative.
- Turso is a reasonable **fallback/upgrade path**, not the starting point: it removes the "you operate the VM" burden and gives you distributed low-latency reads (nice for a global leaderboard), while keeping the same fundamentally single-writer model, so it doesn't buy you write-concurrency headroom you don't currently need — it buys you less ops work, at a monthly-row-count-based cost. Its free tier (10M rows written/month ≈ ~231 writes/minute sustained) is generous relative to this workload.
- Cloudflare D1 is not recommended for this project: it requires building on the Workers runtime rather than a conventional Node.js server, which is a much bigger architectural bet for a from-scratch app than the marginal benefit justifies at this scale, and its free-tier write allowance (100K rows/day) is the tightest of the options discussed.

**Signals to reconsider this recommendation:**

1. **Sustained writes/sec approaching the low hundreds continuously** (not burst — sustained), e.g. driven by a viral spike or many simultaneous classroom/contest-style events where large cohorts finish exercises within the same few seconds repeatedly. At that point, benchmark actual WAL throughput on the target hardware/disk and consider whether write batching, moving to `synchronous=NORMAL` (if not already), or migrating to Turso's managed primary would help.
2. **Need for multi-region low-latency reads or writes** (e.g. a genuinely global, latency-sensitive leaderboard, or wanting to run app servers in multiple regions) — raw single-VM SQLite can't serve that; this is when Turso's embedded replicas (or a conventional client/server DB) become the right move.
3. **Outgrowing a single VM's resources generally** (CPU/RAM for the app itself, not the DB specifically) — often the actual trigger for infra changes before SQLite's write ceiling is ever hit for a workload this light.
4. **Wanting automated failover / high availability**, not just backup — Litestream is explicitly DR, not HA (per its own docs); if uptime-during-host-failure becomes a hard requirement, that's a signal to move to a managed multi-node option (Turso) rather than trying to build HA on top of Pattern A/B.

None of these signals are likely to be tripped by an indie/solo-scale typing tutor in its early life — the recommendation is to start simple (Pattern A+B) and treat Turso as the documented, low-friction upgrade path if/when signal 1 or 2 above actually materializes.

---

## Sources

- SQLite.org, "Write-Ahead Logging" — https://sqlite.org/wal.html
- SQLite.org, "Appropriate Uses For SQLite" — https://sqlite.org/whentouse.html
- SQLite.org, "File Locking And Concurrency In SQLite Version 3" — https://sqlite.org/lockingv3.html
- SQLite.org, "The Busy Callback (sqlite3_busy_handler)" — https://sqlite.org/c3ref/busy_handler.html
- SQLite.org, "PRAGMA synchronous" — https://sqlite.org/pragma.html#pragma_synchronous
- SQLite.org, FAQ (transaction/disk-sync throughput discussion) — https://sqlite.org/faq.html
- SQLite.org, "sqlite3_busy_timeout()" — https://sqlite.org/c3ref/busy_timeout.html
- Litestream, homepage — https://litestream.io/
- Litestream, "How It Works" — https://litestream.io/how-it-works/
- Turso Docs, "Introduction" — https://docs.turso.tech/introduction
- Turso Docs, "Embedded Replicas" — https://docs.turso.tech/features/embedded-replicas/introduction
- Turso Docs, "Data consistency" — https://docs.turso.tech/reference/data-consistency
- Turso, "Pricing" — https://turso.tech/pricing
- Turso blog, "Beyond the Single-Writer Limitation with Turso's Concurrent Writes" — https://turso.tech/blog/beyond-the-single-writer-limitation-with-tursos-concurrent-writes
- Cloudflare Docs, "D1" (overview) — https://developers.cloudflare.com/d1/
- Cloudflare Docs, "D1 Limits" — https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare Docs, "D1 Pricing" — https://developers.cloudflare.com/d1/platform/pricing/

Secondary sources cited only where sqlite.org does not publish exact throughput figures (§1, "Realistic throughput ceiling"), and one secondary source corroborating Turso's write-forwarding architecture where its own docs page was thin on detail:
- "SQLite in Production - A Real-World Benchmark" — https://shivekkhurana.com/blog/sqlite-in-production/
- "SQLite concurrent writes and 'database is locked' errors" — https://tenthousandmeters.com/blog/sqlite-concurrent-writes-and-database-is-locked-errors/
- Better Stack, "How Turso Eliminates SQLite's Single-Writer Bottleneck" — https://betterstack.com/community/guides/databases/turso-explained/
