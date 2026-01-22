# vibe-workflow

Ship high-quality code faster with less back-and-forth.

## Installation

```bash
./install.sh vibe-workflow
```

## Commands

| Command | Description |
|---------|-------------|
| `/bugfix` | Debug and fix bugs systematically |
| `/explore-codebase` | Find relevant files for a task |
| `/fix-review-issues` | Fix issues found by /review |
| `/implement-inplace` | Single-agent implementation without subagents |
| `/implement` | Execute implementation plans via subagents |
| `/plan` | Create implementation plans from specs |
| `/research-web` | Deep web research with parallel investigators |
| `/review-agents-md-adherence` | Verify code follows AGENTS.md rules |
| `/review-bugs` | Audit code for logical bugs |
| `/review-coverage` | Verify test coverage for changes |
| `/review-docs` | Audit documentation accuracy |
| `/review-maintainability` | Audit code for DRY, dead code, complexity |
| `/review-simplicity` | Audit for over-engineering |
| `/review-testability` | Audit code for testability issues |
| `/review-type-safety` | Audit TypeScript for type safety |
| `/review` | Run all review agents in parallel |
| `/spec` | Requirements discovery through interview |
| `/web-research` | Research topics via web search |

## Agents

| Agent | Description |
|-------|-------------|
| `agents-md-adherence-reviewer` | Verifies AGENTS.md compliance |
| `bug-fixer` | Investigates and fixes bugs |
| `chunk-implementor` | Implements plan chunks |
| `chunk-verifier` | Verifies chunk implementations |
| `code-bugs-reviewer` | Audits for logical bugs |
| `code-coverage-reviewer` | Verifies test coverage |
| `code-maintainability-reviewer` | Audits maintainability |
| `code-simplicity-reviewer` | Audits for over-engineering |
| `code-testability-reviewer` | Audits testability |
| `codebase-explorer` | Explores codebase structure |
| `docs-reviewer` | Reviews documentation |
| `plan-verifier` | Verifies implementation plans |
| `type-safety-reviewer` | Audits type safety |
| `web-researcher` | Researches topics via web |

## Hooks

This plugin includes TypeScript hooks for:
- **Session start**: Injects reminders about explore-codebase and research-web
- **Session compacting**: Re-injects context after compaction
- **Post tool use**: Reminds to update log files after todo completion
- **Session idle**: Logs when session stops (cannot block in OpenCode)

## License

MIT
