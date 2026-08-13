# Stage 5+ Lead-in, skippable, generated, no Score

Status: ready-for-agent
Blocked by: None
Parent: learn-generated-practice spec

## What to build

The first complete Lead-in: a Player for whom Stage 5 is available lands on that Stage and sees a card *before* the gated Exercise. The dominant action starts the Stage (Find A and ; — the seeded Exercise, byte-identical to today). The subordinate action is warmer copy, "Try some words first", and starts a Lead-in.

Taking the Lead-in serves a server-generated string from the Practice Corpus in sentence mode, playable on Stage 5's cumulative keys, using the existing generated handshake. The Player types it on the ordinary Learn typing surface. Finishing writes no Score, folds the Weak-key Profile, and returns a short card with no numbers whose dominant action is still the gated Exercise. They may take another Lead-in (fresh text) as a subordinate action.

Skipping never generates that string and never writes a handshake for it. The gated Exercise handshake is created only when they start the Exercise, not on landing.

Stage 5 offers this even with an empty Weak-key Profile (uniform draw). This ticket does not have to implement Stage 2–4 offer rules, targeting bias, history assertions, or Finger-stretch coexistence; it must not break Stage 1's current auto-start, and it must not change the seeded Exercise text, the 90% gate, or Finger stretch.

A Lead-in requested for a Stage that is not open is refused. No active Player is refused.

## Acceptance criteria

- [ ] A Player with Stage 5 available who opens that Stage does not have a gated-Exercise `attempt_tokens` row created until they start the Exercise.
- [ ] That landing offers a Lead-in path and a dominant start-the-Stage path; starting the Stage serves the seeded Stage 5 Exercise, byte-identical to the content already in the database.
- [ ] Taking the Lead-in returns a `generated` handshake and a content string whose derived keys are a subset of Stage 5's cumulative taught keys, and which is a Corpus sentence-mode draw (playable `sentences` joined), including when the Weak-key Profile is empty.
- [ ] Completing that Lead-in with a structurally valid stream responds with `{ accuracy }` only, inserts zero `scores` rows for that Player, and increments `weak_key_stats` for keys they typed.
- [ ] A structurally incomplete Lead-in POST is 400, writes no Score, and folds nothing into the Profile.
- [ ] 100% accuracy on a Lead-in does not resolve Stage 5; only a qualifying Score on the gated Exercise does.
- [ ] Requesting a Lead-in for a Stage that is not open is 403; requesting one with no active Player is 401.
