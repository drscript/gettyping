# Learn-side generated practice (Lead-in)

Label: wayfinder:map

## Destination

Give the Learn Track the keys → pairs → words → sentences progression pedagogy asked for, without touching the gated Exercise.

Each Learn Stage still has exactly one Exercise: seeded, fixed, Leaderboard-bearing, retried byte-identical. That text stays letter-run / block grammar (`fff jjj fjf…` and the later authored shape) so Scores remain comparable.

Before that Exercise, on the same Stage route, a Player may take a **Lead-in**: generated, no-Leaderboard practice drawn from the existing Practice Corpus. It is optional, never a bypass, never a Score, and never an Exercise. Keystrokes still fold the Weak-key Profile. Stage 1 has none. Stage 2–4 offer it when earlier keys already have a weakness score (letters Corpus). Stage 5+ always offers it (sentences exist), even with an empty Profile.

Finger stretch stays the failure-card mini-run: block grammar, offered after repeated gate misses. Lead-in is the sibling at Stage start, not a rename of that surface.

## Notes

- Domain vocabulary: [CONTEXT.md](../../CONTEXT.md) — Track, Stage, Exercise, Finger stretch, Speed Test, Attempt, Score, Player, Nickname, Leaderboard, Weak-key Profile, Corpus. **Lead-in** is the proposed addition; do not use Drill, Challenge, Warm-up, Exercise, or Practice (the Track) for this surface.
- Load-bearing rule, already in the build spec: **fixed content ⟺ Leaderboard, generated content ⟺ none**. A Lead-in is generated, so it cannot be an Exercise and cannot have a Leaderboard.
- ADRs in force: [0001 nickname-only identity](../../docs/adr/0001-nickname-only-identity.md), [0002 per-exercise leaderboards](../../docs/adr/0002-per-exercise-leaderboards.md), [0003 adaptive exercise generation](../../docs/adr/0003-adaptive-exercise-generation.md), [0004 sqlite/litestream](../../docs/adr/0004-single-vm-sqlite-litestream-deploy.md). Nothing here reopens them. 0003 is about generating Practice on the other Track; reusing that generator on Learn for a non-Exercise does not make a Lead-in an Exercise.
- Pedagogy this destination serves: [research/typing-pedagogy.md](../gettyping-spec/research/typing-pedagogy.md) (within a stage: single keys → pairs → words → sentences; recycle weak keys) via [03](../gettyping-spec/issues/03-research-typing-pedagogy.md) and [04](../gettyping-spec/issues/04-curriculum-outline.md). The gated Exercise remains the comparability surface ([13](../gettyping-spec/issues/13-gate-failure-flow.md)).
- Finger stretch (failure-card sibling) is already shipped: generated `attempt_tokens` kind, no Score, Profile still folds. Lead-in copies that recording contract and that card-swap placement, not the stretch grammar or the stretch name.
- Practice Corpus already sequences `letters` until Stage 5 (`a` arrives) then `sentences`, gated by `isPlayable` against the cumulative key set. Do not author a new word bank.

## Decisions so far

- [Name and domain type of the Learn-side generated activity](issues/01-name-and-domain-type.md) — it is a **Lead-in**, not an Exercise, not a Finger stretch, not an Attempt. Glossary term is Lead-in; child-facing copy may be warmer. Generated ⟺ no Leaderboard; that is the type distinction, not a new ADR.
- [When the Lead-in is offered](issues/02-when-offered.md) — skippable, never a bypass, never moves the 90% gate. Stage 1 never. Stage 2+ when any previously-taught key (Stages 1..n−1) has a weakness score. Stage 5+ always, even with an empty Profile. Finger stretch stays on the failure card; Lead-in is the Stage-start card. Replay of a cleared Stage follows the same offer rules.
- [What content is generated](issues/03-what-content.md) — Practice Corpus only, sentence-mode generation (`letters` then `sentences` via the same playable / cumulative-key-set rules), one run of the same draw count Practice already uses. Target cumulative-set keys past the 3-sample floor with existing `targetingAggressiveness`; otherwise draw uniformly. No stretch grammar, no new word bank, no redraw of the gated Exercise.
- [Flow, recording, history, audio](issues/04-flow-recording-history-audio.md) — same Learn Stage route, card before the Attempt, Finger-stretch card-swap. Handshake is the existing `generated` `attempt_tokens` kind, server-side, existing HTTP seam. No Score; Profile folds; not an Attempt. Error ticks only; mute still works. Invisible to history rows and the Practice aggregate.

## Not yet specified

- Whether a Lead-in should draw fewer Corpus entries than one Practice Exercise (Practice draws 6). The generator and the playable rules are locked; only the draw count is a playtest-tuned number of the same shape as `targetingAggressiveness`. Ship the Practice default. If a five-year-old's Stage-2 Lead-in feels like a second full Exercise, make the count named config rather than changing the generator.

No other fog. Offer rules, type, content source, targeting rule, placement, recording, audio, and history are decided.

## Out of scope

- Redrawing or rewriting any gated Learn Exercise. Leaderboard comparability depends on that text staying fixed.
- Authoring a new word bank, sentence list, or Corpus tier for Learn. The Practice Corpus is the material.
- Renaming, retargeting, or re-grammars of Finger stretch. It stays the failure-card offer.
- Making a Lead-in required, a gate, a bypass, or a Score.
- A new URL, a new `attempt_tokens` kind, a schema change, or a new ADR.
- Bigram-mode Lead-ins (unreadable; the wrong density for a Learn beginner).
- Changing Stage 1's gated Exercise, or offering a Lead-in on Stage 1.
- Practice Track behaviour, Speed Test content, Leaderboard query predicates, adult override, or the 90% bar.
- Child-facing glossary education — Players never have to learn the word Lead-in.
