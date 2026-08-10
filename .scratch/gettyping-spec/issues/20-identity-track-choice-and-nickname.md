# 20 — Track choice, Nickname, and a Player in a cookie

Type: task
Blocked by: 18, 19
Status: done

## What to build

A first-time visitor's whole path to being a Player, plus the adult-facing page that explains what that means.

**Track choice comes first** — two doors framed by what the visitor wants to achieve ("I want to learn to type" / "I want to get faster"), never by age and never by self-assessed skill. An adult beginner belongs in Learn and must not be pushed out of it by a "for kids" label. Putting the choice first costs nothing (no typing, no identity) and is what solves the bootstrapping problem: the Nickname step that follows knows which audience it serves, instead of being one compromise field shared by a five-year-old and an adult speed-typist.

**Nickname then differs by Track.** Learn shows a handful of pronounceable, icon-illustrated candidate names as large tappable cards, with a shuffle for a different set, and a secondary "type your own" for a parent or an older beginner — so a child is not asked to type before the app has taught them how, and can choose without reading fluently. Speed Test shows a plain text field, because choosing your own handle is half the point of a board.

Because the cards come from a curated list they are **safe by construction**, so the profanity filter runs only on free text — a young child on the default path cannot trip it at all. It checks **on submit, never per keystroke**, so a slow typist is not accused mid-word by an innocent prefix. A rejection is a neutral redirect that never names what tripped, with the candidate cards offered immediately below so it becomes a choice rather than a dead end. It never silently substitutes a name — discovering you have been racing under a name you did not choose is worse than being told no. The no-real-names warning is inline at the field, where it is actionable.

The resulting Player is an opaque id in a **long-lived cookie shaped `{ active, players[] }`** — a list from the start, so siblings on one device can be separated later without a cookie migration. A returning visitor lands on a light home screen greeting them by Nickname with one dominant continue action.

**The grown-ups page** also lands here, at a stable URL reached from the corner link on every screen, deliberately styled to read as adult so a child skates past it. It carries three facts an adult needs and a child cannot consume: there is no account and no personal data; progress lives in this browser only and cannot be recovered if it is cleared; Nicknames are public on Leaderboards. There is no interstitial and no gate before a child can start — a pre-flow wall of text is worthless when the child is the one who opened the tab.

Authors the curated candidate name list, its icons, and the blocklist.

## Acceptance criteria

- [x] A first-time visitor sees the Track choice before anything else, framed by intent rather than by age or skill.
- [x] Learn's Nickname step offers tappable icon cards with a shuffle, plus a secondary type-your-own.
- [x] Speed Test's Nickname step is a plain text field with the public-name warning inline.
- [x] Profanity is checked on submit only, and only on typed free text — a curated card can never be rejected.
- [x] A rejected Nickname gets a neutral redirect that does not say what was wrong, with candidate cards offered below; nothing is substituted.
- [x] Choosing a Nickname creates a Player and writes `{ active, players[] }` into a long-lived cookie.
- [x] A returning visitor gets a home screen greeting them by Nickname with a single dominant continue action.
- [x] The grown-ups page is reachable from the corner of every screen, lives at a stable URL, and states all three facts plainly.
- [x] Nothing blocks a child from starting — no interstitial, no adult gate, no wall of text.

## Implementation note

The home screen renders its continue action in this slice. The two destination routes are owned by the dependent Attempt and Learn tickets: [21](./21-attempt-spine-speed-test.md) supplies `/speed-test`, and [26](./26-learn-stage-one-and-the-gate.md) supplies `/learn/stages/1`.
