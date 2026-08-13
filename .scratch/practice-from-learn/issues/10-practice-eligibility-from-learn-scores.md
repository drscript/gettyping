# 10 — Practice eligibility from Learn Scores

Type: task
Blocked by: none — decisions 01–04 are resolved
Status: ready-for-agent

## What to build

Let a Player start Practice when they have **at least one Learn Score** or **at least one Speed Test Score**. Nickname-only Players with zero Attempts still 403.

This is the API half of [01-eligibility-rule.md](./01-eligibility-rule.md). Today `src/routes/api/attempts/practice/+server.ts` requires a Score with `exerciseId` 22. Replace that with a join onto `exercises.track` in `('learn', 'speed_test')` — do not hardcode 22.

Do **not** change generation, `cumulativeKeySet`, modes, Profile arithmetic, or the client 403 → `/speed-test` branch. [03-key-set-and-targeting.md](./03-key-set-and-targeting.md) says the existing set is enough; this ticket's Learn-only Stage 3 assertion is how we prove it through the HTTP seam.

Existing Practice tests that call `completeSpeedTest` before `GET /api/attempts/practice` must keep passing.

## Acceptance criteria

These fail on current main unless noted as regression.

- [ ] `GET /api/attempts/practice` for a Player whose only Score is a Learn Score (Stage 1, any accuracy) returns **200**, a handshake token, and generated `exercise.content`. No Speed Test Score exists for that Player. **Fails today: 403.**
- [ ] A sub-gate Learn Score (accuracy 0.2 on Stage 1) is sufficient for that 200. **Fails today: 403.**
- [ ] A Learn Score with `leaderboard_eligible = 0` is sufficient for that 200. **Fails today: 403.**
- [ ] A Player with only a Speed Test Score still gets **200**. **Passes today — keep.**
- [ ] A Player with both a Learn Score and a Speed Test Score still gets **200**. **Passes today — keep.**
- [ ] A Nickname-only Player with zero Scores gets **403**. **Passes today — keep.**
- [ ] A Player who has a `stage_unlocks` row for Stage 1 and **no** Score still gets **403**. **Passes today (no exercise-22 Score) — keep as an explicit guard so eligibility is not later wired to unlocks.**
- [ ] Learn-only, Stages 1–2 cleared and Stage 3 current, Sentence mode: served content uses only letters from `{f,j,g,h,d,k}` (plus spaces). No Speed Test Score in the fixture. **Fails today: 403, so the key set is never observed.**
- [ ] Speed-Test-only Sentence mode still serves the full-alphabet fallback already asserted in `tests/acceptance/practice.test.ts`. **Passes today — keep.**
- [ ] Completing that Learn-only Practice Attempt still POSTs through the shared path, writes a Score with `exercise_id` null, and folds the stream into `weak_key_stats`. **Fails today: cannot start.**
- [ ] No new Exercise row is created. No Leaderboard payload is returned for the generated Exercise. **Passes today on Speed-Test fixtures — keep on the Learn-only fixture.**
- [ ] Tests use the existing HTTP seam (running SvelteKit + migrated SQLite). They do not import `cumulativeKeySet` or a new eligibility helper.

## Implementation note

Home, Learn-complete copy, and CONTEXT.md are [11](./11-home-secondary-practice-action.md) and [12](./12-learn-player-copy.md). A Learn-only Player who already knows `/practice` should work after this ticket alone; they just cannot find it from home yet.
