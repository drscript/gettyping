# 03 — Sentence mode replaces word-bank, end to end

**What to build:** Sentence mode, live at the Practice route and in the UI, replacing word-bank mode entirely.

**Mode roster**: `PracticeMode` becomes `'sentence' | 'bigram'`. The slug `'word-bank'` is deleted everywhere — type, `?mode=` parameter, UI. `readMode` rejects `word-bank` (unknown mode → 400). There is nothing to migrate: the mode is never stored, and a stale client simply picks a fresh Exercise.

**Session assembly (sentence side)**:
- **Retirement**: serve `sentences` entries from the corpus (ticket 01) when the playable pool — filtered against the Player's cumulative key set (ticket 02) — contains any; else serve `letters` entries. No interleaving.
- Draw 6 entries without replacement; when the pool exhausts mid-Exercise, refill and continue; space-join into the content string. With the ≥ 12 floor, sentence-era Exercises never repeat within one Exercise; Stage-1 (pool of 5 `letters` entries) repeats one line as rhythm — emergent, not special-cased. Cross-Exercise repetition is fine.
- **Weak-key targeting**: mechanism unchanged from today — with probability `targetingAggressiveness`, restrict the draw to entries containing the weakest key(s).
- **Empty-pool guard**: if the playable pool is empty (impossible by construction given ticket 01's density bar), the generator throws and the route returns 503 with the generic "Practice could not start. Please try again." — mirroring the Speed Test's unavailable case.

**UI copy**:
- Mode buttons: "Sentences" / "Focused bigrams" (replacing "Readable words" / "Intense bigrams"). Bigram mode's underlying generation is unchanged in this ticket — only its button label and the mode roster change here.
- Exercise label line: `Practice · sentences` / `Practice · focused bigrams`.
- `/practice` meta description stays as-is.

**Consistency**: ADR-0003 gets one added sentence noting the corpus constrains the generable space without changing per-Player adaptivity, since the old 38-word bank was itself a fixed set and its replacement is the point of this effort.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] `?mode=word-bank` returns 400; `?mode=sentence` and `?mode=bigram` are both served.
- [ ] Capital-bearing sentences are playable only from Stage 14 on (via `shift`); digit-bearing entries only from Stages 17–21; `,`/`.` only from Stage 15; `'`/`?`/`!` only from Stage 16 — exercised against the real cumulative key set from ticket 02.
- [ ] A Player with no Learn Scores gets a full-alphabet sentence pool; a Player who started but cleared nothing gets a Stage-1-only pool.
- [ ] Sentence mode serves `sentences` entries whenever any are playable, `letters` entries otherwise, never mixed within one Exercise.
- [ ] No entry repeats within a single sentence-era Exercise (pool ≥ 12, 6 draws); mid-draw pool exhaustion refills and continues.
- [ ] An empty playable pool (test-only corpus) returns 503 with the standard "Practice could not start. Please try again." message.
- [ ] The Practice UI shows "Sentences" / "Focused bigrams" buttons and the `Practice · sentences` / `Practice · focused bigrams` label line.
- [ ] ADR-0003 has its one-sentence addition about the corpus constraining the generable space.
