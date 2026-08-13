# 01 — Finger-to-key map and visual encoding

Type: grilling
Status: resolved

## Question

The on-screen keyboard only highlights the next key. Beginners are not told which finger to use, or that F and J have bumps. How should finger identity be shown on the shared keyboard component, how does that interact with the next-key Sunshine highlight, and which Track flexes it?

## Answer

**Standard QWERTY map**, applied to the caps that already exist in `keyboardCapRows`:

| Finger | Keys on this keyboard |
|---|---|
| Left pinky | `1 !`, `q`, `a`, `z`, left `shift` |
| Left ring | `2`, `w`, `s`, `x` |
| Left middle | `3`, `e`, `d`, `c` |
| Left index | `4`, `5`, `r`, `t`, `f`, `g`, `v`, `b` |
| Thumbs | `space` |
| Right index | `6`, `7`, `y`, `u`, `h`, `j`, `n`, `m` |
| Right middle | `8`, `i`, `k`, `,` |
| Right ring | `9`, `o`, `l`, `.` |
| Right pinky | `0`, `p`, `; :`, `'`, `/ ?` |

Dual-value caps (`1 !`, `; :`, `/ ?`) take the finger of the physical key. The product keyboard has **one** shift, on the left — that cap is left pinky. There is no hyphen cap and no right shift; do not add either in this map. Caps Lock is out of scope.

**Encoding (locked, one system):** a persistent **finger badge** on each Learn cap.

- **Shape, not the cap fill, carries identity.** Caps stay white with the Key Rest edge. Painting the keycap a finger colour would fight Sunshine and invent a rainbow keyboard DESIGN.md does not have.
- **Hand = chevron direction.** Left caps: chevron points left (out toward that pinky). Right caps: chevron points right. Mirrored, so left index and right index remain distinct when hue is removed.
- **Finger = 1–4 pips**, counted from the outside of the hand: pinky 1, ring 2, middle 3, index 4. Thumbs get a wide mint bar, no chevron, no pips.
- **Hue lives on the badge only**, four steps from the DESIGN.md indigo/blue set, shared across both hands (same finger, same hue):
  - Pinky: Sky Blue `#9ec8ff`
  - Ring: Lesson Blue `#5d83dd`
  - Middle: Playground Indigo `#362d91`
  - Index: Active Indigo `#4b44bd`
  - Thumb bar: Mint `#70d7a5`
- Every badge has a **Night Indigo outline**, so the mark still reads on white **and** on Sunshine. Pips/chevron flip to Surface White on the darker fills (ring / middle / index) so the shape holds.
- **F and J** also carry a small ink **bump ridge** on the lower edge of the cap — the tactile home mark, a physical fact, not a third finger encoding.

**Next key remains primary.** The highlighted cap takes Sunshine fill, Sunshine Deep edge, and rises — unchanged. The badge stays on that cap as resting decoration. Sunshine Wash is never used as a finger signal (1.14:1 vs white). Text and marks on Sunshine use Night Indigo (Tint Ink Rule).

**Learn-only flex.** `OnScreenKeyboard` stays one component. Finger badges render when the Track flex is Learn; Speed Test & Practice passes the same component with badges off. Cooler/tighter Speed is unchanged. Do not fade or hide the keyboard.

Prototype: [../prototypes/keyboard-finger-zones.html](../prototypes/keyboard-finger-zones.html) scenes “Resting marks” and “Next key F”.

## Rejected

- **Rainbow cap fills** — not in the palette; keys are specified white; eight hues would compete with Sunshine for “press this”.
- **Hue-only zone washes** — fails the colorblind rule; Sunshine Wash cannot carry meaning; pale tints on white are the same defect the next-key fill already had.
- **Named finger icons / hand silhouettes on the cap** — illegible at `min(2.25rem, 8cqw)`. A five-year-old also may not know “pinky” or “ring” as words; pips are countable without anatomy vocabulary.
- **Replacing the next-key highlight with a finger colour** — next-key Sunshine + rise is the teaching signal already in DESIGN.md. Finger identity is decoration around it.
- **Finger zones on Speed Test & Practice** — DESIGN.md: one component system flexed per Track; Speed is cooler/tighter. Zones are a Learn teaching affordance.
- **Visible finger-name labels on caps** — core UI text inside a 2.25rem object; a reading task on the typing surface.
