# 27 — The gate-failure state and identical-text retry

Type: task
Blocked by: 26
Status: done

## What to build

What a Player sees when they finish a Learn Stage below the standard — a distinct state, not a variant of the ordinary result.

It **leads with how close they got and what they need**, so they know exactly where they stand. There is **no Leaderboard anywhere on the screen**: an Attempt that did not clear must not end with the Player's rank beneath ten strangers. A **dominant "try again"** makes the path forward unambiguous.

**Retrying serves exactly the same text, byte for byte.** That is not a convenience — it is the system-wide rule that fixed content has a Leaderboard and generated content has none. Re-drawing a Stage's text per Attempt would rank Players who each typed different strings, gutting the per-Exercise model. It also means the Player is practising the thing they just failed rather than starting over on something new.

**Repeated failure changes nothing.** No escalating hints, no escalating sounds — the app must not get louder about someone's failure the more they struggle.

**The Score is still recorded.** The Attempt counts toward the Player's history even though it did not clear.

## Acceptance criteria

- [x] Finishing below the threshold lands on a distinct screen, not the ordinary result.
- [x] That screen leads with the accuracy achieved against the accuracy required.
- [x] No Leaderboard appears anywhere on it.
- [x] "Try again" is the dominant action.
- [x] Retrying serves byte-identical text.
- [x] A fifth consecutive failure looks and sounds exactly like the first.
- [x] The failed Attempt writes a Score.

## Addendum (from [wayfinder map #29 — adaptive warm-up retry](https://github.com/drscript/gettyping/issues/29))

The failure screen built here later gained a second, optional action — a **Finger stretch** offer — sitting beside "try again", not replacing it. Everything above is unchanged: the retry is still byte-identical, repeated failure still changes nothing about it. See [13-gate-failure-flow.md](./13-gate-failure-flow.md)'s addendum for the full design.
