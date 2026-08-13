# 11 — Home secondary Practice action

Type: task
Blocked by: 10
Status: ready-for-agent

## What to build

Once [01](./01-eligibility-rule.md) holds, returning home offers Practice as a **secondary** action. Continue does not change. Practice is not a Stage.

[02-navigation-and-copy.md](./02-navigation-and-copy.md) and [04-practice-stays-on-speed-test-track.md](./04-practice-stays-on-speed-test-track.md): load eligibility in `src/routes/+page.server.ts` with the same Score rule as the API. In the existing `nav.home-secondary`, when eligible, render:

```html
<a href="/practice">Practise weak keys</a>
```

Hidden when ineligible, not disabled. Not inside `ol.stage-grid`. Present for Learn-only, Speed-Test-only, and dual-track eligible Players.

`TrackFrame` on `/practice` stays `data-track="speed-test-practice"`. First-run Track doors stay as they are.

## Acceptance criteria

These fail on current main unless noted as regression.

- [ ] A returning Learn Player with at least one Learn Score and a current Stage: home HTML contains `href="/practice"` and the text **Practise weak keys**. Continue still points at `/learn/stages/{currentId}`, not `/practice`. **Fails today: no `/practice` link.**
- [ ] That Practice link is not a descendant of the Stage list. **Fails today vacuously; assert once the link exists.**
- [ ] A returning Nickname-only Player with zero Scores: home HTML does not contain `href="/practice"`. Continue still points at Stage 1. **Passes today on the absence — keep.**
- [ ] A graduate (Stage 21 resolved, no special case): Continue still `href="/speed-test"`. The Practice link **is** present. **Fails today: no Practice link. Continue already points at Speed Test — keep that half.**
- [ ] A Speed-Test-only eligible Player (home loaded without `?track=speed-test-practice` is acceptable if Continue still does not become `/practice`): HTML contains `href="/practice"`. **Fails today: no link.**
- [ ] `GET /practice` HTML includes `data-track="speed-test-practice"` (Learn flex must not appear because the Player has a current Stage). **Passes today on the attribute — keep; do not switch the frame to `learn`.**
- [ ] Tests are HTTP against SvelteKit + migrated SQLite (fetch home HTML, assert hrefs). Do not drive the Continue door into `/practice`.

## Implementation note

Copy on Learn complete and the Practice summary Speed Test phrase are [12](./12-learn-player-copy.md). Do not add a Practice CTA to Learn complete in this ticket.
