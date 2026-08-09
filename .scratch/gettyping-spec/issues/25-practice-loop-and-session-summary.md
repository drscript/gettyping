# 25 — The practice loop and session summary

Type: task
Blocked by: 24
Status: ready-for-agent

## What to build

Practice as a Player-paced run of Exercises rather than a fixed count.

Between Exercises, a compact result: enough stats to see how that one went, with **"next" dominant and "finish" subordinate**, so a Player can keep going without ceremony. A session can be three Exercises or forty — ending it is the Player's choice, never a count the app imposes.

Finishing shows a **session summary of how the Player's weak keys moved**. This is the only surface in the app that ever shows a Player the adaptive targeting working, rather than asking them to take it on faith.

A session is a **client-side grouping, not a modelled entity**: snapshot the top weak keys when practice begins, diff against the current Profile at finish. No session table, no schema change.

Retaking the Speed Test is an **ordinary Attempt** — no special ceremony, no reset — so a Player who has improved can simply re-measure.

## Acceptance criteria

- [x] Finishing a Practice Exercise shows compact stats with "next" dominant and "finish" subordinate, and no Leaderboard.
- [x] "Next" serves a freshly generated Exercise reflecting the Profile as it now stands.
- [x] A session can be any length; nothing but the Player ends it.
- [x] "Finish" shows a summary comparing the weak keys snapshotted at the start against the Profile now.
- [x] No session is persisted — no table, no rows.
- [x] The Speed Test can be retaken as an ordinary Attempt, producing another Score without resetting anything.
