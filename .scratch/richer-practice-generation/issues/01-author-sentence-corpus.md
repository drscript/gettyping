# 01 — Author the Sentence-mode corpus

**What to build:** A typed corpus module (working name `practice-corpus.ts`) that is the raw material Sentence mode draws from — no ids, no FKs, no DB table, importable directly by the generator and tests.

Entry type:

```ts
interface CorpusEntry {
  text: string;
  kind: 'letters' | 'sentences';
}
```

A pure function computes each entry's key set from its characters at module load — no stored key-set field, so nothing can drift:

- lowercase letter → contributes itself
- capital letter → contributes the letter **and** `shift`
- digit → contributes itself; punctuation → contributes itself, as-is
- space → contributes nothing

An entry is playable iff its derived key set is a subset of the Player's cumulative key set.

Load-time validation: every entry non-empty; every derived key within the curriculum key universe (`a`–`z`, `shift`, digits `0`–`9`, and `; , . ' ? !`). A bad entry fails the build/test suite, never a Player's request.

Author all entries per the authoring rules and density table:

- **Vocabulary**: concrete, familiar, decodable words only (animals, family, food, weather, home, nature, common action verbs — Dolch/Fry sight-word territory). No abstract, archaic, or exotic vocabulary. No profanity-adjacent words or word pairs.
- **`sentences` entries**: short, grammatical, complete sentences — no word lists. Cap ≤ 8 words / ~40 characters. Concrete silliness is encouraged; no abstract or edgy humor. Early sentences being period-less is correct (`.`/`,` are taught at Stage 15), not a defect.
- **`letters` entries**: pre-vowel key-rhythm lines (e.g. `fj fj fj fj`), no strict density floor, but keep ≥ 4 per tier for variety.
- **Density**: cumulative `sentences` pool ≥ 12 at every Stage. Per-tier additions: Stage 5 ≥ 12 (stands alone); Stages 6–13 ≥ 3 each; Stage 14 ≥ 6; Stages 15–16 ≥ 4 each; Stages 17–21 ≥ 3 each. Total ≈ 65 entries. Thinness is not tolerated at any sentence tier.
- Curriculum tiers to write against (Stage → keys added): 1 `{f,j}`, 2 `{g,h}`, 3 `{d,k}`, 4 `{s,l}`, 5 `{a,;}`, 6 `{r,u}`, 7 `{t,y}`, 8 `{e,i}`, 9 `{w,o}`, 10 `{q,p}`, 11 `{v,n}`, 12 `{b,m}`, 13 `{z,x,c}`, 14 `{shift}`, 15 `{,,.}`, 16 `{',?,!}`, 17 `{1,0}`, 18 `{2,9}`, 19 `{3,8}`, 20 `{4,7}`, 21 `{5,6}`.

Reference sample (throwaway, vocabulary predates this bar so don't copy words like `guru`/`rural`/`stray` verbatim): the `prototype/corpus-early-tiers` branch.

Also add the **Corpus** term to the `CONTEXT.md` glossary: the authored set of `letters`/`sentences` entries from which Sentence-mode Exercises are drawn; entries are raw material, not Exercises.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] The corpus module exports a typed array of `CorpusEntry` and a pure coverage-derivation function matching the rules above.
- [ ] Every entry's derived key set is validated against the curriculum key universe at load time; a test-only entry with an out-of-universe key fails the validation test.
- [ ] The corpus contains real authored entries meeting the per-tier density table across all 21 stages, with `sentences` entries following the vocabulary and shape rules (≤ 8 words / ~40 characters, no word lists, no banned vocabulary).
- [ ] Capital-bearing entries derive both the letter and `shift`; digit and punctuation characters derive themselves; spaces contribute nothing — covered by unit tests.
- [ ] `CONTEXT.md` gains the **Corpus** glossary term.
