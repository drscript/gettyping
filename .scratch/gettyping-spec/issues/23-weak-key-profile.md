# 23 — The Weak-key Profile

Type: task
Blocked by: 21, 22
Status: done

## What to build

The per-key statistics that later drive Practice generation, folded in from every accepted Attempt.

Every accepted keystroke stream updates the Profile — on **both Tracks**, and **whether or not the Score was flagged** as implausible. The Profile is private and self-harming only, so there is no adversary to defend against, and a Player transitioning out of Learn should arrive at the Speed Test with a Profile already seeded.

Stored per Player and key: an attempt count, an error count, and cumulative latency. On every write the existing values are **multiplied by a decay factor below one** before the new sample is folded in, giving exponentially-weighted statistics that track recent performance. Without decay, lifetime totals make the Profile *less* responsive precisely as a Player improves, and someone who has genuinely fixed a key keeps being served practice on it.

Each keystroke's latency is **clamped to a ceiling of about three seconds** before accumulating. A raw wall-clock gap cannot distinguish "hesitates on `p`" from "was called away to dinner", and one thirty-second pause would otherwise crown the next key permanently weakest — corrupting a Player's practice for weeks.

Because the counters decay they are no longer whole numbers, so the three-sample floor below which a key has no weakness score is a **weighted threshold**, not an integer count.

The weakness score and the stored shape came out of the terminal prototype in [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md), and are stated here because the arithmetic is more precise than prose:

```
weakness(key) = errorRate × 0.7 + latencyFactor × 0.3   // only past the 3-sample floor

// per (Player, key), decayed on every write:
{ attempts, errors, totalLatencyMs }
next = previous × DECAY_FACTOR + newSample
```

Error rate dominates; latency is the secondary signal that surfaces hesitation on keys the Player is not outright getting wrong.

## Acceptance criteria

- [x] Every accepted stream updates the Profile, including ones whose Score was marked ineligible.
- [x] Attempts on both Tracks fold into the same Profile.
- [x] Existing counters decay by the configured factor before each new sample is folded in.
- [x] A thirty-second gap between two keystrokes contributes no more latency than the clamp allows.
- [x] A key below the weighted three-sample floor has no weakness score.
- [x] Sustained clean typing on a previously weak key drives its weakness down, demonstrably, because of decay.
- [x] The decay factor and the latency clamp are config and overridable per test.
