# 03 — Keyboard accessibility/labeling

Type: grilling
Status: resolved

## Question

The keyboard already announces the next key via `role="img"` and `aria-label`. How should finger identity be named without claiming full screen-reader support, and without turning every cap into a noisy announcement?

## Answer

Keep the **baseline** the product already has: the keyboard is `role="img"` with an `aria-label` that names the next key; the next cap also has a visually-hidden “ — next key” hint. Stage tokens already use `role="img"` + `aria-label` so state is not colour alone. Finger identity follows that same pattern.

**Keyboard-level label (primary).** Extend the existing sentence so it names the finger of the highlighted cap(s):

- During an Attempt: `On-screen keyboard. Next key: f, left index.`
- During the Stage 1 intro (two home caps): `On-screen keyboard. Home keys: F, left index and J, right index.`
- Learn at rest with no next key (if that state exists): `On-screen keyboard. Finger marks show which finger rests on each key.`
- Speed Test & Practice: unchanged — next key only, no finger clause (badges are off).

**Next-cap hint (secondary).** The existing sr-only “ — next key” on the highlighted cap grows the finger name (` — next key, left index`). Do **not** put sr-only finger names on every cap. Fifty announcements on a `role="img"` graphic is noise, and full assistive-tech support is still out of product scope.

**Visible association.** The badge on the cap (chevron + pips + hue, from [01](./01-finger-to-key-map-and-visual-encoding.md)) is the visual+name pairing a sighted Player uses. Do not print the words “left index” on the keycap.

**Do not claim screen-reader support.** The accessibility line is unmoved: colorblind-safe feedback, legible sizing/contrast, named states on tokens and on this keyboard. Mute still works. No new spoken audio.

Finger names in labels, locked:

- left pinky, left ring, left middle, left index
- thumbs
- right index, right middle, right ring, right pinky

## Rejected

- **`aria-label` on every cap** — verbose, fights the keyboard’s `role="img"`, and pretends at a screen-reader product we have explicitly not built.
- **Visible finger-name text on caps** — a reading task inside a 2.25rem object; DESIGN.md: don’t put core UI text inside the decorative object.
- **Dropping the keyboard `aria-label` now that badges exist** — the next-key name is already there; finger identity extends it, it does not replace it.
- **Spoken “this is your left index”** — no spoken audio, in this map or in the product audio ticket.
