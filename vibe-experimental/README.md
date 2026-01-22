# Vibe Experimental Plugin

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Define a manifest with deliverables and invariants |
| `/do` | Execute a manifest-driven workflow |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verifies AGENTS.md compliance |
| `code-bugs-reviewer` | Audits code for logical bugs |
| `code-coverage-reviewer` | Verifies test coverage |
| `code-maintainability-reviewer` | Audits code maintainability |
| `code-simplicity-reviewer` | Audits code simplicity |
| `code-testability-reviewer` | Audits code testability |
| `criteria-checker` | Runs automatable checks for criteria |
| `docs-reviewer` | Reviews documentation accuracy |
| `type-safety-reviewer` | Audits type safety |

## Skills (Internal)

| Skill | Description |
|-------|-------------|
| `done` | Called when task is complete |
| `escalate` | Escalate to human verification |
| `verify` | Manifest verification runner |

## Installation

```bash
./install.sh vibe-experimental
```
