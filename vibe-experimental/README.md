# OpenCode Vibe Experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow).

Converted from [claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Installation

```bash
# Clone this repo and add to your OpenCode config
```

## Commands (2)

| Command | Description |
|---------|-------------|
| `/define` | Define deliverables and invariants in a manifest |
| `/do` | Execute a manifest - satisfy all deliverables |

## Skills (3, non-user-invocable)

These skills are called by `/do`, not directly by users:

| Skill | Description |
|-------|-------------|
| `verify` | Manifest verification runner |
| `done` | Mark manifest execution complete |
| `escalate` | Escalate to human review |

## Agents (9)

| Agent | Description |
|-------|-------------|
| `criteria-checker` | Check acceptance criteria |
| `code-bugs-reviewer` | Review for logical bugs |
| `code-coverage-reviewer` | Review test coverage |
| `code-maintainability-reviewer` | Review for maintainability |
| `code-simplicity-reviewer` | Review for over-engineering |
| `code-testability-reviewer` | Review for testability |
| `type-safety-reviewer` | Review for type safety |
| `docs-reviewer` | Review documentation |
| `claude-md-adherence-reviewer` | Review CLAUDE.md compliance |

## Hooks Status

See [HOOKS_TODO.md](./HOOKS_TODO.md) for conversion status.

| Hook | Status |
|------|--------|
| stop-do-hook | **Cannot convert** (blocking not supported) |
| pretool-escalate-hook | Partial (cannot block tool execution) |

## License

MIT
