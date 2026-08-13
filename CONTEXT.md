# GetTyping

A web-based, SQLite-backed typing tutor that teaches beginners (including young children) to type stage by stage, and helps people who already type improve their speed through diagnostic testing and targeted practice.

## Language

**Track**:
One of the two top-level modes a Player operates in: **Learn** (gated, stage-by-stage, for beginners) or **Speed Test & Practice** (ungated, diagnostic + adaptive practice, for people who already type). Every Exercise belongs to exactly one Track.
_Avoid_: Mode, Section

**Stage**:
A single gated step within the Learn Track that teaches a specific set of keys. Clearing a Stage's Exercise(s) at its unlock threshold opens the next Stage in sequence.
_Avoid_: Level, Lesson, Unit

**Exercise**:
A single typing activity a Player can attempt, with its own Leaderboard. A Stage presents one or more Exercises; the Speed Test & Practice Track includes the Speed Test itself plus Exercises generated on demand from a Player's Weak-key Profile.
_Avoid_: Test (except when naming the Speed Test specifically), Drill, Challenge

**Finger stretch**:
Generated practice over the keys taught so far in a Stage, offered on the gate-failure screen to a stuck Player so they can warm up for another Attempt. Carries no Leaderboard and counts for nothing — it is not an Exercise and not a bypass; the gate and its retry stay untouched.
_Avoid_: Drill, Challenge, Warm-up drill

**Speed Test**:
The specific diagnostic Exercise in the Speed Test & Practice Track that measures a Player's current WPM and accuracy, used to seed their Weak-key Profile before any targeted practice is generated.
_Avoid_: Placement test, Assessment

**Attempt**:
One completed run through an Exercise by a Player, producing a Score.
_Avoid_: Try, Round, Session

**Score**:
The measured outcome of an Attempt: WPM and accuracy. A Player's best Score for a given Exercise is what competes on that Exercise's Leaderboard.
_Avoid_: Result, Points

**Player**:
The identity behind a Nickname. Not an account — a Player has no password and no stored personal data beyond their Nickname.
_Avoid_: User, Account

**Nickname**:
The public, chosen display name a Player enters before playing. It is the Player's only identity credential — there is no password. Must pass profanity filtering; the UI nudges Players away from entering real names.
_Avoid_: Username, Name, Handle

**Leaderboard**:
The top 10 best Scores for a single Exercise. Leaderboards are scoped per Exercise — there is no single global leaderboard spanning Tracks or Stages.
_Avoid_: Rankings, Scoreboard, High scores

**Weak-key Profile**:
A Player's per-key error-rate and speed statistics, derived from their Attempts. Drives which keys the Speed Test & Practice Track targets when generating new Exercises.
_Avoid_: Weakness data, Stats, Analytics

**Corpus**:
The authored set of `letters`/`sentences` entries from which Sentence-mode Exercises are drawn. Entries are raw material, not Exercises — they carry no id and are never referenced after generation.
_Avoid_: Drill, Word bank
