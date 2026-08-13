# What content is generated

Type: grilling
Status: resolved
Blocked by: 01
Part of: learn-generated-practice map

## Question

What string does a Lead-in serve? The Practice Corpus, Finger stretch's block grammar, a new word bank, or some mix? How does targeting use the Weak-key Profile? How long is one Lead-in? What happens on Stages 1–4, where English sentences are impossible because the first vowel arrives at Stage 5? Does any of this redraw the gated Exercise?

## Answer

**Practice Corpus, sentence-mode generation, never the gated Exercise.**

The Lead-in calls the same generation the Practice Track already uses for sentence mode: draw from the authored Corpus, preferring `sentences` when any entry is playable on this Stage's cumulative key set, otherwise `letters`. Playability is the existing rule — every derived key of an entry must sit in the cumulative set (union of `keysTaught` for cleared Stages plus the current Stage). No new word bank. No second Corpus. No stretch grammar.

That is the keys → pairs → words → sentences progression *without rewriting the gate*. Stages 1–4 of the Corpus are letter runs and letter pairs (`fj fj fj fj`, `fg gh hg gf`, …). Stage 5 is where `a` arrives and `sentences` begin (`dad has a flag`). The Corpus already encoded the pedagogy; Learn just was not offering it before the Exercise.

**The gated Exercise is not redrawn, not shortened, not mixed with generated text.** Retries stay byte-identical. Leaderboards stay comparable. This destination exists so that constraint can remain true.

### Rejected content sources

| Source | Why not |
|---|---|
| Finger stretch block grammar (runs → pairs → anchor → pairs) | That grammar drills *this Stage's new keys* for a stuck Player. A Lead-in is review of earlier keys and, from Stage 5, readable language. Same generator as failure would make the two siblings identical in the one place they must differ. |
| New word bank | The Corpus is the word bank, already cumulative-key-aware. Authoring another list is the out-of-scope content work this destination refused. |
| Bigram mode | Unreadable nonsense pairs. Valid on Practice as the dense option; wrong as a Learn prelude for a five-year-old, and not what "words then sentences" asked for. |
| Mix: stretch grammar then Corpus in one run | Two grammars, too long, and it would teach the Stage's new keys in stretch form immediately before the Exercise that is already that form. |
| Rewrite gated Exercises into sentences | Quietly destroys per-Exercise Leaderboards ([ADR 0002](../../../docs/adr/0002-per-exercise-leaderboards.md), [13](../../gettyping-spec/issues/13-gate-failure-flow.md)). The whole point of a Lead-in is that the gate text can stay. |

### Targeting

When the Weak-key Profile has any key **above the 3-sample floor in this Stage's cumulative set**, pass those scores into the existing generator with the existing `targetingAggressiveness` knob. The generator already blends uniform-random against always-favour-the-weakest. When no cumulative-set key is past the floor, pass an empty weakness map and the generator draws uniformly from the playable pool.

Offer (ticket 02) looks at previously-taught keys (Stages 1..n−1). Targeting looks at the cumulative set (1..n). A key taught *this* Stage can be targeted if it already has a score (a prior Lead-in, a Finger stretch, a replay) but it cannot *by itself* cause the Stage 2–4 offer — you do not offer a Lead-in on Stage 2 because G and H are theoretically weak; they have not been taught yet.

Filter the weakness map to the cumulative set before generating, rather than handing the whole Profile in and hoping the playable pool has nothing containing `q` on Stage 5. Practice can afford the looser pass (the other Track's cumulative set is often the whole alphabet). Learn must not target keys the Player has not been taught.

`shift` is never a weakness-score key (it is never an expected character). Stage 14's own taught key therefore never targets; capitalization is exercised when playable Corpus entries require it.

### Length / session shape

**One generated string, one run, then back to the Stage card.** Not a Practice-style loop of many Exercises. The Player may take another Lead-in from the result card (subordinate), matching Finger stretch's "stretch again".

Length is Practice sentence mode's draw: **6 Corpus entries**, joined. Stages 2–4 therefore get six `letters` entries; Stage 5+ gets six `sentences` when any are playable. That number is the one playtest-shaped fog patch on the map — if six sentences feel like a second full Exercise in front of a five-year-old's Stage, it becomes named config. It is not a new generator.

Rejected: a Lead-in length factor copied from `stretchLengthFactor` (that factor exists because stretch grammar has a measurable authored length to scale; Corpus entries are already short). Rejected: one entry only (too little to be review). Rejected: an untimed open loop (that is Practice, on the wrong Track).

### Stage 1–4, specifically

Stage 1 has no Lead-in (ticket 02). Stages 2–4 generate from `letters` because no `sentences` entry is playable until `a` (and `;`) are in the cumulative set at Stage 5. That is not a gap to fill with invented "words" from `f j g h d k s l`. English words without a vowel were the reason the Corpus waits. Letter-run review of earlier keys is the honest material, and it is still a different string from the gated Exercise (which drills *this* Stage's new keys in block grammar).
