# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Manifest builder with verification criteria. Converts known requirements into Deliverables + Invariants. |
| `/do` | Manifest executor. Iterates through Deliverables satisfying Acceptance Criteria, then verifies all pass. |

## Skills (Non-User-Invocable)

These skills are called programmatically by commands/agents, not directly by users:

| Skill | Description |
|-------|-------------|
| `verify` | Verification runner. Called by `/do` to check acceptance criteria. |
| `done` | Completion marker. Called by `/verify` when all criteria pass. |
| `escalate` | Escalation handler. Called when genuinely stuck after verification. |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Reviews AGENTS.md adherence |
| `code-bugs-reviewer` | Reviews code for bugs |
| `code-coverage-reviewer` | Reviews test coverage |
| `code-maintainability-reviewer` | Reviews code maintainability |
| `code-simplicity-reviewer` | Reviews code simplicity |
| `code-testability-reviewer` | Reviews code testability |
| `criteria-checker` | Checks acceptance criteria |
| `docs-reviewer` | Reviews documentation |
| `manifest-verifier` | Verifies manifests |
| `type-safety-reviewer` | Reviews type safety |

## Hooks

The plugin includes TypeScript hooks (`plugin/hooks.ts`) that:

- Track `/do` workflow state across skill invocations
- Gate `/escalate` calls - require `/verify` before escalation
- Inject workflow reminders into system prompt during active `/do` flows
- Preserve workflow state during session compaction

## Installation

```bash
./install.sh vibe-experimental
```

## Usage

1. **Define a manifest**: `/define <requirements>`
2. **Execute the manifest**: `/do`
3. The executor will automatically verify and complete or escalate as needed.
