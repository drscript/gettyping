# Decide whether GetTyping has audio, and what it covers

Type: grilling
Status: resolved
Assignee: Claude

## Question

Audio has never been discussed. [06-prototype-visual-design.md](./06-prototype-visual-design.md) settled the *visual* feedback language — including that correctness feedback pairs colour with a glyph/shape rather than relying on colour alone — but said nothing about sound, and the destination's "visual/UX principles" leaves it ambiguous whether audio is part of this spec at all.

The first decision is in-or-out: does GetTyping ship with sound, or is audio ruled out of scope like i18n and native apps? If it's in, what does it actually cover — per-keystroke click/error feedback, Stage-completion or Leaderboard-entry celebration, background music, spoken prompts? Each has a different weight: keystroke-level audio is the one most likely to reinforce learning for a young child *and* the one most likely to be intolerable to a parent in the same room.

Two constraints already on the map bear on this. Audio would be a *second* feedback channel alongside the colour+glyph pairing — worth deciding whether it must stay strictly redundant with the visual channel or may carry information alone. And [the accessibility line settled during destination-naming](../map.md) is baseline *visual* accessibility only, with screen-reader support explicitly out of scope — so if audio is in, it needs its own statement of what it is and isn't responsible for, rather than being mistaken for an assistive-tech story.

If audio is in scope, the flip side needs settling too: mute/volume control, whether it defaults on or off, and whether that preference persists (which would be the first Player preference stored beyond the Nickname — see [07-nickname-uniqueness.md](./07-nickname-uniqueness.md) and the `players` table in [09-db-schema.md](./09-db-schema.md)).

## Answer

**Audio is in scope, deliberately narrow and always silenceable.** Ruling it out entirely was the tempting simplification but the wrong one: [research/typing-pedagogy.md](../research/typing-pedagogy.md) twice recommends "optional audio/spoken cues… since auditory reinforcement is specifically called out as helpful for younger and struggling learners," and the cost of *specifying* audio is a paragraph while the cost of leaving it undecided is that an implementer either invents it unguided or ships silence by accident. Full multisensory treatment (music, character voices) was rejected as disproportionate for a solo project with no budget — the same test that ruled out the admin surface and behavioural anti-cheat in [10-score-integrity.md](./10-score-integrity.md).

### Layers: two in, two out

**In — per-keystroke, errors only.** Not correct keys, and not both. A correct keypress carries almost no information (the typist felt the key go down and a physical keyboard already clicked), so sounding it would be the loudest possible option in exchange for the least new signal. Errors are where audio genuinely earns its place: [03-research-typing-pedagogy.md](./03-research-typing-pedagogy.md) says early Stages should "prioritize keyboard/letter-position familiarity over strict no-look touch-typing discipline," which means the app *expects* a beginner to be looking at their hands — and a child looking down cannot see the colour-and-glyph feedback [06-prototype-visual-design.md](./06-prototype-visual-design.md) designed. Audio's job is covering the moments the eyes are off-screen.

Error-only is also **self-attenuating**: the better a Player gets the quieter the app becomes, and at the 90% gate from [04-curriculum-outline.md](./04-curriculum-outline.md) it is already down to roughly one sound in ten.

The honest weakness of error-only is that a Stage 1 beginner at 60% accuracy hears nothing but negative feedback at their most fragile. The fix is not a correct-key sound to dilute it, but a **constraint on the tone's character**: informational, not punitive — soft, short, low-salience, a tick rather than a game-show buzzer — and **non-escalating**, so a run of mistakes never compounds into something that feels like scolding.

**In — event moments.** Stage cleared, gate passed, Leaderboard entry earned. Maximum value for minimum cost: a handful of short sounds fired rarely, at exactly the moments 03 identifies as mattering most for young learners ("rewards tightly coupled to typing progress itself"). Rare sounds don't wear out a parent's patience.

**Out — background music.** The single thing most likely to make a parent close the tab, working directly against 06's founding constraint that the UI exists to let users focus on typing, and the heaviest asset in the list.

**Out — spoken prompts.** The research's case for voice rests on Read, Write & Type's phonics integration, and 04 declined that curriculum model in favour of key-position pairs — so the strongest argument for voice arrived attached to a design this project didn't take. Recorded speech also collides with the already-out-of-scope i18n line: every spoken word would need re-recording rather than re-translating.

**Audio does not flex per Track.** 06 flexes the visual language per Track, but with two sounds total and a single toggle there is nothing meaningful to flex, and the error tick is as valid for an adult on Speed Test as for a beginner.

### The invariant: strictly redundant, no exceptions

**Every sound duplicates something already visible on screen. No sound is ever the sole carrier of a fact.** Stated as a hard rule rather than a tendency, because exceptions arrive one at a time and each looks reasonable alone.

This is what makes everything downstream safe — **muting is lossless**. A Player on a silent phone loses nothing; a deaf or hard-of-hearing Player loses nothing; a classroom with the volume down loses nothing; and the mute control is a pure preference with no functional consequence to warn anyone about. It also neutralises a browser fact that would otherwise be a real bug: autoplay policies block audio until a user gesture, so the app's first sounds are unreliable by construction. Under this rule that is a non-event rather than information silently withheld from a new Player at their most lost.

### Accessibility posture: unchanged, and said out loud

Audio is **pedagogical reinforcement for a sighted Player whose eyes are on their hands** — not an assistive-technology feature. Screen-reader and full assistive-tech support remain out of scope exactly as decided at destination-naming; baseline visual accessibility only.

The redundancy invariant and this posture are the same statement read from two directions: if every sound merely duplicates something visible, audio definitionally cannot make the app usable without sight. Positioning audio as the beginning of an accessibility story was rejected as the option that sounds generous and isn't — a typing tutor that teaches physical key positions by highlighting them on an on-screen keyboard is inherently visual, and teaching touch-typing to a blind learner is a different product with different pedagogy, not this one with sounds added. A half-commitment invites someone to depend on a channel never designed to bear that weight.

This is written into the spec rather than left implicit precisely because a future reader will see "the app has audio" and reasonably wonder whether the accessibility line moved. It didn't.

### Controls

- **Defaults on.** Audio exists primarily for the Learn beginner, and a five-year-old will never hunt through settings to switch it on — default-off means the feature doesn't exist for the audience it was built for. Q3's choices already made this the quiet version, and the annoyed parent is one tap from silence.
- **A single mute toggle** — no volume slider, no per-layer switches. There are exactly two sound types in the app; a slider has no meaningful middle position for a child, and per-layer toggles imply a settings panel this app has deliberately never built.
- **A persistent corner icon on every screen, reachable mid-Attempt** — same slot family as the "For grown-ups" affordance from [11-first-run-onboarding.md](./11-first-run-onboarding.md). Reachability during typing is the load-bearing detail: the moment a parent decides they've had enough is mid-exercise, and if mute lived only on the home screen, silencing the app would mean abandoning a Stage in progress. A small static icon doesn't violate 06's focus principle the way the always-visible Leaderboard did — it isn't competing for attention, only reachable.

### Storage: the cookie, device-scoped

The preference rides in the cookie alongside `{ active, players[] }` (per 11's amendment to 07). **No schema change** — `players` stays a pure identity table.

**Device-scoped, not Player-scoped**, which is the substantive half of this decision. A server-side `players.audio_enabled` column fails twice over. First, the usual reason to put a preference on the server is cross-device sync — but 07 established that a Player *is* a cookie on a browser, with no recovery and no cross-device existence, so a Player literally cannot appear on a second device and the column would buy nothing. Second and worse: **mute is a property of the room, not the person.** A parent silencing the family tablet wants it silent for both children; under Player-scoping, sibling A mutes, sibling B taps "Not you?", and the sound returns — 11's switch-player affordance would actively undo the parent's decision.

Not persisting at all was rejected for the mirror-image reason: a preference that resets every visit means the parent re-mutes daily, which is how a feature earns real resentment.

Storing it in the cookie also inherits 07's original reason for choosing a cookie over `localStorage` — it's readable during SSR, so SvelteKit renders the correct mute state server-side with no flash of unmuted UI on load.

### Logged rather than decided

The **sound assets themselves** — the actual audio files and their character — are content-authoring, the same category as Stage lesson copy, word-bank vocabulary, and the Nickname word list. The spec fixes the constraints (soft, short, non-escalating, strictly redundant); it does not author the files.
