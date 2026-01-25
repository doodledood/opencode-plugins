# vibe-workflow

Ship high-quality code faster with less back-and-forth.

## Installation

```bash
./install.sh vibe-workflow
```

## Commands

| Command | Description |
|---------|-------------|
| `/bugfix` | Debug and fix bugs with autonomous investigation |
| `/explore-codebase` | Find relevant files with structural overview and prioritized reading list |
| `/fix-review-issues` | Address code review feedback systematically |
| `/implement` | Implement features from a plan with chunk-based execution |
| `/implement-inplace` | Implement features in-place without separate plan file |
| `/plan` | Create detailed implementation plans with verification |
| `/research-web` | Deep web research with parallel investigation and synthesis |
| `/review` | Run comprehensive code review across multiple dimensions |
| `/review-agents-md-adherence` | Review code for AGENTS.md guideline adherence |
| `/review-bugs` | Review code for potential bugs |
| `/review-coverage` | Review test coverage |
| `/review-docs` | Review documentation quality |
| `/review-maintainability` | Review code maintainability |
| `/review-simplicity` | Review code simplicity |
| `/review-testability` | Review code testability |
| `/review-type-safety` | Review type safety |
| `/spec` | Create technical specifications |
| `/web-research` | Alias for /research-web |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Reviews code for AGENTS.md compliance |
| `bug-fixer` | Expert bug investigator and fixer |
| `chunk-implementor` | Implements plan chunks autonomously |
| `chunk-verifier` | Verifies implementation chunk completion |
| `code-bugs-reviewer` | Reviews code for potential bugs |
| `code-coverage-reviewer` | Reviews test coverage |
| `code-maintainability-reviewer` | Reviews code maintainability |
| `code-simplicity-reviewer` | Reviews code simplicity |
| `code-testability-reviewer` | Reviews code testability |
| `codebase-explorer` | Explores codebase to find relevant files |
| `docs-reviewer` | Reviews documentation quality |
| `plan-verifier` | Verifies implementation plans |
| `type-safety-reviewer` | Reviews type safety |
| `web-researcher` | Deep web research specialist |

## Hooks

This plugin includes TypeScript hooks for:
- Session start reminders (prefer vibe-workflow agents over built-in)
- Session compaction recovery (implement workflow state preservation)
- Tool execution logging (task completion tracking)

Note: Stop blocking (preventing premature stops during implement workflows) is not supported in OpenCode.
