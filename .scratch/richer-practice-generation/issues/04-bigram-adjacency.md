# 04 — Bigram mode becomes keyboard-adjacency-aware

**What to build:** Bigram mode's pair generation changes from uniform-random letter pairs to QWERTY-adjacent pairs, gated by the Player's cumulative key set. Shape is otherwise unchanged: 24 pairs, space-joined, weak-key targeting at `targetingAggressiveness`.

- Static QWERTY 8-neighbour table (horizontal, vertical, diagonal).
- Pair selection: draw the first key per the existing targeting logic; the second is uniform from (cumulative key set (ticket 02) ∩ neighbours of the first). If the first has no in-set neighbour, redraw the first.
- **Degraded fallback**: when the cumulative set yields zero adjacent pairs (Stage 1 `{f, j}`, which are not QWERTY-adjacent), draw in-set pairs as today — the single stated exception, same 24-pair shape.
- **Weak-key targeting scope** widens, for both Practice modes: with probability `targetingAggressiveness`, restrict the draw to entries/pairs containing the weakest key(s), now scoped to all character keys (letters, digits, punctuation) rather than letters only; `shift` stays excluded. Sparse profiles (no digit/punctuation samples yet) are tolerated — keys without samples simply never rank weakest.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Every generated bigram pair is QWERTY-adjacent (horizontal, vertical, or diagonal neighbour) and both keys are in the Player's cumulative key set.
- [ ] At Stage 1 (`{f, j}`, non-adjacent), the degraded fallback produces in-set pairs using today's draw behavior, still 24 pairs.
- [ ] Weak-key targeting can favor a weak digit or punctuation key in generated content for both Sentence and Bigram modes; `shift` is never targeted.
- [ ] A Player with no samples yet for a given key never has that key rank as weakest.
