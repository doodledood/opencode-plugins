# vibe-experimental

Manifest-driven workflows separating Deliverables (what to build) from Invariants (rules to follow). Two-level verification: Global Invariants (task-level rules) and Acceptance Criteria (per-deliverable).

## Installation

```bash
./install.sh vibe-experimental
```

## Commands

| Command | Description |
|---------|-------------|
| `/define` | Define a manifest with deliverables and acceptance criteria |
| `/do` | Execute a manifest-driven workflow autonomously |

## Task Types

The `/define` command supports domain-specific guidance for different deliverable types:

| Type | Guidance File | Use Cases |
|------|---------------|-----------|
| **Code** | `tasks/CODING.md` | Features, APIs, fixes, refactors, tests |
| **Document** | `tasks/DOCUMENT.md` | Specs, proposals, reports, formal docs |
| **Research** | `tasks/RESEARCH.md` | Investigations, analyses, comparisons, competitive reviews |
| **Blog** | `tasks/BLOG.md` | Blog posts, articles, tutorials, newsletters |

## Skills (Non-User-Invocable)

These skills are called programmatically by `/do`, not directly by users:

| Skill | Description |
|-------|-------------|
| `done` | Mark workflow as complete after verification passes |
| `escalate` | Escalate when genuinely stuck (requires /verify first) |
| `verify` | Verify acceptance criteria against deliverables |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Reviews code for AGENTS.md compliance |
| `code-bugs-reviewer` | Reviews code for potential bugs |
| `code-coverage-reviewer` | Reviews test coverage |
| `code-maintainability-reviewer` | Reviews code maintainability |
| `code-simplicity-reviewer` | Reviews code simplicity |
| `code-testability-reviewer` | Reviews code testability |
| `criteria-checker` | Checks acceptance criteria |
| `docs-reviewer` | Reviews documentation quality |
| `manifest-verifier` | Verifies manifest structure and completeness |
| `type-safety-reviewer` | Reviews type safety |

## Hooks

This plugin includes TypeScript hooks for:
- Tool execution logging (escalate skill warnings)
- Session lifecycle events

Note: Stop blocking and PreToolUse blocking are not supported in OpenCode. The original behavior of requiring `/verify` before `/escalate` is converted to logging warnings only.
