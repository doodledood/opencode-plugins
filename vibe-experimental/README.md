# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Manifest builder with verification criteria. Converts known requirements into Deliverables + Invariants. |
| `/do` | Manifest executor. Iterates through Deliverables satisfying Acceptance Criteria, then verifies all pass. |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verifies code changes comply with AGENTS.md instructions and project standards |
| `code-bugs-reviewer` | Audits code changes for logical bugs |
| `code-coverage-reviewer` | Verifies test coverage for code changes |
| `code-maintainability-reviewer` | Audits code for DRY violations, dead code, complexity, and consistency |
| `code-simplicity-reviewer` | Audits code for over-engineering and cognitive complexity |
| `code-testability-reviewer` | Audits code for testability issues |
| `criteria-checker` | Read-only verification agent for single criterion checks |
| `docs-reviewer` | Audits documentation accuracy against code changes |
| `manifest-verifier` | Reviews /define manifests for gaps and outputs actionable continuation steps |
| `type-safety-reviewer` | Audits TypeScript code for type safety issues |

## Skills (non-user-invocable)

| Skill | Description |
|-------|-------------|
| `verify` | Manifest verification runner. Called by /do, not directly by users. |
| `done` | Signals successful completion of /do workflow. |
| `escalate` | Escalates to user when genuinely stuck during /do workflow. |

## Hooks

The plugin includes TypeScript hooks for workflow observability. Note that some Claude Code hook behaviors cannot be fully replicated in OpenCode:

- **Stop blocking**: Original Python hook blocked stopping until /done or /escalate was called. OpenCode cannot block session stopping, so this relies on prompt discipline.
- **PreToolUse blocking**: Original Python hook blocked /escalate without prior /verify. OpenCode cannot block tool execution, so this relies on prompt discipline.

## Installation

```bash
./install.sh vibe-experimental
```
