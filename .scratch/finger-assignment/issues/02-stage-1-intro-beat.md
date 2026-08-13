# 02 — Stage 1 intro beat

Type: grilling
Status: resolved

## Question

When does Stage 1 teach the F/J bumps and the home-row rest, is that beat skippable, what does it say, and how does “already seen” survive a transfer to another device?

## Answer

**When.** The first time a Player opens Stage 1, **before** the gated Exercise Attempt. It is a short UI beat on the existing Stage route (`/learn/stages/1`), not a new route and not a new domain noun.

**Not an Exercise, not an Attempt, not a Finger stretch.** It writes no Score, mints no `attempt_tokens` row, and does not count toward gates, history, or Leaderboards. Later visits and replays of Stage 1 skip it.

**Not skippable the first time.** There is no Skip control. The only forward action is a Sunshine button, child-facing, along the lines of **“I found the bumps”**. Leaving for home is navigation, not a skip: if `stage_one_intro_seen_at` is still null, the beat shows again on return. After the button, it never shows again for that Player.

**Copy (child-facing, short):**

1. Find the little bumps under F and J.
2. Rest your index fingers there.
3. Those two keys are home.

Headline: **Find the bumps.** The keyboard stays visible beneath the card (this map does not fade or hide it). In the intro, **F and J both** take the next-key treatment (Sunshine fill, Sunshine Deep edge, rise) **and** the left/right index badges from [01](./01-finger-to-key-map-and-visual-encoding.md).

**Persistence.** Nullable `stage_one_intro_seen_at` INTEGER on `players`, set once when the Player acknowledges the beat. Transfer codes already copy the same `playerId`; the column rides along. Cookie-only is rejected: mute is device-scoped on purpose (property of the room), but “this Player has been taught the bumps” is a fact about the Player and must survive transfer and sibling switches.

**Audio.** None. No spoken prompt, no new chime. Existing layout mute remains visible and still silences the usual ticks; there is nothing new to mute.

**HTTP (same Learn Attempt resource, no second seam).**

- `GET /api/attempts/learn/1` when `stage_one_intro_seen_at` is null → `200 { "stageOneIntro": true }` and **no** `token`, **no** `attempt_tokens` row.
- `POST /api/attempts/learn/1` with `{ "stageOneIntroSeen": true }` → `204`, sets `stage_one_intro_seen_at` to now if it was null (idempotent; first timestamp wins).
- Subsequent `GET /api/attempts/learn/1` → today’s payload with a token.
- Stages 2–21, Speed Test, Practice, Finger stretch: unchanged. A `stageOneIntroSeen` POST to any other Stage is `404`.

Child-facing copy stays in the client. The HTTP body does not lock the words.

Prototype: [../prototypes/keyboard-finger-zones.html](../prototypes/keyboard-finger-zones.html) scene “Stage 1 intro”.

## Rejected

- **Cookie-only flag** — resets on transfer; also would be shared across siblings on one device the way mute is, which is wrong (sibling B has not been taught).
- **Skippable first time** — the point is teaching bumps before typing. A skip button is an escape a five-year-old will take.
- **Mint a token, then overlay the intro** — the token TTL is ~30 minutes; a lingering intro would strand the Attempt. The spec’s test seam is “intro copy before an Attempt token is required”.
- **Re-show on every Stage 1 visit / every session** — once taught, it is in the way of typing. Persistence is per Player, not per session.
- **Model it as an Exercise or Attempt** — would create a Score, a Leaderboard question, and a handshake for a beat that produces nothing to score.
- **Spoken audio or a new intro sound** — audio ticket already forbade spoken prompts; every sound must be redundant with the visual channel. The intro is already visual.
