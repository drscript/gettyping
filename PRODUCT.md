# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary Players are young beginners, including children aged 5 and older, learning to type at home or in a school or classroom setting. A secondary audience is people who already type and want to improve their speed and overall typing ability.

Parents and other grown-ups may support a child, understand how the product handles identity and progress, or help a Player move past a Stage where they are genuinely stuck.

## Product Purpose

GetTyping helps beginners learn to type progressively and helps existing typists improve through diagnostic testing and targeted practice.

Success means a Player's overall typing experience improves: typing becomes more capable, comfortable, fluent, and effective. WPM and accuracy provide useful feedback, but they are not the whole outcome.

## Positioning

GetTyping combines two distinct Tracks in one approachable typing tutor:

- Learn provides a gated, 21-Stage path that introduces typing step by step.
- Speed Test & Practice diagnoses a Player's performance, builds a per-key Weak-key Profile, and generates targeted Exercises from the keys that need the most work.

This combines structured beginner progression with practice that adapts to the individual Player instead of relying only on a fixed library of generic exercises.

## Operating Context

Players use GetTyping in a web browser at home or in school and choose the Track that matches what they want to improve. Beginners progress through the Learn Track one Stage at a time. Existing typists take a Speed Test and continue with targeted practice generated from their Weak-key Profile.

A Player completes Exercises through typing Attempts. Each completed Attempt produces a Score measured in WPM and accuracy. Progress and identity stay tied to the browser in which the Player was created.

## Capabilities and Constraints

- The two top-level Tracks are Learn and Speed Test & Practice.
- Learn contains 21 gated Stages. Clearing a Stage at its unlock threshold opens the next Stage, and cleared Stages remain available for replay.
- Speed Test & Practice uses a diagnostic Speed Test and a per-key Weak-key Profile to generate targeted Exercises.
- A Player is identified only by a public Nickname. GetTyping has no accounts, passwords, email addresses, or recovery flow.
- Progress is browser-local. Clearing browser data, changing browsers, or changing devices starts a new Player, and prior progress cannot be reclaimed.
- Nicknames are public on Leaderboards, pass profanity filtering, and should not be real names.
- Each Exercise has its own public top-10 Leaderboard; there is no global Leaderboard across Exercises, Stages, or Tracks.
- GetTyping stores no personal data beyond a Player's Nickname.
- The established domain terms in `CONTEXT.md` are authoritative: Track, Stage, Exercise, Speed Test, Attempt, Score, Player, Nickname, Leaderboard, and Weak-key Profile.
- Additional product capabilities and constraints remain open for later decisions; none are implied by this record.

## Brand Commitments

The product name is GetTyping. Player-facing language uses the established domain terminology and avoids framing Players as accounts or conventional authenticated users.

## Evidence on Hand

- `CONTEXT.md` records the product model and authoritative terminology.
- `docs/adr/0001-nickname-only-identity.md` records the decision to use Nickname-only identity without accounts.
- `docs/adr/0002-per-exercise-leaderboards.md` records the decision to scope Leaderboards per Exercise.
- `docs/adr/0003-adaptive-exercise-generation.md` records the decision to generate targeted practice from a Weak-key Profile.
- The application source includes both Tracks, the 21-Stage Learn path, browser-local Player flows, personal history, grown-up guidance, public Leaderboards, audio feedback, and targeted practice.
- Acceptance tests cover identity, progression, practice, history, audio, weak-key behavior, Scores, and Leaderboards.
- No testimonials, customer claims, case studies, press coverage, pricing, or performance benchmarks are present and future work must not fabricate them.

## Product Principles

1. Make learning approachable for young beginners without limiting usefulness for experienced typists.
2. Improve the whole typing experience; treat speed and accuracy as feedback rather than the sole definition of progress.
3. Give beginners a clear, manageable progression and give experienced typists practice that responds to their actual needs.
4. Minimize identity friction and personal-data collection while being candid about the limits of browser-local progress.
5. Keep competition meaningful and encouraging by comparing Scores only within the same Exercise.
