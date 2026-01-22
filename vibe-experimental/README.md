# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow).

## Installation

```bash
./install.sh vibe-experimental
```

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Define deliverables and invariants for a task |
| `/do` | Execute the defined manifest autonomously |

## Skills (Internal)

These skills are called programmatically by `/do`, not directly by users:

| Skill | Description |
|-------|-------------|
| `verify` | Check acceptance criteria for deliverables |
| `done` | Mark workflow as complete after verification |
| `escalate` | Escalate when genuinely stuck (requires /verify first) |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verifies AGENTS.md compliance |
| `code-bugs-reviewer` | Audits for logical bugs |
| `code-coverage-reviewer` | Verifies test coverage |
| `code-maintainability-reviewer` | Audits maintainability |
| `code-simplicity-reviewer` | Audits for over-engineering |
| `code-testability-reviewer` | Audits testability |
| `criteria-checker` | Checks acceptance criteria |
| `docs-reviewer` | Reviews documentation |
| `type-safety-reviewer` | Audits type safety |

## Hooks

This plugin includes TypeScript hooks for:
- **Pre tool use**: Gates `/escalate` calls - requires `/verify` first
- **Session idle**: Logs incomplete workflows (cannot block in OpenCode)

### Workflow Enforcement

The hooks enforce the `/do` workflow:
1. `/do` starts an execution workflow
2. Work must be verified via `/verify` before completion
3. `/escalate` is only allowed after `/verify` has been called
4. `/done` marks successful completion

**Note**: In OpenCode, the Stop hook cannot block session termination. The Python version blocks premature stops, but OpenCode can only log warnings.

## License

MIT
