# 11 — Learn keyboard finger-zone marks

Type: task
Blocked by: none — can start immediately (parallel with 10)
Status: ready-for-agent

## What to build

The Learn on-screen keyboard shows which finger belongs on each cap, without stealing Sunshine from the next key.

Put the QWERTY finger map on the existing cap table in `src/lib/ui/keyboard-caps.ts` (one source, not a second layout). `OnScreenKeyboard.svelte` renders the badge from [01](./01-finger-to-key-map-and-visual-encoding.md) when the Track flex is Learn, and does not render it on Speed Test & Practice.

Match [../prototypes/keyboard-finger-zones.html](../prototypes/keyboard-finger-zones.html):

- White caps, Key Rest edge.
- Badge: hand-side chevron + 1–4 pips (pinky 1 … index 4); thumbs = mint bar.
- Hue on the badge only: Sky Blue / Lesson Blue / Playground Indigo / Active Indigo; Night Indigo outline; white marks on darker fills.
- F and J carry the ink bump ridge.
- Next key: Sunshine fill, Sunshine Deep edge, rise; badge remains; Night Indigo on Sunshine.
- Component can highlight **one** cap (Attempt) or **F and J together** (intro). Do not build a second keyboard.

`aria-label` on the `role="img"` keyboard names the highlighted key(s) **and** the finger (`Next key: f, left index.` / intro home keys as in [03](./03-keyboard-accessibility-labeling.md)). Speed labels stay next-key only. Sr-only hint on highlighted caps only — not on every cap.

The primitives showcase should show Learn-with-zones vs Speed-without so the flex is visible. No component tests for the marks. A table-driven unit test of the finger-to-cap map (data only) is in scope so the assignment cannot drift.

## Acceptance criteria

These fail on current main: caps have no finger field; `OnScreenKeyboard` only takes `nextKey`; Learn and Speed keyboards are identical; `aria-label` names the next key only.

- [ ] Every cap in `keyboardCapRows` has the finger assignment from the spec table (left pinky through right pinky, thumbs on space, left shift = left pinky).
- [ ] A table-driven unit test of that map fails if a letter moves to the wrong finger.
- [ ] Learn keyboard shows the prototype badges; Speed keyboard does not.
- [ ] Resting Learn caps stay white; next-key cap is Sunshine, Sunshine Deep edge, raised; badge still visible on it.
- [ ] F and J show the bump ridge.
- [ ] Two caps can be highlighted at once (F and J) for the intro; an Attempt still highlights exactly the next key.
- [ ] Keyboard `aria-label` includes the finger of the highlighted cap(s) on Learn, and does not on Speed.
- [ ] Visual result matches the prototype’s “Resting marks” and “Next key F” scenes. No component test is required for that match.
- [ ] Palette is DESIGN.md only. No rainbow fills. No finger-name text printed on the cap.
