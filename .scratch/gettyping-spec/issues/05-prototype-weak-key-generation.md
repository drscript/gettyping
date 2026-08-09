# Prototype weak-key detection & adaptive exercise generation logic

Type: prototype
Status: resolved

## Question

Speed Test & Practice generates Exercises targeting a Player's Weak-key Profile (per [0003-adaptive-exercise-generation.md](../../../docs/adr/0003-adaptive-exercise-generation.md)). Build a rough, concrete prototype to answer: how exactly is "weak" measured (per-key error rate, per-key latency, or both — and how are they weighted), and how does that feed into generating new exercise text (word bank vs. bigram-based synthesis, how aggressively it targets weak keys vs. staying readable/fun)? The prototype should be something to react to — stub logic or a small script is enough, not production code. Its output shapes what the Weak-key Profile needs to store, which the DB schema ticket ([09-db-schema.md](./09-db-schema.md)) depends on.

## Answer

Prototype: [.scratch/gettyping-spec/prototypes/05-weak-key-generation/](../prototypes/05-weak-key-generation/) — a terminal app where typing a real prompt sentence feeds real per-key correctness and latency into a Weak-key Profile, ranks keys by weakness, and live-regenerates a preview exercise after every keystroke in either of two generation modes.

**Weakness score — validated: `errorRate × 0.7 + latencyFactor × 0.3`**, computed only once a key has 3+ samples (avoids one early fumble dominating the profile). Error rate as the dominant signal felt right when reacting to the prototype; latency is a secondary signal that surfaces hesitation on keys you're not outright getting wrong.

**Generation strategy — both modes are real options, chosen by context, not a single universal mode:**
- **word-bank mode**: real short words, weighted toward ones containing your weak keys. Stays readable/fun — the natural default for most Speed Test & Practice exercises.
- **bigram mode**: nonsense syllables built directly from the weakest keys. Much denser targeting, unreadable — suited to a more intense/focused practice moment rather than general exercises.

Exactly which contexts call for which mode wasn't pinned down further than "it depends" — left as fog (see map's Not yet specified) rather than invented here.

**Targeting aggressiveness ("density")**: a 0–1 knob blending uniform-random selection (0) against always-favor-the-weakest (1). 0.7 felt right in testing, but this is explicitly **not locked as a production constant** — it needs real playtest data post-implementation, so it must ship as an adjustable config value, not a hardcoded number.

**What the Weak-key Profile needs to store** (feeds [09-db-schema.md](./09-db-schema.md)): per (Player, key) — an attempt count, an error count, and cumulative (or average) latency. Matches the prototype's `{ attempts, errors, totalLatencyMs }` shape in [logic.mjs](../prototypes/05-weak-key-generation/logic.mjs).

## Addendum — Profile becomes recency-weighted (from [14-practice-loop.md](./14-practice-loop.md))

The stored shape above (`{ attempts, errors, totalLatencyMs }` per Player/key) was specified as **lifetime totals**, aggregating every Attempt on both Tracks. Resolving the practice-loop ticket found that this makes the Profile progressively *less* responsive as a Player improves: early errors on a key are never forgotten, so after a few thousand Attempts recent performance barely moves the weakness score, and a Player who has genuinely fixed a key keeps being served practice on it — undermining the adaptive targeting this prototype exists to drive.

**Amended**: the counters **decay on write**. Multiply the existing `attempts` / `errors` / `totalLatencyMs` by a factor below 1 before folding in each new sample, giving exponentially-weighted statistics that track recent performance.

Unchanged: the stored shape (same three values, **no schema change**), the weakness formula `errorRate × 0.7 + latencyFactor × 0.3`, both generation modes, and the aggressiveness knob.

Two consequences:
- The **decay factor** is a tuned constant, not a locked value — it ships as config alongside the aggressiveness knob, and sits in the map's fog until playtest data exists.
- **"3+ samples" becomes a weighted threshold** rather than an integer count, since `attempts` is no longer a whole number.
