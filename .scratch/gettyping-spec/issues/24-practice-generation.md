# 24 — Practice generation and the first generated Attempt

Type: task
Blocked by: 23
Status: done

## What to build

Practice Exercises generated on demand from a Player's own Weak-key Profile, and the Speed Test result screen that sends them there.

**Generation is server-side.** Generating in the browser would leave the server unable to check a single character of a Practice Attempt, letting client-trust on one Track decide the whole system's posture — and it would mean shipping a Player's entire Profile to the client. Server-side also keeps the algorithm and its tuning knobs retunable without a client release.

**Two modes, both valid, chosen by context.** *Word-bank*: real short words weighted toward ones containing the Player's weak keys — readable, and the natural default, because practice should not be uniformly miserable. *Bigram*: nonsense syllables built straight from the weakest keys — much denser targeting, unreadable, for a more intense moment. A **0–1 targeting-aggressiveness knob** blends uniform-random selection against always-favour-the-weakest.

**Cold start is bounded, not eliminated.** One Speed Test will not clear the sample floor for rare keys — `q`, `z`, `x`, `j` may get zero samples. Partially-unknown keys are the normal post-Test state and generation must cope with them rather than special-case them.

A generated Exercise **gets no Exercise row**: its text lives on the handshake record and the resulting Score carries no Exercise reference. It has **no Leaderboard, ever** — ranking Players who each typed different text measures nothing. This is the system-wide rule in action: *fixed content ⟺ has a Leaderboard; generated content ⟺ has none.*

The Speed Test result screen gains its dominant **"practise your weak keys"** action, connecting the diagnostic directly to the thing it exists to feed, and — only when the Score falls below the configured floor — a subordinate offer to start from the beginning on Learn instead. That is the recovery path for a mis-picked door.

Authors the word-bank and bigram vocabulary.

## Acceptance criteria

- [x] A Practice Exercise is generated on the server, and its text does not reach the client before it is served.
- [x] Generated text targets the Player's weakest keys under a seeded RNG, reproducibly.
- [x] Both word-bank and bigram modes produce output; word-bank output is readable words.
- [x] The targeting-aggressiveness knob is config and visibly changes how strongly the weakest keys are favoured.
- [x] Generation produces valid output for a Player whose rarest keys have zero samples.
- [x] A generated Exercise creates no Exercise row, and its Score carries no Exercise reference.
- [x] Completing a Practice Attempt goes through the same serve/submit/derive path and folds into the Profile.
- [x] No Leaderboard appears anywhere on a Practice Exercise.
- [x] The Speed Test result screen leads with practising weak keys, and offers Learn only below the configured floor.
