# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to what this repo's Linear team (`Hackyeah2026`) actually uses.

| Label in mattpocock/skills | In our tracker          | Meaning                                  |
| -------------------------- | ----------------------- | ---------------------------------------- |
| `needs-triage`             | label `needs-triage`    | Maintainer needs to evaluate this issue  |
| `needs-info`               | label `needs-info`      | Waiting on reporter for more information |
| `ready-for-agent`          | label `ready-for-agent` | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | label `ready-for-human` | Requires human implementation            |
| `wontfix`                  | **status** `Canceled`   | Will not be actioned                     |

When a skill mentions a role, use the corresponding entry. `wontfix` is a workflow status, not a label: set `state: "Canceled"` and remove any triage labels.

The four triage labels are mutually exclusive — when applying one, remove the others. These labels may not exist in Linear yet; if one is missing, ask the human before creating it — never create labels or invent variants unprompted.
