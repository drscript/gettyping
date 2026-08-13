# 10 — Stage 1 intro persistence on the Learn Attempt seam

Type: task
Blocked by: none — can start immediately
Status: ready-for-agent

## What to build

The HTTP half of the Stage 1 intro: a Player who has never acknowledged the bumps does not receive an Attempt token, and acknowledging it is a fact on the Player row that transfer already carries.

Add nullable `stage_one_intro_seen_at` to `players` (Drizzle column + migration). Extend **the existing** `GET`/`POST /api/attempts/learn/:stageId` resource. Do not add a new URL family.

`GET /api/attempts/learn/1` when the column is null returns `200 { "stageOneIntro": true }` and writes **no** `attempt_tokens` row and **no** Score. After the column is set, GET is today’s `{ token, exercise, stage }` payload.

`POST /api/attempts/learn/1` with `{ "stageOneIntroSeen": true }` returns `204`, sets the timestamp if it was null (idempotent; first write wins), and writes no Score and no token. The same POST to any other Stage is `404`. `{ token, events }` POST remains the submit path.

Stages 2–21, Speed Test, Practice, and Finger stretch are unchanged.

Child-facing copy is **not** in this ticket. The Stage route still loads an Attempt on current main; wiring the card is ticket 12. This ticket is the contract 12 will call.

Update existing Stage 1 acceptance helpers so they acknowledge (or otherwise satisfy the column) before expecting a token. New tests assert the unseen and acknowledged paths, including transfer: the column survives redeem because it lives on `players`.

## Acceptance criteria

These fail on current main: first `GET /api/attempts/learn/1` today always returns a `token` and inserts `attempt_tokens`. `players` has no `stage_one_intro_seen_at`.

- [ ] `players` has nullable `stage_one_intro_seen_at`; a fresh Player has `NULL`.
- [ ] First `GET /api/attempts/learn/1` for that Player returns `200` with `{ "stageOneIntro": true }`, no `token`, and `attempt_tokens` for that Player is empty.
- [ ] That GET writes no `scores` row.
- [ ] `POST /api/attempts/learn/1` `{ "stageOneIntroSeen": true }` returns `204`, sets `stage_one_intro_seen_at`, writes no Score and no `attempt_tokens` row.
- [ ] A second such POST returns `204` and does not change the timestamp.
- [ ] After acknowledge, `GET /api/attempts/learn/1` returns today’s token payload and inserts one handshake row.
- [ ] Intro is Stage 1 only: a Player who has Stage 2 open gets a token from `GET /api/attempts/learn/2`, never `{ "stageOneIntro": true }`.
- [ ] `POST` `{ "stageOneIntroSeen": true }` to Stage 2 is `404` and writes nothing.
- [ ] Speed Test, Practice, and Finger stretch GET/POST contracts are unchanged.
- [ ] Transfer: acknowledge on Player A, redeem A onto another identity cookie, `GET /api/attempts/learn/1` returns a token not the intro.
- [ ] A second Player on the same device who has not acknowledged still receives `{ "stageOneIntro": true }`.
- [ ] Existing Learn Stage 1 acceptance tests still pass, via an acknowledge step before they expect a token.
- [ ] No test reaches past HTTP into an internal function, except as already allowed elsewhere in the suite.
