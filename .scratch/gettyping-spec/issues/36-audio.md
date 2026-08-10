# 36 — Audio

Type: task
Blocked by: 21, 27
Status: ready-for-agent

## What to build

Sound as reinforcement for a *sighted* Player whose eyes are on their hands — explicitly not assistive technology.

A **soft, short tick on a mistyped key**, and **nothing at all on a correct one**, so ordinary typing is silent. The tick is **fixed volume regardless of how many errors come in a row**: a bad run must not turn into scolding. It **self-attenuates as accuracy improves**, so the app gets quieter as a Player needs it less.

A **short sound marks clearing** something. There is deliberately **no failure sound at all** — it would fire loudest and most often for the Player having the worst time, inverting the self-attenuation exactly.

No music, no spoken prompts, no per-Track variation.

**The hard invariant: every sound is strictly redundant with the visual channel.** Muting is therefore lossless, and a browser blocking autoplay is a non-event rather than a bug.

Sound **defaults on**. The mute toggle already sits in the corner of every screen and must work **mid-Attempt** — the moment a parent decides they have had enough is mid-exercise, and silencing the app must never cost a Stage in progress. The setting **belongs to the device, not to a Player**: it rides in the same cookie, so switching Player does not un-mute the room.

Authors the sounds themselves, to those constraints.

## Acceptance criteria

- [ ] A mistyped key plays a short, soft tick; a correct key plays nothing.
- [ ] Ten consecutive errors play ten identical ticks — no escalation in volume, pitch or density.
- [ ] The tick attenuates as the Attempt's accuracy rises.
- [ ] Clearing something plays a short sound.
- [ ] Missing the gate plays no sound at all.
- [ ] Muting mid-Attempt takes effect immediately and does not end, pause or invalidate the Attempt.
- [ ] Mute persists on the device across Player switches.
- [ ] Every state that produces a sound is fully legible with sound off, and a blocked audio context changes nothing visible.
