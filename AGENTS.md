<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Agent skills

### Issue tracker

Issues live in Linear — team `Hackyeah2026` (key `HAC`), project `HubMI` — via Linear MCP tools. See `docs/agents/issue-tracker.md`.

### Triage labels

Labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`; wontfix → `Canceled` status. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Voice input

Dictation (S-04) is built; screens consume `useVoiceQuery` rather than touching the
Web Speech API. See `.claude/skills/voice-input/SKILL.md`.

## Accessibility audit

Every change that touches UI (resident app, kiosk, Panel administratora) is done only after a WCAG 2.1 AA audit of the changed screens, run in the browser before opening the PR. The audit covers:

- the whole flow works by keyboard alone, with a visible focus ring;
- every control has an accessible name, and every input has a visible label;
- text and controls meet AA contrast;
- async feedback is announced (`role="status"` for progress, `role="alert"` for errors);
- the screen works at 320 px wide with no horizontal scroll, and at 200% zoom.

List each point with its result in the PR description, and fix every failure before asking for a merge.
