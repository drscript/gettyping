# GetTyping Build-Ready Spec

Label: wayfinder:map

## Destination

A build-ready spec for GetTyping: a web-based, SQLite-backed typing tutor covering two Tracks off a shared foundation — **Learn** (gated, stage-by-stage curriculum for beginners/kids 5+) and **Speed Test & Practice** (ungated diagnostic test + adaptively-generated exercises targeting weak keys). The spec must cover scope, user flows for both Tracks, the curriculum outline, the data model, Leaderboard rules, and visual/UX principles — ready to hand off to implementation without further open decisions.

## Notes

- Domain vocabulary: [CONTEXT.md](../../CONTEXT.md) — read before using any domain term (Track, Stage, Exercise, Player, Nickname, Score, Leaderboard, Weak-key Profile).
- Decisions already recorded as ADRs: [0001 nickname-only identity](../../docs/adr/0001-nickname-only-identity.md), [0002 per-exercise leaderboards](../../docs/adr/0002-per-exercise-leaderboards.md), [0003 adaptive exercise generation](../../docs/adr/0003-adaptive-exercise-generation.md).
- Skills to consult per ticket: `/research` for research tickets, `/prototype` for prototype tickets, `/grilling` + `/domain-modeling` for grilling tickets.
- Standing preference: solo/indie project, no fixed timeline or budget, hosting choice folds into the tech-stack ticket.
- Foundational scope decisions (online multi-user web app, nickname-only identity, per-exercise Leaderboards, gated Learn track, ungated adaptive Speed Test & Practice track, baseline visual accessibility only, nickname safety/profanity filtering) were locked during destination-naming — see Destination above and the ADRs, not individual tickets.

## Decisions so far

- [Research SQLite concurrency & hosting patterns for a multi-user web app](issues/01-research-sqlite-hosting.md) — single VM + WAL SQLite + Litestream for backup/DR; Turso as the documented upgrade path if write volume or multi-region needs grow.
- [Research typing-pedagogy best practices for sequencing a beginner curriculum](issues/03-research-typing-pedagogy.md) — home row → top row → bottom row → punctuation → numbers; 1-3 new keys/stage; gate on ~90% accuracy not speed; 10-15 min stages for ages 5-7.
- [Choose tech stack: frontend framework, backend, hosting](issues/02-tech-stack.md) — Svelte + SvelteKit (adapter-node), Fly.io + Litestream, Drizzle ORM on better-sqlite3.

## Not yet specified

- Exact stage-by-stage lesson content/copy (specific text and ordering within a Stage) — downstream of the curriculum-outline ticket, not sharp until that resolves.
- Precise word/bigram bank and generation-algorithm parameters — downstream of the weak-key generation prototype ticket.
- Anti-cheat / Leaderboard-integrity safeguards (e.g. server-side validation of claimed Scores) — a real open question, not yet sharp enough to ticket.
- Audio/sound design — in scope or not, and what it sounds like; not yet discussed.
- First-run/onboarding UX for a young child (e.g. any parent-facing intro screen) — not yet discussed.

## Out of scope

- Native mobile apps — this is a web-based build; app-store packaging isn't.
- Real-time multiplayer typing races — Leaderboards give the competitive hook without live-race infrastructure.
- Monetization/ads.
- Non-English content and non-QWERTY keyboard layouts.
- UI localization/i18n.
- Screen-reader/full assistive-tech support — baseline visual accessibility only (colorblind-safe feedback, legible sizing/contrast), decided during destination-naming.
- Deployment/CI pipeline specifics (build/test/deploy workflow, Litestream restore drills, etc.) — the destination's required spec content is scope, user flows, curriculum, data model, Leaderboard rules, and visual/UX principles; the platform choice itself (Fly.io) is settled in [02-tech-stack.md](issues/02-tech-stack.md), but the operational pipeline is implementation-time work, not spec content.
