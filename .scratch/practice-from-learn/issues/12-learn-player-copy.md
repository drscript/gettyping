# 12 — Learn Players are not told they must take the Speed Test first

Type: task
Blocked by: none
Status: ready-for-agent

## What to build

Player-facing copy that currently claims Practice depends on the Speed Test, plus the glossary sentence that says the same thing.

[02-navigation-and-copy.md](./02-navigation-and-copy.md) and [04-practice-stays-on-speed-test-track.md](./04-practice-stays-on-speed-test-track.md).

**Learn complete** (`src/routes/learn/complete/+page.svelte`): keep dominant CTA `Take the Speed Test →` and secondary `See all Stages`. Replace:

> The Speed Test measures where your typing is now and builds the Weak-key Profile that Practice draws from.

with:

> The Speed Test measures your speed on one shared text and is the flagship Leaderboard.

Do not add a Practice CTA. Do not mention Practice on this screen.

**Practice session summary** (`src/routes/practice/+page.svelte`): **Retake the Speed Test** becomes **Take the Speed Test**. Same `/speed-test` href. No branch on Scores. The 403 → `/speed-test` client branch stays.

**Speed Test result**: leave **Practise your weak keys →** unchanged.

**CONTEXT.md** Speed Test entry: drop "before any targeted practice is generated" as a hard sequencing claim. The diagnostic still measures WPM and accuracy; it is the door into Practice for a Player who skipped Learn; Learn Scores also unlock Practice because Learn Attempts already fold into the Weak-key Profile. No new glossary term. No new ADR.

Do not change first-run Track-choice copy ("Begin with a Speed Test").

## Acceptance criteria

These fail on current main unless noted as regression.

- [ ] `GET /learn/complete` for a Stage-21 graduate still contains `href="/speed-test"` as the primary next action and does **not** contain "Weak-key Profile that Practice draws from" or any claim that Practice requires the Speed Test. **Fails today: that sentence is in the page.**
- [ ] That page does not contain `href="/practice"`. **Passes today — keep; do not add one.**
- [ ] `src/routes/practice/+page.svelte` no longer contains the string `Retake the Speed Test` and does contain `Take the Speed Test`. (Client-only summary; not on the HTTP HTML of the loading state — assert in source, same posture the original spec used for visual rules.) **Fails today: the string is Retake.**
- [ ] `src/routes/speed-test/+page.svelte` still contains `Practise your weak keys`. **Passes today — keep.**
- [ ] `src/routes/practice/+page.svelte` still assigns `/speed-test` on API 403. **Passes today — keep.**
- [ ] `CONTEXT.md` Speed Test entry no longer says targeted Practice cannot be generated until the Speed Test is taken. It still names the Speed Test as the diagnostic on the Speed Test & Practice Track. **Fails today: the old sequencing clause is there.**
- [ ] No new glossary heading is added. No file is added under `docs/adr/`.

## Implementation note

[10](./10-practice-eligibility-from-learn-scores.md) and [11](./11-home-secondary-practice-action.md) can ship in either order relative to this ticket. Shipping 12 first only fixes the lie; the door still 403s until 10.
