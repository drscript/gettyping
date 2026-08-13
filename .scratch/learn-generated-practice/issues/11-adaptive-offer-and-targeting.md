# Adaptive offer, letters Corpus, targeting

Status: ready-for-agent
Blocked by: 10
Parent: learn-generated-practice spec

## What to build

The offer rules and the targeting rule, end to end, for a Player moving through Learn.

Stage 2–4 show the Lead-in card only when at least one key taught in earlier Stages has a weakness score (past the weighted 3-sample floor). Child-facing copy on those Stages is "Try these first", not "words". The generated string comes from the `letters` Corpus — no English sentences — still sentence-mode generation, still six entries, still playable on that Stage's cumulative set. If no previously-taught key has a score, the Stage auto-starts the gated Exercise the way Stage 1 does.

Stage 5+ remains always-on (ticket 10). From this ticket it also targets: when the Profile has scores for keys in the Stage's cumulative set, those scores are the weakness map passed into generation with the existing `targetingAggressiveness` knob; otherwise the draw stays uniform. A Player whose F is the unique weakest floored key in the set must, under a high aggressiveness setting and a seeded RNG, receive Lead-in text biased toward F.

Stage 1 still never offers a Lead-in, including after this ticket, including on replay. Replay of a cleared Stage 2+ follows the same offer rules as a first visit. The gated Exercise text on every Stage stays the seeded string.

## Acceptance criteria

- [ ] Stage 2 offers a letters-Corpus Lead-in (keys taught through Stage 2 only, no English sentence) after Stage 1 has floored scores on F/J, and does not offer one when Stage 2 was opened by override with no previously-taught weakness score (gated Exercise auto-starts in that case).
- [ ] Opening Stage 4 after Stages 1–3 are resolved with floored scores on earlier keys offers a Lead-in of letters only; opening Stage 5 for that same Player offers a Lead-in that includes Corpus sentences.
- [ ] With `targetingAggressiveness` at 1, a seeded RNG, and a Profile whose only floored cumulative-set weakness is F, a Stage 5 Lead-in is biased toward F relative to a uniform draw under the same seed and an empty map.
- [ ] Replay of a cleared Stage 2 offers a Lead-in when earlier keys still have scores, and still serves the original seeded Stage 2 Exercise afterwards.
- [ ] A Lead-in never contains a key not in that Stage's cumulative taught set.
