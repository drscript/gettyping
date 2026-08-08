# Design the first-run/onboarding flow

Type: grilling
Status: resolved
Assignee: Claude

## Question

The destination requires **user flows for both Tracks**, but nothing yet specifies what happens on a Player's very first load — before any Track has been chosen. [07-nickname-uniqueness.md](./07-nickname-uniqueness.md) settled the *mechanics* of identity (opaque UUID in a long-lived cookie, non-unique editable Nickname snapshotted onto each Score) and [06-prototype-visual-design.md](./06-prototype-visual-design.md) settled the visual language, but neither describes the sequence a brand-new visitor actually walks through.

Open decisions: What does a five-year-old see on first load, and in what order — Nickname entry, Track choice, straight into typing? How is the Track choice framed so a child (or the adult sitting with them) picks correctly between Learn and Speed Test & Practice, given the two Tracks target very different audiences? Is there any parent-facing step at all — an intro screen, a "grown-ups start here" affordance, guidance on the no-real-names nudge — or is the whole flow child-facing? How does Nickname entry behave for a Player who cannot yet reliably read or type (the bootstrapping problem: the first thing the app asks them to do is type, before it has taught them how)? How does the profanity filter surface a rejection to a young child without confusing or shaming them? And what does a *returning* Player see — straight back to where they left off, or through a lighter version of the same flow?

Resolving this closes the last unwritten piece of "user flows" the destination requires.

## Answer

Rendered end to end in [prototypes/resolved-design/](../prototypes/resolved-design/) — all five screens below are walkable there.

One fact reframed the whole ticket: **a five-year-old does not arrive at a URL by themselves.** For the Learn Track's core audience an adult opened the tab, so "child-facing vs. parent-facing" is not a binary — the question is only which screens assume an adult is present.

### First-run sequence

**Track choice → Nickname → typing**, on both Tracks. Track choice goes first because it is the one step that genuinely must happen before anything else (the two Tracks serve different people) and it costs nothing — a two-door screen with no typing and no identity. Putting it first is also what *solves* the bootstrapping problem, because the Nickname step then knows which audience it is serving and can differ radically per Track instead of being one compromise field shared by a five-year-old and an adult speed-typist.

Rejected: Nickname-first (puts a typing task in front of someone who came here because they cannot type), and deferring the Nickname to the first Score (zero friction to the first keystroke, but it interrupts the moment of completion with a form and puts an identity-less Attempt through the `attempt_tokens` handshake that [10-score-integrity.md](./10-score-integrity.md) designed around a known Player).

### Track choice: framed by intent, with recovery instead of a perfect router

Two doors, framed by **what you want to do** — "I want to learn to type" / "I want to get faster" — never by age and never by skill self-assessment.

Age framing is ruled out by [04-curriculum-outline.md](./04-curriculum-outline.md)'s explicit rejection of an age-fork: adults who already type place out via the Speed Test, so a 40-year-old hunt-and-peck typist belongs in Learn and must not be shamed out of it by a "Kids" label. Ability framing ("can you type without looking?") is unreliable in exactly the population that gets it wrong, and is a reading task at the door for a non-reader. Auto-routing via a micro-test reintroduces the wall the whole ordering was chosen to remove.

Because no framing is right 100% of the time, the investment goes into **mis-pick recovery rather than a door that cannot be mis-picked**:
- A Speed Test result below a floor offers "want to start from the beginning instead?"
- Learn always carries a visible way out to the Speed Test.

### Parent-facing: a persistent route, not a gate

Three facts an adult needs and a child cannot consume: no account and no personal data; progress lives in this browser only and is unrecoverable if cleared (per [07-nickname-uniqueness.md](./07-nickname-uniqueness.md)); Nicknames are public on Leaderboards.

- **No interstitial and no gate.** Information delivered before it means anything is information not delivered, and a pre-flow wall of text is worthless when the child is the one who opened the tab.
- **A persistent "For grown-ups" affordance** in the corner of every screen, deliberately styled to read as adult rather than as a kid-facing button, leading to a real page at a stable URL carrying all three facts. Being permanent rather than one-shot means the durability warning is findable at Stage 9, not only in the first ten seconds.
- **The no-real-names nudge is inlined at the Nickname step**, because that is the one place the information is actionable at the moment it is needed.

### Nickname entry: tap-to-pick on Learn, free text on Speed Test

- **Learn** defaults to a handful of pre-generated, pronounceable, icon-illustrated candidate names as large tappable cards, with a shuffle for more, and a secondary "type your own" for the parent or the older beginner.
- **Speed Test & Practice** defaults to a plain text field — choosing your own handle is half the point of a Leaderboard.

Key consequence: **names drawn from a curated word list are safe by construction**, so the profanity filter only ever runs on free-text input. A young child on the default path cannot trip the filter at all. Rejected: a plain field on both Tracks (makes the child a spectator and imposes a mandatory adult dependency on every first run), and an adjective+noun tile combiner (two decisions instead of one, a bigger grid to parse, and combinatorially more producible strings to vouch for).

### Profanity rejection

Only a deliberate free-text typist — an adult, a parent, or an older beginner — can ever see a rejection, so the confused five-year-old the question worried about is designed out rather than handled.

- **Checked on submit, never per-keystroke** — as-you-type validation flags innocent prefixes mid-word and flickers accusatorially through every partial string for a slow typist.
- **Neutral redirect**: "let's use a different name," with no naming of what tripped (don't teach the filter's boundaries, don't shame the false positive), and the Q4 candidate cards offered immediately below — a rejection becomes a choice rather than a dead end, reusing a component already built.
- **No appeals path, and the filter runs conservative.** The app already nudges away from real names, so the classic false-positive cost largely evaporates: nobody here *needs* their legal surname to pass. The cost of a false positive is one more tap, which does not justify building an appeals mechanism into an app that has deliberately refused to build authentication.
- **Never silently substitute.** The Nickname is public on a Leaderboard; discovering you have been racing under a name you did not choose is worse than being told no.

### Returning Player: a light home screen

Greeted by Nickname, one dominant continue CTA (next unlocked Stage, or the Speed Test), progress shown so a child can read it at a glance, the other Track clearly secondary, grown-ups link in its usual corner. One tap to resume rather than zero.

Deep-linking straight back into the next Stage was rejected: the single tap it saves is not worth being the app's only surface for everything that is not typing. The home screen is where the mis-pick recovery path, the grown-ups affordance, the editable Nickname from 07, the switch-player affordance below, and a visible sense of progress all live — inventing five separate entry points is worse than one screen. It is also the natural place to show a returning Learn Player how far they have come, the strongest reason a child returns tomorrow.

### Shared device: minimal switch-player

The Learn Track's core audience is children in families, and families have more than one child. Identity is a cookie on a browser, so on a family tablet two siblings are the same Player: shared Stage progress, shared Leaderboard entries, and one Weak-key Profile blending two different people.

That last one is not cosmetic — a blended profile means [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md)'s adaptive generation targets keys that are weak for *neither* sibling, so the app's central mechanic quietly stops working for exactly the households Learn was built for.

**Resolution**: the cookie carries `{ active, players[] }` instead of a bare UUID, and the home screen gets a "Not you?" affordance that either switches to a known Player on this device or runs the Nickname step to mint a new one. **No schema change** — `players` already holds N rows; only the cookie payload and one screen change. Full profile management (remove, avatars, a picker on every load) is scope creep into the account system this app has refused to build.

### Amendment to a closed ticket

[07-nickname-uniqueness.md](./07-nickname-uniqueness.md) point 4 specified a cookie holding *an* opaque Player UUID. That is amended here to `{ active, players[] }` to support multiple Players per device. An addendum is recorded on 07.

### Logged rather than decided

- The **generated-nickname word list itself** is content-authoring, the same category as Stage lesson copy and the word-bank vocabulary already out of scope. The mechanism (curated list, safe by construction) is the spec decision; the words are not.
- The **Speed Test floor** that triggers the "start from the beginning?" offer is a playtest-tuned number, not a spec constant — the same shape as the targeting-aggressiveness knob already in the map's fog.
