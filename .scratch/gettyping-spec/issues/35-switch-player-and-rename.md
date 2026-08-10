# 35 — Switching Player and editing a Nickname

Type: task
Blocked by: 21
Status: ready-for-agent

## What to build

The two things a shared device and a five-year-old's naming judgement both need.

Families have more than one child, and identity is a cookie on a browser — so without this, two siblings on one tablet are the same Player: shared Stage progress, shared board entries, and one Weak-key Profile blending two different people. That last is not cosmetic. A blended Profile targets keys that are weak for *neither* sibling, so the app's central mechanic quietly stops working for exactly the households Learn was built for.

The home screen gets a **"Not you?" affordance** that either switches to another Player already on this device or runs the Nickname step to mint a new one. The cookie already holds a list, so nothing changes but which one is active. Full profile management — removal, avatars, a picker on every load — is scope creep into the account system this app has deliberately refused to build.

A **Nickname can also be changed later**, because a name picked at five should not be permanent. **Existing Scores keep the Nickname they were set under**: a Leaderboard is a record of what happened, not a rewrite.

## Acceptance criteria

- [ ] "Not you?" on the home screen switches to another Player on this device without losing either one.
- [ ] It can also mint a new Player through the Nickname step.
- [ ] Two Players on one cookie keep separate Stage progression and separate Weak-key Profiles.
- [ ] A Player can change their Nickname.
- [ ] Scores set before a rename still show the old Nickname on boards and in history.
- [ ] Scores set after it show the new one.
- [ ] A free-text rename goes through the same submit-time profanity check; picking from the curated cards does not.
