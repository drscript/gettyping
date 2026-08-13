# 02 — Derive the Player's cumulative key set for Practice

**What to build:** A function, callable from the Practice route, that computes the Player's cumulative key set — the gating input both Practice modes will filter against.

- **Union**: reuse `readStageList` — union `keysTaught` across stages in state `cleared` or `current`. The existing two-source resolved semantics (qualifying Score ≥ 0.9 accuracy OR `stage_unlocks` override) and linear gating flow through automatically; no new gating logic is needed here.
- **"Learn started" detection**: one indexed existence query — any row in `scores` joined to `exercises.track = 'learn'`, including failed Attempts and `leaderboardEligible = false` Scores.
- **Fallbacks**:
  - No Learn Scores at all → full alphabet (`a`–`z`, letters only) — a Speed-Test-only Player is by definition "someone who already types".
  - At least one Learn Score, nothing cleared → Stage 1 is the sole `current` Stage → `{f, j}`.
- **`shift`** is generator-visible in the set from Stage 14 on — filtered on neither side; that's the capital-gating mechanism. Digits and punctuation flow through `keysTaught` as-is; `shift` is the only pseudo-key.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A Player with no Learn Scores at all gets the full lowercase alphabet as their cumulative key set.
- [ ] A Player with at least one Learn Score but nothing cleared gets exactly `{f, j}` (Stage 1's taught keys).
- [ ] A Player with cleared/current Stages gets the union of `keysTaught` across those stages, including `shift` once Stage 14 is cleared/current, and digits/punctuation from later stages as-is.
- [ ] The two-source resolved semantics (qualifying Score or `stage_unlocks` override) are exercised via `readStageList` without duplicating that logic.
