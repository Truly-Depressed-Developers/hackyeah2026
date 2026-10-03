# Issue tracker: Linear

Issues and specs for this repo live in Linear. Use the Linear MCP tools (`mcp__claude_ai_Linear__*`) for all operations — never `gh issue`.

- **Workspace team**: `Hackyeah2026` (key `HAC`, id `aa77a7c4-8b8e-41e7-a0a0-89dbbcd8495f`)
- **Project**: `HubMI` — https://linear.app/hackyeah2026/project/hubmi-08a1e28cc258
- **Statuses**: Backlog → Todo → In Progress → Done; also Canceled, Duplicate
- **Type labels** (existing): `Bug`, `Feature`, `Improvement`

## Conventions

- **Create an issue**: `save_issue` with `team: "Hackyeah2026"`, `project: "HubMI"`, title, markdown description (real newlines, no `\n` escapes). New issues start in `Backlog` with `needs-triage`.
- **Read an issue**: `get_issue` with the identifier (e.g. `HAC-12`), then `list_comments` for discussion.
- **List issues**: `list_issues` with `team: "Hackyeah2026"`, filter by `label`, `state`, `project`, `assignee`.
- **Comment**: `save_comment` with the issue id and markdown body.
- **Apply / remove labels**: `save_issue` with the full desired `labels` array (labels replace, not append — read current labels first).
- **Close**: set `state: "Done"` (completed) or `state: "Canceled"` (won't do), plus a `save_comment` explaining why.

Issue identifiers look like `HAC-<n>`. A bare `#42` in conversation means `HAC-42`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external GitHub PRs as feature requests; `/triage` reads this flag.)_

Code lives on GitHub (`Truly-Depressed-Developers/hackyeah2026`); PRs use `gh pr`. Link a PR to its issue by putting `HAC-<n>` in the PR title or branch name (Linear's GitHub integration auto-links).

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `Hackyeah2026`, project `HubMI`.

## When a skill says "fetch the relevant ticket"

`get_issue` with the `HAC-<n>` identifier, then `list_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a parent issue with **sub-issues** as tickets.

- **Map**: a Linear issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`save_issue` with `parentId` = map id). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, assigned to the driving dev.
- **Blocking**: Linear's native "blocked by" relation (`save_issue` relations). A ticket is unblocked when every blocker is in a completed/canceled state.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"` and `state: "In Progress"` — the session's first write.
- **Resolve**: `save_comment` with the answer, set `state: "Done"`, then append a context pointer (gist + link) to the map's Decisions-so-far.
