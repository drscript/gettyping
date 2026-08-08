# Design the Speed Test & Practice session loop

Type: grilling
Status: open

## Question

[05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) settled **how a single Practice Exercise is generated** (weakness score, word-bank vs. bigram modes, the aggressiveness knob) and [10-score-integrity.md](./10-score-integrity.md) moved that generation server-side. [09-db-schema.md](./09-db-schema.md) made generated Exercises ephemeral, with a nullable `exercise_id` so Attempts on them still persist.

What none of them specify is **the shape of the Track itself** — what a Player actually does across a sitting, as opposed to within one Exercise.

Open decisions: After the Speed Test reports a result, what happens next — is a Practice Exercise served immediately, or does the Player choose to start practising? Is practice a continuous stream (finish one, the next is generated), a fixed-size set (a "session" of N exercises with an end and a summary), or strictly one-at-a-time-on-request? Each implies a different screen after an Attempt and a different sense of when you're "done."

Is the Speed Test **retakeable**, and what does retaking mean for the Weak-key Profile — reseed it, or fold in as another Attempt like any other? ([09](./09-db-schema.md) has the Profile aggregating every Attempt on both Tracks, which suggests fold-in, but a Player retaking the diagnostic after months of improvement plausibly wants a fresh read rather than an average with their old self.)

Must a Player take the Speed Test **before** practice is available, or can they skip straight to practice? The Speed Test's stated job in [CONTEXT.md](../../CONTEXT.md) is to "seed their Weak-key Profile before any targeted practice is generated," which implies a gate — but [05](./05-prototype-weak-key-generation.md) requires 3+ samples per key before a weakness score is trusted, so one Speed Test may not seed enough anyway, and the behaviour with a thin or empty Profile is undefined.

Finally: the Speed Test is a single seeded Exercise row with a real Leaderboard, while Practice Exercises are ephemeral and have none. So a Player's *only* competitive surface on this Track is the Speed Test itself — worth confirming that's intended rather than accidental, given Leaderboards are the app's stated competitive hook.

This is the other half of the destination's "user flows for both Tracks."
