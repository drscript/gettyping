# GetTyping full-UI redesign — Impeccable record

Status: **Complete on 2026-08-10.** The redesign and the full finish-reviewer fix list are applied
and verified. `npm run check` reports 0 errors / 0 warnings, `npm test` passes 44/44, and the
Impeccable detector reports **0 warnings, 65 advisories** (down from 140 findings including
1 warning, with the colour-drift category now empty).

---

## Original request and confirmed scope

The user invoked `$impeccable` and asked to "redo the entire UI." They confirmed:

1. Every player-facing route is in scope: home, Nickname selection, Learn, Speed Test, Practice,
   Learn completion, history, Player management, grown-up guidance, and the internal primitives
   showcase.
2. The [Club Baby EDU Dribbble shot](https://dribbble.com/shots/25263439-Club-Baby-EDU-Kids-Education-Website)
   is the committed inspiration, not merely a light reference.
3. Both Tracks share the playful world, while Speed Test & Practice uses a slightly more precise
   and mature expression.

All product behaviour, routes, terminology, factual copy, keyboard interaction, accessibility and
`PRODUCT.md` constraints were preserved. Nothing was invented — no accounts, testimonials, pricing,
metrics, claims, capabilities, or Stage names.

## Authorities

- Approved north-star comp: `docs/design/gettyping-redesign-approved.png`
- Durable visual authority: `DESIGN.md` — updated to describe the shipped world
- Sidecar: `.impeccable/design.json` — regenerated, schemaVersion 2
- All-routes surface brief: `.impeccable/surfaces/src-routes-page-svelte.md`
- Product authority: `PRODUCT.md` · Domain terms: `CONTEXT.md`
- The five-block direction contract is the opening HTML comment in `src/routes/+page.svelte`

---

## Real defects found and fixed

None of these were visible without running the app; the paused work had left them behind.

- **`body` carried an opaque background**, painting over every `z-index: -1` scene layer — all four
  task routes were drawing landscape shapes that never appeared. `html` now owns the canvas colour
  and `overflow-x: clip`; `body` is transparent. This is the Transparent Body Rule in `DESIGN.md`.
  **Do not reintroduce a `body` background.**
- **Six invalid `box-shadow-color` declarations** — a property that does not exist — in the Learn
  Stage, Speed Test and Practice styles. The intended tinted lower edges were not rendering.
- **Contrast failures**: Muted Indigo on Sunshine (4.32:1) and on Mint (3.2:1), Mint Deep on Mint
  (2.38:1). Tinted fills now take Night Indigo — the Tint Ink Rule.
- **Hero copy over the artwork ran at 2.4–3.3:1.** Both scrims were rebuilt and the mobile art band
  now starts below the copy block even when the question wraps to four lines (24px clearance
  measured at 390px).
- **Focus was invisible on every saturated field.** Now: Active Indigo on pale grounds, Surface
  White on indigo, and White inside a Night Indigo outer ring on the periwinkle terrain and on the
  fixed controls that scroll across both. Verified by walking the real focus order and reading
  computed `:focus-visible` styles on every route.
- **Two inputs suppressed their own focus ring** — scoped `:focus` rules outranked the global
  `:focus-visible`, leaving a 1.33:1 wash. Both rebound to `:focus-visible`.
- **The Stage lock glyph `⌑` rendered as tofu.** Replaced with an inline SVG.
- **Locked Stage state was invisible to assistive tech** — `aria-label` on a bare `<span>` is not
  exposed. `role="img"` added, plus `role="group"` on six other labelled containers.
- **The Stage path clipped its own current token** — `overflow: hidden` cut the "Next" pill, the
  1.14 scale and the focus ring for any Stage in the final row.
- The headline's hard `<br>` would have **failed `identity.test.ts`**.
- The history trend drew **elliptical markers** (a `100 × 100` viewBox stretched into a wide box).
  Note `tests/acceptance/history.test.ts` regex-matches `data-trend-score-id="N" cx="…"` — **keep
  that attribute order** on the `<circle>`.
- **Unguarded `fetch` calls** on all three typing routes stranded the Player on the loading state
  forever after any network failure. All now fall back to their existing error copy.
- **The "Errors left" tile was permanently error-coloured**, so a flawless Speed Test still showed
  red beside the mint accuracy tile.
- **The next key did not take Sunshine** — it used a pale wash at 1.14:1 against the neighbouring
  caps. The single most important teaching affordance on the page was nearly invisible.
- Keycap labels bottomed out at 7.7px; several bare text controls were 15–16px tall; the mute
  toggle's emoji rendered at inherited size and its target was 38px.

## Composition brought onto the approved comp

- The home landscape is one grid: the question owns the left column, the two Track doors stand
  **freestanding and far apart** on the terrain in the right column, each with a knob and a paper
  pad. Grid columns rather than absolute placement guarantee they cannot collide at any viewport.
- The second fold is a **continuous indigo band** carrying the Learn column, the Stage trail and the
  Speed panel — not two cards floating on grey.
- The Stage trail shows **real curriculum Stage names** (1, 2, 3, 21) loaded in
  `src/routes/+page.server.ts`, with a quiet lock marker for 4–20 carrying an `sr-only`
  explanation. It replaced invented "Start / Build / Grow / Finish" labels.
- **The returning-Player home** — the surface a Player sees on every visit after the first — now has
  the same three folds: landscape, indigo room holding the Stage path, then the shared Night Indigo
  close. It previously ended on a white card stranded on flat lavender.
- Every fold hands off through the same rising paper curve. On a viewport taller than the page it is
  the indigo room that absorbs the slack, never a growing band of empty night.

## Shared component

`src/lib/components/TaskMasthead.svelte` — the indigo arrival band used by nickname, learn/complete,
history, players, grown-ups and primitives. Props: `back`, `backLabel`, `label`, `title`, `lead`,
`tone` (`neutral` | `learn` | `speed`), `keys`, `actions`. Width follows the `--task-width` custom
property set by each route's `main`. Decorative keycaps sit **below** the content layer so furniture
can never paint over a lead or an action.

**Typing routes deliberately do not use it.** They keep only a shallow Night Indigo band overhead
plus a Track-tinted dune underfoot, so the Attempt panel stays the dominant object. Their page
padding must always clear the band's deepest point — the header text is dark ink and would vanish on
the band. **If you change either number, re-verify at every breakpoint.**

## The on-screen keyboard

Keys are sized in **container query units** against the keyboard's own width, not the viewport, so
eleven columns fit whatever gutters the shell uses. Verified at 320px (23px keys, 9.6px labels, no
overflow) and at desktop (capped at 2.25rem). Raising the floors in viewport units had silently
pushed two rows outside the keyboard bed at 320px; that is why this is container-relative.

---

## Verification performed

Every route rendered and inspected in a real browser at desktop, 390px and 320px, including
loading, empty, error, cleared, failed and completed states, with seeded Scores, Stage unlocks and a
Weak-key Profile. Attempts were driven to completion on the Speed Test, Practice and a Learn Stage.
Focus order was walked and computed `:focus-visible` styles read on the home, nickname and task
routes.

- `npm run check` — 0 errors, 0 warnings
- `npm test` — 44/44
- Impeccable detector, run once over all changed UI — **0 warnings, 65 advisories**, all
  `design-system-*` ramp breadth. The colour category is now empty.

## Design-system artifacts

`DESIGN.md` gained the settled neutral ramp (`paper-deep`, `on-night`, `soft-line`, `pencil-line`,
`key-edge`, `key-edge-deep`), `sunshine-wash`, four further type steps, three radius steps, the Tint
Ink / Transparent Body / Ground-not-Mark / Two-Ring Focus rules, the two surface families, and the
Task Masthead and Stage Trail components. Its focus rule was corrected: a Sunshine outer ring falls
to 1.63:1 against the terrain the Track doors stand on, so the system uses Night Indigo there.

`.impeccable/design.json` previously described the **discarded incumbent** system. It now carries
the shipped world: 22 colour ramps, shadow and motion tokens, breakpoints, 12 rendered component
primitives, and the narrative.

The misnamed `--focus` / `--focus-line` tokens were renamed — they were never a focus ring, they are
the highlight ground. `--focus-line` was a duplicate of `--sun` and was removed entirely.

---

## Notes for whoever picks this up next

- `.claude/launch.json` starts the dev server with `DATABASE_PATH` set, pointing at a scratch SQLite
  file. Change or delete it freely. A seeded database with Scores, unlocks and a Weak-key Profile is
  preserved alongside it as `gettyping-seeded.sqlite.bak`.
- **Browser-pane quirks:** screenshots are sometimes composited at reduced scale or from a stale
  frame — re-navigate with `force: true`, or change the viewport height by 1px, to force a repaint.
  Any width below 768px enables mobile emulation in which `innerWidth` does not match `clientWidth`;
  layout is still correct, but verify narrow layouts by reading `getBoundingClientRect`, not by
  trusting the screenshot's right edge. `:focus-visible` only resolves after a real keyboard event,
  so press Tab once on the page before reading computed focus styles.
- `npm install` reported four dependency audit findings (three low, one high). Untouched — not a UI
  task, and not to be force-fixed as part of it.
- The untracked issue files under `.scratch/gettyping-spec/issues/` predate this work and were not
  staged, edited, moved or deleted. Nothing has been committed.
- The footer line *"Progress lives in this browser. There are no accounts to make."* restates
  product truth already published on `/grown-ups`. **The user approved it on 2026-08-09.**

## Deliberately not done

- The remaining 65 detector advisories are ramp breadth, not inconsistency. They reflect a
  legitimately wide fluid type range for an expressive children's UI. **Do not chase them by
  inventing more tokens.**
- `learn/complete/+page.svelte` hardcodes a four-row keyboard summary. It describes physical
  keyboard rows rather than curriculum, so it does not need to track the `stages` table — but it
  also will not.
- `grown-ups` is opened from the corner control with `target="_blank"` yet offers a back control.
  The route is reachable directly too, so the control is right for that path and merely redundant in
  the other.
