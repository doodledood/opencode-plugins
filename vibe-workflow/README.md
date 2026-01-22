# Vibe Workflow Plugin

Ship high-quality code faster with less back-and-forth.

## Commands

| Command | Description |
|---------|-------------|
| `/bugfix` | Investigate and fix bugs systematically |
| `/explore-codebase` | Find files relevant to a query |
| `/fix-review-issues` | Fix issues found by /review |
| `/implement` | Execute implementation plans via subagents |
| `/implement-inplace` | Single-agent implementation without subagents |
| `/plan` | Create implementation plans from spec |
| `/research-web` | Deep web research with parallel investigators |
| `/review` | Run all code review agents in parallel |
| `/review-agents-md-adherence` | Verify AGENTS.md compliance |
| `/review-bugs` | Audit code for logical bugs |
| `/review-coverage` | Verify test coverage for code changes |
| `/review-docs` | Audit documentation accuracy |
| `/review-maintainability` | Audit code maintainability |
| `/review-simplicity` | Audit code simplicity |
| `/review-testability` | Audit code testability |
| `/review-type-safety` | Audit type safety |
| `/spec` | Requirements discovery through interview |
| `/web-research` | Research external topics via web search |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verifies AGENTS.md compliance |
| `bug-fixer` | Investigates and fixes bugs |
| `chunk-implementor` | Implements a single plan chunk |
| `chunk-verifier` | Verifies chunk implementation |
| `code-bugs-reviewer` | Audits code for logical bugs |
| `code-coverage-reviewer` | Verifies test coverage |
| `code-maintainability-reviewer` | Audits code maintainability |
| `code-simplicity-reviewer` | Audits code simplicity |
| `code-testability-reviewer` | Audits code testability |
| `codebase-explorer` | Context-gathering for file discovery |
| `docs-reviewer` | Reviews documentation accuracy |
| `plan-verifier` | Verifies implementation plans |
| `type-safety-reviewer` | Audits type safety |
| `web-researcher` | Deep web research agent |

## Installation

```bash
./install.sh vibe-workflow
```
