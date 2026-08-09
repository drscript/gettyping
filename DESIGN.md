---
name: GetTyping
description: A vivid typing landscape built from tactile schoolroom objects and flowing paper terrain.
colors:
  night-indigo: "#21185f"
  playground-indigo: "#362d91"
  active-indigo: "#4b44bd"
  lesson-blue: "#5d83dd"
  sky-blue: "#9ec8ff"
  paper-lavender: "#f2f0ff"
  paper-deep: "#e9e6fb"
  surface-white: "#ffffff"
  ink-indigo: "#241b63"
  muted-indigo: "#625c8d"
  on-night: "#cfc9ff"
  soft-line: "#d9d5f2"
  pencil-line: "#c9c3ec"
  key-edge: "#bbb4e7"
  key-edge-deep: "#aaa1da"
  sunshine: "#ffd54a"
  sunshine-deep: "#f0a91d"
  sunshine-wash: "#fff1a6"
  coral: "#ff7657"
  coral-deep: "#d84a35"
  mint: "#70d7a5"
  mint-deep: "#238c65"
typography:
  display:
    fontFamily: "Fredoka, Baloo 2, ui-rounded, sans-serif"
    fontSize: "clamp(3rem, 8vw, 6.5rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Fredoka, Baloo 2, ui-rounded, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Fredoka, Baloo 2, ui-rounded, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.15rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fredoka, Baloo 2, ui-rounded, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.15
  subtitle:
    fontFamily: "Fredoka, Baloo 2, ui-rounded, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.2
  lead:
    fontFamily: "Nunito, Avenir Next Rounded, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.6
  body:
    fontFamily: "Nunito, Avenir Next Rounded, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.55
  caption:
    fontFamily: "Nunito, Avenir Next Rounded, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 600
    lineHeight: 1.55
  label:
    fontFamily: "Nunito, Avenir Next Rounded, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.08em"
  micro:
    fontFamily: "Nunito, Avenir Next Rounded, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.06em"
  speed:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, monospace"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  key: "0.75rem"
  chip: "0.9rem"
  control: "1rem"
  tile: "1.1rem"
  card: "1.5rem"
  panel: "1.6rem"
  door: "2.5rem 2.5rem 1.4rem 1.4rem"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "0.4rem"
  sm: "0.7rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.25rem"
  xxl: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.sunshine}"
    textColor: "{colors.ink-indigo}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.3rem"
  button-speed:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink-indigo}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.3rem"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-indigo}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-indigo}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.9rem 1rem"
  keycap:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-indigo}"
    typography: "{typography.speed}"
    rounded: "{rounded.key}"
    size: "2.5rem"
---

# Design System: GetTyping

## Overview

**Creative North Star: "The Learning Landscape"**

GetTyping is a school desk expanded into a world. A deep indigo room opens onto flowing periwinkle paper terrain populated by a keyboard, backpack, pencil, books, lamp, keys, and small plant forms. The interface feels authored for learners: vivid, dimensional, reassuring, and immediately understandable. Its energy comes from physical learning objects and bold composition, not badges or noisy reward mechanics.

The committed world is inspired by [Club Baby EDU](https://dribbble.com/shots/25263439-Club-Baby-EDU-Kids-Education-Website) and the approved composition at `docs/design/gettyping-redesign-approved.png`. GetTyping uses that craft level—saturated educational color, original soft 3D objects, organic boundaries, oversized playful lettering, and tactile white controls—while preserving its own two-Track mechanism. Learn is sunny, rounded, and adventurous. Speed Test & Practice belongs to the same room but becomes cooler, sharper, and more measured.

**Key Characteristics:**

- Committed indigo and periwinkle fields own large page regions.
- Original schoolroom objects make the mechanism visible before explanation.
- Learn uses sunshine and soft arches; Speed uses coral, mint, blue, and keycap geometry.
- Controls feel pressable through layered edges, inset highlights, and short physical motion.
- Organic paper-landscape boundaries pace dense and quiet areas.
- Operational clarity stays stronger than decoration on typing surfaces.

## Colors

The palette is a full classroom set anchored by indigo. Color is structural: large fields establish place, while sunshine, coral, and mint distinguish actions and states.

### Primary

- **Night Indigo** (`#21185f`): deepest immersive field, footer-like regions, and high-contrast headings.
- **Playground Indigo** (`#362d91`): primary environmental field and navigation surface.
- **Active Indigo** (`#4b44bd`): active controls and middle-depth panels.
- **Lesson Blue** (`#5d83dd`): the flowing paper landscape and Speed Track surfaces.

### Secondary

- **Sunshine** (`#ffd54a`) with **Sunshine Deep** (`#f0a91d`): Learn actions, current Stage markers, and warm emphasis.
- **Sunshine Wash** (`#fff1a6`, the `--highlight` token): the pale fill that marks the current character and the Player's own Leaderboard row. It is a *ground*, never a mark — at 1.14:1 against white it cannot carry meaning on its own, so anything it highlights also changes shape, weight, or elevation.
- **Coral** (`#ff7657`) with **Coral Deep** (`#d84a35`): Speed Track entry, incorrect states, and warm contrast.
- **Mint** (`#70d7a5`) with **Mint Deep** (`#238c65`): successful states, accuracy, and secondary Speed actions.

### Neutral

- **Paper Lavender** (`#f2f0ff`): quiet page regions and readable content grounds.
- **Paper Deep** (`#e9e6fb`): the quiet tile behind metrics, aggregates, and secondary rows on white.
- **Surface White** (`#fff`): cards, keycaps, inputs, and raised labels.
- **Ink Indigo** (`#241b63`): text and hard UI edges.
- **Muted Indigo** (`#625c8d`): supporting copy and metadata on pale grounds.
- **On Night** (`#cfc9ff`): supporting copy on any saturated indigo field. Never use Muted Indigo there.
- **Soft Line** (`#d9d5f2`): the default 2px border on white panels.
- **Pencil Line** (`#c9c3ec`): dividers and the solid lower edge of pale tiles.
- **Key Edge** (`#bbb4e7`) and **Key Edge Deep** (`#aaa1da`): the solid lower edge of keycaps, and the bed the keyboard sits in.

**The Tint Ink Rule.** Text on Sunshine, Mint, or any saturated fill takes Night Indigo, never Muted Indigo — Muted Indigo only clears 4.5:1 on Paper Lavender and Paper Deep.

### Named Rules

**The Field, Not Fleck Rule.** Indigo and periwinkle occupy regions. Do not reduce this world to colorful accents scattered over a neutral app shell.

**The Track Temperature Rule.** Learn leads with Sunshine; Speed leads with cooler blue and mint, using Coral for urgency and error—not as its entire identity.

## Typography

**Display Font:** Fredoka (with Baloo 2 and rounded fallbacks)  
**Body Font:** Nunito (with Avenir Next Rounded and sans-serif fallbacks)  
**Speed Font:** the native `ui-monospace` / SF Mono stack

**Character:** Fredoka behaves like painted classroom lettering at large scale: rounded, compact, and strong enough to sit inside saturated fields. Nunito keeps explanations warm and highly legible. Monospace is reserved for live metrics, key data, and the Speed Track's more precise expression.

### Hierarchy

- **Display** (700, `clamp(3rem, 8vw, 6.5rem)`, `0.92`): one expressive statement per major arrival surface.
- **Headline** (700, `clamp(2rem, 5vw, 3.75rem)`, `1`): page and state titles.
- **Title** (700, `1.1–1.5rem`, `1.15`): doors, cards, and Stage headings.
- **Body** (600, `0.9–1.05rem`, `1.5–1.65`): instructions and explanations, generally within `58ch`.
- **Label** (800, `0.7–0.78rem`, `0.08em`, uppercase): eyebrows and compact state names.
- **Speed** (700, `0.8–1.2rem`, `1.5`): key data, WPM, accuracy, and generated-practice details.

### Named Rules

**The Painted Headline Rule.** Display type may bend, stagger, overlap a field boundary, or carry a simple solid shadow; body copy and controls remain normally set.

## Layout

The primary scene spans the viewport rather than sitting inside a conventional card shell. Content containers run up to `76rem`, with `1–2rem` responsive gutters. Arrival surfaces use an immersive first region followed by a curved paper boundary.

Surfaces fall into two families, and the difference is deliberate:

- **Arrival and record surfaces** (Nickname, Learn completion, history, Players, grown-ups, primitives) open with the **Task Masthead**: a full-bleed Night Indigo room carrying the back control, kicker, headline and lead, closed by a paper curve that rises into it. The body then sits on Paper Lavender and ends on a low Track-tinted dune.
- **Typing surfaces** (Learn Stage, Speed Test, Practice) get no masthead at all. The Attempt panel must be the dominant object on the screen, so they keep only a shallow Night Indigo band overhead — enough to seat the persistent white controls — and the same dune underfoot. Their header sits on paper below the band, in ink, and page padding must always clear the band's deepest point at every breakpoint.

Two Tracks share a layout grammar but not identical composition. Learn paths may curve, step, and use large numbered tokens. Speed surfaces use straighter rails, key grids, metric groupings, and cooler panels. At `720px` and below, scenes stack into a vertical reading order, decorative objects reduce or move behind content, and the primary action never falls below illustrative clutter.

Full-bleed shapes hang past the measure with `left: calc(50% - 50vw); width: 100vw`. `html` carries `overflow-x: clip` so this never yields a horizontal scrollbar. `body` must stay transparent — an opaque `body` background paints over every `z-index: -1` landscape layer.

## Elevation & Depth

Depth is physical and deliberately visible. White cards and keycaps use a pale indigo border, a soft ambient shadow, and a darker solid lower edge that makes them feel pressable. Large doors use arched shells with inset highlights. Decorative illustrations use soft, broad shadows consistent with molded clay or painted foam.

### Shadow Vocabulary

- **Paper Float** (`0 18px 40px rgb(24 16 86 / 18%)`): major white panels over saturated fields.
- **Card Rest** (`0 8px 0 rgb(80 68 167 / 18%), 0 18px 30px rgb(25 18 88 / 12%)`): tactile cards and inputs.
- **Key Rest** (`0 5px 0 #bbb4e7, 0 9px 14px rgb(33 24 95 / 16%)`): keyboard keys and compact controls.
- **Door Rest** (`inset 0 4px 0 rgb(255 255 255 / 42%), 0 10px 0 rgb(31 23 94 / 24%), 0 24px 36px rgb(20 13 75 / 24%)`): the two primary Track doors.

### Named Rules

**The Pressable Edge Rule.** Interactive objects get one solid lower edge and one ambient shadow. On press, translate down by the edge depth and remove that solid offset.

## Shapes

The system combines organic landscapes with familiar learning-object geometry. Page regions use large asymmetrical curves and soft wave boundaries. Cards use `1.25–1.75rem` corners. Primary Track doors use tall arches. Pills act as raised labels and actions. Keycaps use compact rounded squares with a firm lower edge.

Stars, pencils, dots, underlines, key silhouettes, paper scraps, and small plant forms are the ornamental vocabulary. These details should appear in composed clusters and at field boundaries, not as evenly distributed confetti.

## Components

### Buttons

- **Primary Learn:** Sunshine fill, Ink Indigo text, pill shape, inset top highlight, and Sunshine Deep lower edge.
- **Primary Speed:** Mint or Lesson Blue fill with Ink Indigo or white text depending on contrast.
- **Secondary:** white raised key or pill with Ink Indigo text and an indigo-tinted lower edge.
- **Focus:** 3px Active Indigo ring on pale fields. On Night Indigo or Playground Indigo, a 3px Surface White ring instead — Active Indigo reaches only 2.1:1 there. On the pale periwinkle terrain, and on any control that scrolls across both grounds, a 3px Surface White ring **inside** a Night Indigo outer ring (`box-shadow: 0 0 0 9px`), composed with the control's rest shadow so its pressable edge survives. A Sunshine outer ring is not usable: it falls to 1.63:1 against the terrain the Track doors stand on.
- **Motion:** `140ms cubic-bezier(.2,.8,.2,1)` physical press and release.

### Cards / Containers

- **Background:** Surface White for information; saturated Track colors for decisions.
- **Corners:** `1.25–1.75rem`; doors use an arch rather than a generic card.
- **Border:** 2px Pencil Line or a darker tone of the card's fill.
- **Depth:** Card Rest; large illustrated panels may use Paper Float.
- **Padding:** `1.25–2rem` desktop and `1–1.4rem` compact.

### Inputs / Fields

- **Style:** white, tall, rounded, and visibly tactile with a Pencil Line border and Key Rest lower edge.
- **Focus:** Active Indigo border plus a 3px Active Indigo ring at 3px offset. Bind it to `:focus-visible`, never `:focus` — a scoped `:focus` rule outranks the global `:focus-visible` ring and silently removes it for keyboard users.
- **Error:** Coral border and pale coral fill with explanatory text; never color alone.

### Navigation

The wordmark is large enough to establish the world. Persistent utilities sit as white or translucent raised controls on indigo. Task routes add a clear back control and a short contextual label; navigation never becomes a generic full-width dashboard bar.

### Task Masthead

The shared arrival band for every non-typing route (`TaskMasthead.svelte`). Night Indigo, full-bleed, with a raised white back pill, an optional Track-coloured kicker, a Fredoka headline capped at `16ch`, and a lead in On Night at `52ch`. It closes with the same paper curve the home landscape uses, and seats one composed keycap cluster at the horizon — dropped entirely below `820px` rather than shrunk. It takes a `tone` of `neutral`, `learn`, or `speed`, which only changes the kicker and keycap accent. It is never a full-width dashboard bar and never appears on a typing surface.

### Track Doors

The home page's signature controls are two freestanding arched doors integrated into the illustrated paper landscape. Learn is Sunshine; Speed is Coral. Each has one icon medallion, direct first-person copy, a circular arrow key, and a visible pressed state.

### Stage Path

Stages are physical tokens connected by a winding paper trail. Cleared tokens use Mint and a check badge; current uses Sunshine, greater scale, and a "Next" pill; locked uses pale indigo with a visible lock drawn as SVG — never a font glyph, which can fall through to tofu. Every token carries the full `Stage n, name, state` in `aria-label`, so the sequence stays legible without the illustration and the state is never carried by colour alone.

The logged-out home shows the same trail in preview: real Stage names for 1, 2, 3 and 21 loaded from the curriculum, with a single quiet lock marker standing in for 4–20. Never invent Stage names for it.

### Typing Surface

The operational center is a raised white practice board on Paper Lavender. The prompt remains large and dominant. Learn feedback uses Fredoka and generous spacing; Speed feedback uses monospace and tighter rhythm. The keyboard below uses physical keycaps; the next key rises and takes Sunshine. Correct, incorrect, current, and pending states always differ by more than hue.

## Do's and Don'ts

### Do:

- **Do** let a saturated field or illustrated environment own every arrival surface.
- **Do** make GetTyping's two-Track mechanism visible as two materially distinct but related paths.
- **Do** preserve familiar controls and scan order inside expressive compositions.
- **Do** use original schoolroom objects and code-native paper, key, star, and trail motifs.
- **Do** keep Speed Test & Practice cooler, straighter, and more precise without leaving the shared world.
- **Do** reduce decorative density before reducing type or tap-target size on small screens.

### Don't:

- **Don't** retreat to the old warm-paper minimalism or a neutral SaaS card grid.
- **Don't** place core UI text or controls inside raster artwork.
- **Don't** distribute tiny decorative icons evenly like confetti.
- **Don't** invent accounts, testimonials, performance claims, pricing, or capabilities.
- **Don't** use gamification chrome—streaks, currencies, loot, or badges—to simulate motivation.
- **Don't** let 3D illustration obscure state, focus, reading order, or keyboard operation.
