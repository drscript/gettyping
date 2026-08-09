# 22 — The plausibility tier and Leaderboard eligibility

Type: task
Blocked by: 21
Status: ready-for-agent

## What to build

The second tier of validation, which persists rather than rejects.

An Attempt over the Net WPM ceiling, or one inconsistent with the wall clock the server observed between serving and submitting, is implausible. But rejecting it outright would mean an honest Player whose laptop suspended mid-Attempt loses what they typed, and with no account and no support inbox there is no appeal. The harm is asymmetric, so the answer is to keep the Score and mark it.

Such a Score is written with its **Leaderboard eligibility flag off**. It still counts for personal history and — once Learn exists — for the Stage gate: a child who finishes at 94% and hits a suspended lid must not lose the Stage. The response is a plain success with **nothing in it revealing which check tripped**. A fast typist is never publicly accused of cheating; a false positive costs a rank rather than a standing.

The eligibility flag means "implausible, possibly tampered" and **only** that. It is also the operator's manual moderation lever — manual SQL against the VM's database is the intended and sufficient interface — so nothing else may be overloaded onto it.

The posture is **casual-tamper resistance**, stated explicitly so the boards are never mistaken for a trustworthy record. What is defended is the fifteen-second attack: open devtools, post an arbitrary Net WPM, land at #1. What is accepted as out of reach is a scripted client emitting human-plausible timings.

## Acceptance criteria

- [x] A Net WPM above the configured ceiling persists with eligibility off rather than being rejected.
- [x] An Attempt whose elapsed time is inconsistent with the server-observed wall clock persists with eligibility off.
- [x] Both return an ordinary success response whose body reveals nothing about which check tripped.
- [x] An ineligible Score still appears in the Player's own history.
- [x] The Net WPM ceiling is read from config and can be overridden per test.
- [x] Structural failures still reject and persist nothing — the two tiers stay distinct.
