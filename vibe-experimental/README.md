# Vibe Experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Commands

- `/define` - Define a manifest with deliverables and invariants
- `/do` - Execute the defined manifest

## Agents

- `claude-md-adherence-reviewer` - Review CLAUDE.md adherence
- `code-bugs-reviewer` - Review code for bugs
- `code-coverage-reviewer` - Review test coverage
- `code-maintainability-reviewer` - Review code maintainability
- `code-simplicity-reviewer` - Review code simplicity
- `code-testability-reviewer` - Review code testability
- `criteria-checker` - Check acceptance criteria
- `docs-reviewer` - Review documentation
- `type-safety-reviewer` - Review type safety

## Skills (non-user-invocable)

- `done` - Signal task completion (called by /do)
- `escalate` - Escalate issues (called by /do)
- `verify` - Verify deliverables (called by /do)

## Installation

```bash
./install.sh vibe-experimental
```

## Note

This plugin has hooks that require manual TypeScript conversion. The original Python hooks handle:
- Stop hook: Prevent premature stops during /do workflow
- PreToolUse hook: Gate /escalate calls - require /verify before escalation
