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
- [Design the Learn-track curriculum outline](issues/04-curriculum-outline.md) — 21 Stages (single unbranched sequence, one Exercise each), home→top→bottom row→shift→punctuation→numbers, flat 90% accuracy gate, cumulative recycled content.
- [Prototype weak-key detection & adaptive exercise generation logic](issues/05-prototype-weak-key-generation.md) — weakness score = errorRate×0.7 + latency×0.3 (3+ samples); both word-bank (readable default) and bigram (dense/unreadable) generation modes are valid, chosen by context; targeting-aggressiveness is a tunable 0-1 config value, not a locked constant; Weak-key Profile stores per (Player, key) attempts/errors/cumulative-latency.
- [Prototype the visual design for the typing interface](issues/06-prototype-visual-design.md) — one shared visual language flexed per Track (not two modes), on-screen keyboard on both Tracks, feedback pairs color with a glyph/shape (not color alone), Leaderboard hidden during the Attempt and revealed only on completing the Exercise.

## Not yet specified

- Which contexts within Speed Test & Practice call for word-bank vs. bigram-mode generation, and the production-tuned default value for the targeting-aggressiveness knob — genuinely needs live playtest data (see [weak-key generation prototype](issues/05-prototype-weak-key-generation.md)), not yet sharp enough to ticket.
- Anti-cheat / Leaderboard-integrity safeguards (e.g. server-side validation of claimed Scores) — a real open question, not yet sharp enough to ticket.
- Audio/sound design — in scope or not, and what it sounds like; not yet discussed.
- First-run/onboarding UX for a young child (e.g. any parent-facing intro screen) — not yet discussed.

## Out of scope

- Exact stage-by-stage lesson content/copy (specific text/word lists per Stage) — the destination requires the curriculum *outline* (Stage count, keys, order, thresholds — settled in [Design the Learn-track curriculum outline](issues/04-curriculum-outline.md)), not fully-authored lesson text; writing the actual words/sentences per Stage is content-authoring work for implementation time, not a spec decision.
- Exact word-bank/bigram content authoring for Speed Test & Practice generation (the literal word lists and synthesis vocabulary) — like the Learn track's lesson copy, this is content-authoring work for implementation time; the generation *approach* (scoring formula, dual-mode strategy, config shape) is settled in [Prototype weak-key detection & adaptive exercise generation logic](issues/05-prototype-weak-key-generation.md).
- Native mobile apps — this is a web-based build; app-store packaging isn't.
- Real-time multiplayer typing races — Leaderboards give the competitive hook without live-race infrastructure.
- Monetization/ads.
- Non-English content and non-QWERTY keyboard layouts.
- UI localization/i18n.
- Screen-reader/full assistive-tech support — baseline visual accessibility only (colorblind-safe feedback, legible sizing/contrast), decided during destination-naming.
- Deployment/CI pipeline specifics (build/test/deploy workflow, Litestream restore drills, etc.) — the destination's required spec content is scope, user flows, curriculum, data model, Leaderboard rules, and visual/UX principles; the platform choice itself (Fly.io) is settled in [02-tech-stack.md](issues/02-tech-stack.md), but the operational pipeline is implementation-time work, not spec content.
