# Decide nickname uniqueness & identity persistence handling

Type: grilling
Status: resolved

## Question

Nicknames are the only identity credential (no password, per [0001-nickname-only-identity.md](../../../docs/adr/0001-nickname-only-identity.md)). Must a Nickname be globally unique, or can two Players share one (and if so, how does the Leaderboard disambiguate them)? What happens when a Player's local browser storage/token is cleared — do they lose their history and have to start over under a new identity, or is there any recovery path (e.g. a recovery code) within the no-password constraint?

## Answer

1. **Nicknames are not unique.** Anyone can use any Nickname; there's no ownership guarantee, consistent with the ADR's acknowledgment that nothing stops name reuse.
2. **No Leaderboard disambiguation.** Duplicate Nicknames display as-is, plain text — no suffix, tag, or color differentiator.
3. **No recovery mechanism.** Losing local device state means starting over as a brand-new, unrelated Player. Old Scores stay on Leaderboards but become unclaimable; the old Weak-key Profile is gone. This follows directly from the ADR's own language, so no further recovery UX (e.g. a recovery code) is needed.
4. **Identity persistence mechanism**: a long-lived (~10yr), non-httpOnly cookie holding a server-generated opaque Player UUID, set the first time a Nickname is entered. Chosen over `localStorage` because the stack (SvelteKit SSR, per [02-tech-stack.md](./02-tech-stack.md)) can read a cookie during server rendering to identify the Player (e.g. to highlight "your row" on a Leaderboard) without a client-side JS round trip.
5. **Nicknames are editable post-creation** — a simple update to the Player row's `nickname` column. History, Scores, and Weak-key Profile stay attached via the Player id, unaffected by rename.
6. **Nickname is snapshotted onto each Score at Attempt time** — Leaderboard rows show the Nickname used *then*, not the Player's current Nickname. Chosen over a live join to Player for display consistency of historic entries and simpler Leaderboard read queries in the DB schema ticket.

Schema implications for [09-db-schema.md](./09-db-schema.md): a `players` table (id UUID, nickname, created_at) and a `nickname` column snapshotted directly onto the Score/Attempt row — Leaderboard queries read Scores directly without joining back to `players` for the display name.

## Addendum — cookie payload amended by [11-first-run-onboarding.md](./11-first-run-onboarding.md)

Point 4 above specified the cookie holding *an* opaque Player UUID (one Player per browser). The onboarding ticket found this breaks the shared-family-device case that the Learn Track's core audience lives in: two siblings on one tablet become the same Player, blending their Weak-key Profiles and corrupting the adaptive generation in [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md).

**Amended**: the cookie carries `{ active, players[] }` — the active Player UUID plus the UUIDs known on this device — and the returning-Player home screen offers a "Not you?" affordance to switch or mint a new one. Everything else in point 4 (long-lived, non-httpOnly, server-generated opaque UUIDs, readable during SSR) is unchanged, and there is **no schema change**: `players` already holds N rows.
