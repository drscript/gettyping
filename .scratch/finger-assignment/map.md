# Finger assignment on the Learn keyboard

Label: wayfinder:map

## Destination

Beginners on Learn can see which finger belongs on which key, and Stage 1 opens with a once-per-Player “find the bumps, rest here” beat before the first gated Exercise Attempt. Speed Test & Practice keeps the same keyboard component without finger-zone decoration. The next key still takes Sunshine and rises — that remains the primary teaching signal.

## Notes

- Domain vocabulary: [CONTEXT.md](../../CONTEXT.md) — Track, Stage, Exercise, Attempt, Score, Player, Finger stretch. The Stage 1 intro is a **UI beat**, not a new glossary noun. It is not an Exercise, not an Attempt, and not a Finger stretch. Do not name it as any of those.
- Design system: [DESIGN.md](../../DESIGN.md). Palette, Tint Ink Rule, never-colour-alone, next-key Sunshine, white keycaps, Track temperature, no gamification chrome.
- Existing keyboard: `OnScreenKeyboard.svelte` takes `nextKey`; caps from `keyboardCapRows` in `src/lib/ui/keyboard-caps.ts`. Learn Stage route `src/routes/learn/stages/[stageId]/+page.svelte` loads an Attempt immediately via `$effect`.
- `players` today: `id`, `nickname`, `created_at`. Transfer codes copy the same `playerId`; new columns on that row survive transfer.
- Tests: HTTP acceptance tests. Visual rules are specified by the prototype, not component tests — same pattern as [19](../gettyping-spec/issues/19-shared-visual-primitives.md).
- Prototype (encoding locked): [prototypes/keyboard-finger-zones.html](./prototypes/keyboard-finger-zones.html) — open in a browser, no build.

## Decisions so far

- [Finger-to-key map and visual encoding](issues/01-finger-to-key-map-and-visual-encoding.md) — standard QWERTY map on the caps that already exist. Learn-only badge: **hand-side chevron + 1–4 pips**, hue on the mark only. Caps stay white. Next key still Sunshine + rise. Speed omits the badges.
- [Stage 1 intro beat](issues/02-stage-1-intro-beat.md) — once per Player, first open of Stage 1, before the gated Attempt, not skippable the first time. Copy: bumps under F and J, rest index fingers there, those two keys are home. Persist `stage_one_intro_seen_at` on `players` so transfer carries it. No Score, not an Attempt, no new sound.
- [Keyboard accessibility/labeling](issues/03-keyboard-accessibility-labeling.md) — extend the existing `role="img"` `aria-label` so it names the next (or home) key **and its finger**. Do not claim full screen-reader support.
- [Prototype: keyboard finger zones](issues/04-prototype-keyboard-finger-zones.md) — one locked encoding, three scenes (resting, next-key F, Stage 1 intro).

## Not yet specified

- Nothing that blocks this map. Hyphen/minus is not on `keyboardCapRows`; if a cap is added later it is right pinky. Caps Lock stays out of scope. Fading or hiding the keyboard is a later skill-track, not this map.

## Out of scope

- Caps Lock.
- Fading or hiding the on-screen keyboard.
- Finger-zone decoration on Speed Test & Practice (the component stays shared; the badges are Learn flex only).
- Spoken audio, new intro sounds, or any audio that is not already redundant with the visual channel.
- A cookie-only intro flag.
- A second application test seam. Visual encoding is the prototype; HTTP covers intro persistence and “no Attempt token until the intro is acknowledged”.
- Rainbow keycaps, named finger-icon chrome, badges/streaks, or any fill that competes with Sunshine for “this is the next key”.
- Full screen-reader / assistive-tech support (still out of product scope).
- New domain entities. The intro is a beat on the Stage 1 route.
