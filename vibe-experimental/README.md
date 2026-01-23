# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow).

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Build comprehensive manifest with deliverables and invariants |
| `/do` | Execute manifest-driven workflow with verification |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verify code changes comply with AGENTS.md |
| `code-bugs-reviewer` | Audit code for logical bugs |
| `code-coverage-reviewer` | Verify test coverage for changes |
| `code-maintainability-reviewer` | Audit code organization and DRY |
| `code-simplicity-reviewer` | Check for over-engineering |
| `code-testability-reviewer` | Audit code for testability issues |
| `criteria-checker` | Verify single acceptance criterion |
| `docs-reviewer` | Audit documentation accuracy |
| `manifest-verifier` | Review manifests for gaps |
| `type-safety-reviewer` | Audit TypeScript type safety |

## Skills (Non-User-Invocable)

| Skill | Description |
|-------|-------------|
| `done` | Mark /do workflow complete |
| `escalate` | Escalate from /do workflow |
| `verify` | Verify manifest acceptance criteria |

## Installation

```bash
./install.sh vibe-experimental
```
