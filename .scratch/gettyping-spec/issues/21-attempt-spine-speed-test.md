# 21 — Serve, type, submit, score: the Attempt spine on the Speed Test

Type: task
Blocked by: 19, 20
Status: ready-for-agent

## What to build

The complete Attempt lifecycle end to end, on the Speed Test — chosen as the vehicle because its content is fixed and it has no gate, so nothing but the spine is being proved.

**Serve.** A Player starts the Speed Test. The server records that it served this Exercise to this Player at this time.

**Type.** The client renders the text, marks each character correct or incorrect as it is typed, highlights the next expected key, and shows a live WPM that is **advisory only, never authoritative**.

**Submit.** On finishing, the client posts the **raw per-keystroke event stream** — expected character, received character, timestamp offset — and the handshake token, and nothing else. Client-supplied aggregates are rejected as a design decision: a server applying the formula to attacker-chosen counters has the ceremony of server-side computation with none of the protection. The payload is roughly 24KB worst case, sent once.

**Derive.** The server computes every aggregate from that stream and then **discards the events** — no keystroke log is persisted. Gross WPM is characters over five, per minute. Net WPM subtracts uncorrected errors per minute, and **Net WPM is what is displayed and what ranks**; Gross is stored as a secondary stat and never ranks. Accuracy is correct keystrokes over total keystrokes typed, where *total* includes characters later backspaced over — a mistake counts even if it was fixed. One Score row is written, with the **Nickname snapshotted at Attempt time**.

**Reject structurally.** These fail outright and persist nothing: a token that is missing, expired, already consumed, or belongs to another Player; a stream with non-monotonic or out-of-span timestamps, or more events than the ceiling allows; a prompt not completed to the end of the served text.

The handshake record lives in the database rather than in process memory: on a single VM a deploy would otherwise void every Attempt in flight, landing on a five-year-old mid-Stage. A TTL sweep clears records older than about thirty minutes, which abandoned Attempts require whether or not anyone is cheating.

The Score screen shows the derived stats. No Leaderboard yet.

Authors the Speed Test text, which is immutable once live — its board's meaning depends on every ranked Player having typed the same string.

## Acceptance criteria

- [x] Starting the Speed Test records a server-side handshake carrying the Player, the Exercise and the serve time.
- [x] The typing surface marks each character, highlights the next key, and shows a live WPM that never reaches the server as an authority.
- [x] Submitting posts the raw keystroke stream; a submission carrying pre-computed aggregates is not trusted.
- [x] Net WPM, Gross WPM, accuracy, elapsed time, character count and error count are all derived server-side from the stream.
- [x] Accuracy counts a backspaced-over mistake as a mistake.
- [x] The keystroke events are discarded after derivation — nothing persists them.
- [x] One Score row is written per completed Attempt, carrying the Nickname as it stood at Attempt time.
- [x] Each structural failure — missing, expired, consumed or foreign token; non-monotonic timestamps; out-of-span timestamps; over the event ceiling; an incomplete prompt — is rejected and persists nothing.
- [x] Handshake records survive a server restart, and records older than the TTL are swept.
- [x] The Score screen shows the derived stats.
