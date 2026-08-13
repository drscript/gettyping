# Navigation and copy (home, 403, Learn complete, Speed Test result)

Type: grilling
Status: resolved

## Question

Once [01](./01-eligibility-rule.md) lets a Learn Score unlock Practice, how does a Learn Player *get there*, and what must the app stop saying?

Today: home Continue is next Stage else `/speed-test`; there is no home path to `/practice`; `GET /api/attempts/practice` 403s without exercise 22 and the client assigns `/speed-test`; Learn complete's lead copy says the Speed Test "builds the Weak-key Profile that Practice draws from"; the Speed Test result's dominant CTA is "practise your weak keys."

The product-owner stance forbids auto-routing Learn Players into Practice, forbids telling them they must take the Speed Test first, and keeps Speed Test as the dominant next thing after Learn. Those pull in different directions. This ticket pins the surfaces.

## Answer

### Continue does not change

The returning-Player Continue CTA stays **next Stage, else Speed Test**, exactly as [11-first-run-onboarding.md](../../gettyping-spec/issues/11-first-run-onboarding.md) and [16-learn-completion-and-revisiting.md](../../gettyping-spec/issues/16-learn-completion-and-revisiting.md) specified and as `src/routes/+page.server.ts` implements. A mid-curriculum Learn Player is not dumped into Practice. A graduate still Continues to the Speed Test.

Auto-routing Continue into `/practice` was rejected: Practice is a secondary activity on the Speed Test & Practice Track, not the Learn path's next Stage. Two co-equal Continues were rejected in 16 for the same reason they are rejected here — the youngest Players need one dominant action.

### Home gains a secondary Practice action once eligible

When [01](./01-eligibility-rule.md)'s rule holds, the returning home's secondary row — currently "Your history" and "Not you?" — gains a link to `/practice`, labelled **Practise weak keys**.

- Hidden until eligible, not shown disabled. A disabled "Practice" control would imply a missing prerequisite, and the missing thing a Learn Player would guess is the Speed Test — exactly the copy this ticket forbids.
- Not inside the Stage list. The Stage list is Learn. Practice is not a Stage.
- Present for every eligible Player, not only Learn-only: Speed-Test-only and dual-track Players may also reach `/practice` from home instead of only from the Speed Test result. Both doors work ([01](./01-eligibility-rule.md)).

First-run Track choice is unchanged. "I want to get faster" still begins with a Speed Test. That door is for people who skipped Learn; it is not a lecture to people who didn't.

### `/practice` 403 still sends the ineligible Player to the Speed Test

The client branch `403 → /speed-test` stays. The API still 403s when [01](./01-eligibility-rule.md) fails. That Player has no Learn Score and no Speed Test Score — they skipped Learn — and the Speed Test is the diagnostic door for that case.

When eligibility holds via a Learn Score, the API returns 200 and the client never redirects.

The 403 body may still mention the Speed Test. Only ineligible Players ever see it (and the shipped client does not render it; it assigns `/speed-test`). Learn-eligible Players never hit 403, so they are never told they must take the Speed Test first.

### Learn complete: Speed Test stays dominant; the Profile claim goes

Clearing Stage 21 still goes to the distinct completion screen whose **dominant CTA is the Speed Test** ([30-learn-completion.md](../../gettyping-spec/issues/30-learn-completion.md), stance 3). Secondary remains "See all Stages." **Do not add a Practice CTA** on this screen — that would compete with the Speed Test as the dominant next thing and would auto-invite the graduate into Practice, which stance 2 forbids.

The lead copy today:

> The Speed Test measures where your typing is now and builds the Weak-key Profile that Practice draws from.

That sentence is false for a graduate (Learn Attempts already built the Profile) and tells a Learn Player they must Speed Test before Practice. Replace it with copy that sells the Speed Test on its own terms:

> The Speed Test measures your speed on one shared text and is the flagship Leaderboard.

Do not mention Practice on this screen. Practice is reached from home once eligible, which a graduate already is.

The Stage-21 result card on the typing surface (`Take the Speed Test →`) stays as the hand-off into that completion path. It does not grow a Practice link either.

### Speed Test result is unchanged

The result screen's dominant **"Practise your weak keys →"** CTA stays. That is 14's connection from the diagnostic to the thing it exists to feed, and it is the right copy for a Player who just took the Speed Test. The sub-floor Learn offer stays.

### Practice session summary: "Take the Speed Test", not "Retake"

Today the summary offers **Retake the Speed Test**. A Learn-only Player has never taken it. Lock the phrase to **Take the Speed Test** (href `/speed-test`), matching Learn complete. Do not branch on whether a Speed Test Score exists. This is an offer, not a prerequisite — they are already in Practice.

### History is unchanged

The Practice section already exists ([34-personal-history.md](../../gettyping-spec/issues/34-personal-history.md)). It will start filling for Learn-only Players once they practise. No new section, no new empty-state copy beyond what already handles zero Practice Attempts.

### Rejected

- **Continue becomes Practice for eligible Learn Players.** Auto-route. Forbids.
- **Learn complete grows a co-equal Practice CTA.** Breaks 16's one-dominant-action structure and stance 3.
- **403 for a Learn-eligible Player sends them to the next Stage.** They are eligible; they should get 200. 403 is only the ineligible (cold-start) case, and that case still belongs at the Speed Test.
- **Show Practice on home for everyone, let 403 bounce ineligible Players to the Speed Test.** A "Practise weak keys" pill that dumps a Nickname-only Player into the Speed Test is the same lie as today's copy, just moved.
