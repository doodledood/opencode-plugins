# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Installation

```bash
./install.sh vibe-experimental
```

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Define deliverables and invariants |
| `/do` | Execute manifest-driven workflow |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verify AGENTS.md compliance |
| `code-bugs-reviewer` | Audit code for bugs |
| `code-coverage-reviewer` | Verify test coverage |
| `code-maintainability-reviewer` | Audit maintainability |
| `code-simplicity-reviewer` | Audit for over-engineering |
| `code-testability-reviewer` | Audit testability |
| `criteria-checker` | Check acceptance criteria |
| `docs-reviewer` | Audit documentation |
| `type-safety-reviewer` | Audit type safety |

## Skills (non-user-invocable)

| Skill | Description |
|-------|-------------|
| `done` | Signal completion (called by /verify) |
| `escalate` | Escalate when stuck |
| `verify` | Verify acceptance criteria |

## Hooks

This plugin includes hooks for workflow enforcement (logging only - blocking not supported in OpenCode).

## License

MIT
