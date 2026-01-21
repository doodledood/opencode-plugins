# opencode-vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Installation

```bash
./install.sh vibe-experimental
```

## Commands

- `/define-vibe-experimental`
- `/do-vibe-experimental`

## Agents

- `claude-md-adherence-reviewer-vibe-experimental`
- `code-bugs-reviewer-vibe-experimental`
- `code-coverage-reviewer-vibe-experimental`
- `code-maintainability-reviewer-vibe-experimental`
- `code-simplicity-reviewer-vibe-experimental`
- `code-testability-reviewer-vibe-experimental`
- `criteria-checker-vibe-experimental`
- `docs-reviewer-vibe-experimental`
- `type-safety-reviewer-vibe-experimental`

## Skills (Non-User-Invocable)

These are loaded by the model via `skill({ name: "..." })` tool, not user-invocable.

- `done-vibe-experimental`
- `escalate-vibe-experimental`
- `verify-vibe-experimental`

## License

MIT
