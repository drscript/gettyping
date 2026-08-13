# Flow, recording, history, audio

Type: grilling
Status: resolved
Blocked by: 01, 02, 03
Part of: learn-generated-practice map

## Question

Where does the Lead-in live in the Learn Stage flow? Does it write a Score? Does it fold the Weak-key Profile? What handshake and HTTP shape does it use? What does it sound like? Does it appear in personal history, on a Leaderboard, or in the Practice aggregate?

## Answer

### Placement

**Same Learn Stage route, card before the Attempt, not a new URL.** Mirror Finger stretch's card-swap: the Stage page already swaps between the gated Typing surface, the failure card, the cleared card, and the stretch surface without changing the path. A Lead-in is another card in that swap, shown on landing when ticket 02's offer rules say so.

Landing with a Lead-in on offer **must not create the gated Exercise handshake**. Today's page fetches the Exercise on load and writes an `attempt_tokens` row immediately. That would start the server clock on an Attempt the Player has not chosen to take, and would burn a token if they take the Lead-in instead. The landing response tells the client whether a Lead-in is on offer; the gated Exercise is served only when the Player starts it (skip, or primary CTA after a Lead-in).

When a Lead-in is not on offer (Stage 1; Stage 2–4 with no previously-taught weakness score), keep today's auto-start. Stage 1 in particular must not gain an extra tap before the first keys a five-year-old ever types.

Rejected: `/learn/stages/n/lead-in` or any second route (Finger stretch refused this; an extra URL is an extra back-button trap). Rejected: putting the Lead-in on the home screen or Stage list (the home screen is not a typing surface; [11](../../gettyping-spec/issues/11-first-run-onboarding.md) / [16](../../gettyping-spec/issues/16-learn-completion-and-revisiting.md) already refused extra hubs). Rejected: a modal over the live Exercise (the Exercise would already have started).

### Card grammar

**Offer card** (Stage start, offer rules hold):

- Dominant CTA starts the gated Exercise (the Stage's existing "Find X and Y" made into the primary action).
- Subordinate action starts the Lead-in. Child-facing: Stage 5+ "Try some words first"; Stage 2–4 "Try these first".
- No stats, no Leaderboard, no accuracy target. This is not a gate.

**Lead-in typing** — the same typing surface as everything else (on-screen keyboard, next-key highlight, colour+glyph feedback). Heading names the activity in child language, not the glossary term.

**Lead-in result card**:

- No Score, no WPM, no accuracy number, no Leaderboard. Finger stretch returns accuracy to the client and does not display it; a Lead-in should not display it either. A number here would look like a Score and invite comparison with the gate.
- Dominant CTA starts the gated Exercise.
- Subordinate: take another Lead-in (fresh generation).
- Copy stays a beat, not a ceremony — then the Stage.

**Failure card / stretch result / cleared card** — unchanged, except:

- Failure **Try again** starts the gated Exercise directly (no Lead-in card).
- Stretch **Try the Stage** starts the gated Exercise directly.
- Leaving and returning to the Stage is a new landing; offer rules apply again.

A Lead-in in flight that is abandoned (navigate away, token TTL) persists nothing, same as an abandoned stretch.

### Recording

Same contract as Finger stretch:

- Server-side generation. Client-side generation would leave the server unable to check a single character and would ship the Profile to the browser — the reason [10-score-integrity.md](../../gettyping-spec/issues/10-score-integrity.md) moved Practice generation to the server, and the reason stretch followed.
- Handshake: existing `generated` `attempt_tokens` kind. Pins the served string and the server-observed clock. No new kind, no new column, no schema change. [09-db-schema.md](../../gettyping-spec/issues/09-db-schema.md) already recorded that stretch fits this kind; a Lead-in is the same shape.
- Existing HTTP seam: GET creates the handshake and returns `{ token, exercise: { content } }`; POST submits the raw keystroke stream; structural failure rejects and folds nothing; accepted stream folds the Weak-key Profile.
- Completion writes **no Score**. Response body is accuracy-only, like stretch (`{ accuracy }`), so the client cannot accidentally render a result panel that looks like an Attempt.
- Not an Attempt in glossary terms. Not `leaderboard_eligible` anything — there is no Score row to flag.
- Structural rules (token ownership, completeness, monotonic timestamps) still apply. There is no plausibility-tier Score to keep; a structurally valid stream folds the Profile and a structurally invalid one does not.

Rejected: a new `attempt_tokens` kind `lead-in` (nothing about the row would differ from `generated`). Rejected: writing a Score with `exercise_id = null` (that *is* a Practice Attempt, and it would pad the Practice aggregate — the exact reason stretch writes no Score, [17](../../gettyping-spec/issues/17-personal-history-surface.md) addendum). Rejected: skipping the handshake and trusting client text (integrity posture is system-wide, not "only when there is a Leaderboard").

The HTTP resource is a sibling of the existing stretch seam (`/api/attempts/stretch/{stageId}`): same verbs, same body shape, parameterized by Stage, forbidden when the Stage is not open (403) or there is no active Player (401). Serving a Lead-in when ticket 02 says it should not be offered is allowed as a direct API call the way stretch is servable before `stretchOfferCount` — the card is the offer policy; the resource still requires an open Stage. The card must not appear when the offer rules fail.

### History and boards

A Lead-in **does not appear as a Score row**, so it cannot appear:

- on any Leaderboard (there is no Exercise, and no Score),
- in Learn personal history (best-per-cleared-Stage reads Scores joined to Learn Exercises),
- in the Practice aggregate (count and `elapsed_ms` sum over `exercise_id IS NULL` Scores).

Same invisibility Finger stretch already has, for the same reason: a generated no-Score run is not practice the Player chose on the Practice Track, and listing it would render noise as data. The Weak-key Profile still moves; history's Profile snapshot is how a Lead-in shows up, indirectly.

Rejected: a "Lead-ins taken" counter (a statistic nobody can compare, on a surface [17](../../gettyping-spec/issues/17-personal-history-surface.md) kept strictly honest about what each Track can say).

### Audio

**Error ticks only**, the same per-keystroke tick the typing surface already plays. **No completion sound. No failure sound.** A Lead-in is not a win and not a gate miss; sounding either would teach the wrong lesson (a cheer for skipping the Stage, or a sting for a prelude). Mute still works mid-run, device-scoped, lossless — the redundancy invariant is untouched.

Rejected: the Stage-cleared completion sound at the end of a Lead-in (that sound means the gate moved). Rejected: a distinct "Lead-in finished" chime (a third event sound, and a ceremony this card is specified not to have). Rejected: silencing error ticks (eyes-on-hands is as true here as on the Exercise).
