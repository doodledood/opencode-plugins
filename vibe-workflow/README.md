# vibe-workflow

Ship high-quality code faster with less back-and-forth.

## Installation

```bash
./install.sh vibe-workflow
```

## Commands

| Command | Description |
|---------|-------------|
| `/bugfix` | Investigate and fix bugs systematically |
| `/explore-codebase` | Find relevant files for a query |
| `/fix-review-issues` | Fix issues found by /review |
| `/implement` | Execute implementation plans via subagents |
| `/implement-inplace` | Single-agent implementation |
| `/plan` | Create implementation plans |
| `/research-web` | Deep web research with parallel investigators |
| `/review` | Run all code review agents in parallel |
| `/review-agents-md-adherence` | Verify AGENTS.md compliance |
| `/review-bugs` | Audit code for bugs |
| `/review-coverage` | Verify test coverage |
| `/review-docs` | Audit documentation |
| `/review-maintainability` | Audit maintainability |
| `/review-simplicity` | Audit for over-engineering |
| `/review-testability` | Audit testability |
| `/review-type-safety` | Audit type safety |
| `/spec` | Requirements discovery through interview |
| `/web-research` | Web research with hypothesis tracking |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verify AGENTS.md compliance |
| `bug-fixer` | Investigate and fix bugs |
| `chunk-implementor` | Implement plan chunks |
| `chunk-verifier` | Verify chunk implementation |
| `code-bugs-reviewer` | Audit code for bugs |
| `code-coverage-reviewer` | Verify test coverage |
| `code-maintainability-reviewer` | Audit maintainability |
| `code-simplicity-reviewer` | Audit for over-engineering |
| `code-testability-reviewer` | Audit testability |
| `codebase-explorer` | Explore codebase structure |
| `docs-reviewer` | Audit documentation |
| `plan-verifier` | Verify implementation plans |
| `type-safety-reviewer` | Audit type safety |
| `web-researcher` | Web research agent |

## Hooks

This plugin includes hooks for:
- Session start reminders (explore-codebase, research-web preferences)
- Session compacting recovery (implement workflow state)
- Todo tracking (logging)

## License

MIT
