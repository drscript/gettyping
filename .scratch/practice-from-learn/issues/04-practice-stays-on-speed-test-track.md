# What stays on the Speed Test Track vs any copy that implies Practice is a Learn feature

Type: grilling
Status: resolved

## Question

A Learn Player will now enter `/practice` without passing through the Speed Test. Does that make Practice part of Learn? Should generated Exercises flex to Learn's type scale, sit in the Stage list, or carry a Learn Leaderboard? CONTEXT.md and ADR 0003 both say Practice Exercises belong to the Speed Test & Practice Track. If that feels wrong once Learn is an eligibility door, is it worth splitting?

## Answer

### Keep Practice on Speed Test & Practice. The Track is the mode of activity, not the door you used.

A Player who arrives from Learn is still doing generated, adaptive, no-Leaderboard Exercises targeting a Weak-key Profile. That is the Speed Test & Practice Track. Learn is gated, authored, per-Stage, with a Leaderboard per Exercise. Those are different activities. Eligibility is "you have typed enough for targeting to mean something." It is not a Track transfer.

ADR 0003 is titled *Speed Test & Practice generates Exercises adaptively from a Weak-key Profile* and states "Practice Exercises in the Speed Test & Practice Track." Splitting Practice into Learn would break that sentence and the Track discriminator (`learn` | `speed_test`) on `exercises`. Generated Practice already has no Exercise row; stuffing it into Learn would also break "every Exercise belongs to exactly one Track" by inventing Learn content that is not a Stage.

The product-owner stance says: if this feels wrong, still keep it. It feels slightly odd, and it is still right.

### What that means on the surfaces

- `/practice` keeps `TrackFrame` `track="speed-test-practice"` (monospace, cooler, tighter). Do not flex it to Learn because the Player has a current Stage.
- Home's Practice link lives on the **secondary row**, not in the Stage list, not as a Stage token, not labelled as a Stage. See [02](./02-navigation-and-copy.md).
- History keeps one Practice section for everyone. Learn-only Attempts at generated text show up there, not under Learn bests-by-Stage. Learn bests stay cleared-Stage Scores. No new section.
- Admin "Speed Test & Practice performance" already counts null-`exercise_id` Scores plus the Speed Test. Learn-only Practice Attempts belong in that bucket. Do not move them into the Learn funnel.

### Copy that would imply Practice is a Learn feature — do not write it

Forbidden shapes (not an exhaustive list of strings; the test is the implication):

- "Practise this Stage" / "Learn Practice" / "Stage practice" for `/practice`. Finger stretch is the Learn-side warm-up; it is not this.
- "Finish Learn to unlock Practice" or "Take the Speed Test to unlock Practice" on a surface a Learn-eligible Player sees. Unlock is [01](./01-eligibility-rule.md); Learn complete and home must not contradict it ([02](./02-navigation-and-copy.md)).
- Framing the home Practice link as the next Step on the 21-Stage path.

Allowed:

- "Practise weak keys" on home (Track-accurate, Profile-accurate).
- "Practise your weak keys" on the Speed Test result (unchanged).
- "Take the Speed Test" from Practice summary and Learn complete (the other activity on the same Track, offered, not required).
- First-run "I want to get faster" / "Begin with a Speed Test" (that door still begins with the diagnostic).

### CONTEXT.md: correct the Speed Test sentence, do not add a term

CONTEXT.md currently says the Speed Test is "used to seed their Weak-key Profile **before any targeted practice is generated**." That sequencing clause is what 14 locked and [01](./01-eligibility-rule.md) amends. It is not a new concept; it is a glossary sentence that would otherwise contradict the shipped rule.

Amend the Speed Test entry to: the diagnostic Exercise on this Track that measures current WPM and accuracy. It is the door into Practice for a Player who skipped Learn. Learn Scores also unlock Practice, because Learn Attempts already fold into the same Weak-key Profile.

Do not add "Practice eligibility" or any other term. Say it with Score, Learn, Speed Test, Practice.

No new ADR. Sequencing is not architecture.

### Rejected

- **A third Track** ("Learn Practice"). Two Tracks was the destination. A third is a product fork and an ADR.
- **Practice Exercises as Learn content** so a beginner "stays in Learn." Breaks ADR 0003 and the fixed-content ⟺ Leaderboard rule (generated Learn Exercises would either gain a board they cannot honestly have, or Learn would gain boardless Exercises and the rule dies).
- **Flex `/practice` to Learn visuals when the Player has a current Stage.** One visual language flexed *per Track*, not per how you arrived ([06](../../gettyping-spec/issues/06-prototype-visual-design.md)). Arrival is not a Track.
- **Hide Practice from Speed-Test-only Players' home** so the secondary link "belongs to Learn." Both doors work. Speed-Test-only Players are the original audience.
