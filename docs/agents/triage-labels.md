# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| --------------------------- | --------------------- | ----------------------------------------- |
| `needs-triage`               | `needs-triage`         | Maintainer needs to evaluate this issue   |
| `needs-info`                 | `needs-info`           | Waiting on reporter for more information  |
| `ready-for-agent`            | `ready-for-agent`      | Fully specified, ready for an AFK agent   |
| `ready-for-human`            | `ready-for-human`      | Requires human implementation             |
| `wontfix`                    | `wontfix`              | Will not be actioned                      |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Post-implementation states

The five roles above are pre-work triage only. Once a `task` ticket's acceptance criteria are verified against the codebase, its `Status:` line moves to one of:

- `done` — every acceptance criterion is checked and verified against the code/tests.
- `ready-for-human` — implementation is checked in, but one or more criteria require an action no coding session can perform (e.g. a real cloud deploy, a live restore) and are left unchecked until a human runs them.
