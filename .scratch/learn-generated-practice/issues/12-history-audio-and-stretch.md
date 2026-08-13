# History invisibility, audio, Finger stretch coexistence

Status: ready-for-agent
Blocked by: 10
Parent: learn-generated-practice spec

## What to build

A Lead-in must not leak into history, boards, or win/fail sound, and must not steal Finger stretch's failure-card job.

After a Player takes a Lead-in and does nothing else, personal history's Learn section has no new row, the Practice aggregate (count and time) is unchanged, and no Leaderboard gained a Score. The Weak-key Profile snapshot on that same history surface has moved — that is the only place the run is allowed to show.

Finishing a Lead-in must not play the completion sound. Error ticks during it are the ordinary ones; mute still silences them. There is no failure sound (already true of the app; do not add one here).

The retry loop is Lead-in-blind. After a Lead-in, failing the gated Exercise still goes to today's failure card. Try again serves the identical Exercise immediately — no offer card in between. After `stretchOfferCount` consecutive gated failures, Finger stretch is still offered, still block grammar (not Corpus sentences), still writes no Score, still folds the Profile, and Try the Stage afterwards still starts the gated Exercise rather than a Lead-in. Taking a Lead-in does not reset or extend `consecutiveStageFailures`.

Leaving the Stage and returning may show a Lead-in again (that is a new landing). That is the only way a failure-path Player sees another Lead-in, and it is not this ticket's job to prevent it.

## Acceptance criteria

- [ ] Completing a Lead-in and then reading personal history shows Practice aggregate count 0 (or unchanged from before the Lead-in, if they already had Practice Scores), no new Learn best row, and a Weak-key Profile that has moved on the keys typed.
- [ ] Completing a Lead-in inserts no `scores` row, so no Leaderboard query for the Stage Exercise includes it.
- [ ] After a Lead-in, submitting a sub-gate gated Attempt still returns the failure state with `try again` serving the seeded Exercise as the next handshake, without requiring another Lead-in completion.
- [ ] After a Lead-in and then `stretchOfferCount` consecutive gated failures, the failure payload still sets the Finger stretch offer; completing that stretch writes no Score, and its content matches stretch block grammar rather than Corpus sentences.
- [ ] A Lead-in completion does not change `consecutiveStageFailures` (the next gated failure is counted the same as if the Lead-in had been skipped).
- [ ] The Lead-in completion response remains `{ accuracy }` only — no `score`, no `netWpm`, no `leaderboard` — which is the HTTP-observable stand-in for "no completion ceremony / no Score-shaped result".
