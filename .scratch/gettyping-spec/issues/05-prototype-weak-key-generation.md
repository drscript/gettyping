# Prototype weak-key detection & adaptive exercise generation logic

Type: prototype

## Question

Speed Test & Practice generates Exercises targeting a Player's Weak-key Profile (per [0003-adaptive-exercise-generation.md](../../../docs/adr/0003-adaptive-exercise-generation.md)). Build a rough, concrete prototype to answer: how exactly is "weak" measured (per-key error rate, per-key latency, or both — and how are they weighted), and how does that feed into generating new exercise text (word bank vs. bigram-based synthesis, how aggressively it targets weak keys vs. staying readable/fun)? The prototype should be something to react to — stub logic or a small script is enough, not production code. Its output shapes what the Weak-key Profile needs to store, which the DB schema ticket ([09-db-schema.md](./09-db-schema.md)) depends on.
