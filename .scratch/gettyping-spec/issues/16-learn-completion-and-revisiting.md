# Design Learn-track completion and Stage revisiting

Type: grilling
Status: open

## Question

Every Learn flow specified so far moves in one direction: clear a Stage, unlock the next. Two things outside that forward march are undefined, and the first is load-bearing on the data model.

**Can a Player re-attempt a Stage they have already cleared?** [13-gate-failure-flow.md](./13-gate-failure-flow.md) settled retrying after a *failure*, but nothing covers returning to a cleared Stage. The Leaderboard design assumes they can: [09-db-schema.md](./09-db-schema.md)'s query picks each Player's **best** Score via `ROW_NUMBER() OVER (PARTITION BY player_id ...)`, which is meaningless if every Player has exactly one Score per Exercise. So the schema already implies repeat Attempts while no flow describes reaching them. If revisiting is in, the open decisions are: how a Player navigates to a cleared Stage (the home screen from [11-first-run-onboarding.md](./11-first-run-onboarding.md) currently shows only a single "continue" CTA — is there a Stage list?), whether a *worse* repeat Score is recorded or discarded, and whether re-clearing changes anything beyond a possible Leaderboard improvement.

**What happens when a Player clears Stage 21?** The Learn Track has no terminal state. [04-curriculum-outline.md](./04-curriculum-outline.md) fixes 21 Stages; nothing says what the twenty-first completion looks like, whether it differs from any other Stage clear, or what the home screen shows afterwards — its dominant "continue" CTA has nothing left to continue to, and its progress display reads "21 of 21" indefinitely.

[14-practice-loop.md](./14-practice-loop.md) sharpened this second question rather than answering it: the Speed Test is now a one-time prerequisite for Practice, so a Learn graduate who wants to keep typing has exactly one onward path — take the Speed Test, then practise. Whether the app surfaces that route at completion, mentions it once, or leaves the Player to find the other Track on their own is undecided. Related: whether a graduate's home screen re-purposes itself toward Speed Test & Practice, or keeps presenting Learn with everything cleared.

Both halves sit inside the destination's "user flows for both Tracks."
