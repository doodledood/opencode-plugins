# OpenCode Vibe Workflow

Ship high-quality code faster with less back-and-forth.

Converted from [claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Command (18)

| Command | Description |
|---------|-------------|
| `/review` | Run all code review agents in parallel |
| `/plan` | Create implementation plans from spec |
| `/implement` | Execute plans via subagents with verification |
| `/implement-inplace` | Single-agent implementation without subagents |
| `/spec` | Requirements discovery through structured interview |
| `/bugfix` | Investigate and fix bugs systematically |
| `/explore-codebase` | Find all files relevant to a query |
| `/research-web` | Deep web research with parallel investigators |
| `/web-research` | Research external topics via web search |
| `/fix-review-issues` | Fix issues found by /review |
| `/review-bugs` | Audit code for logical bugs |
| `/review-coverage` | Verify test coverage for code changes |
| `/review-maintainability` | Audit for DRY violations, dead code, coupling |
| `/review-simplicity` | Audit for over-engineering and complexity |
| `/review-testability` | Audit for testability design patterns |
| `/review-type-safety` | Audit TypeScript for type safety issues |
| `/review-docs` | Audit documentation accuracy |
| `/review-claude-md-adherence` | Verify CLAUDE.md compliance |

## Agent (14)

| Agent | Description |
|-------|-------------|
| `bug-fixer` | Investigate and fix bugs with root cause analysis |
| `chunk-implementor` | Implement plan chunks |
| `chunk-verifier` | Verify chunk implementations |
| `codebase-explorer` | Explore codebases for relevant files |
| `web-researcher` | Research topics via web search |
| `plan-verifier` | Verify implementation plans |
| `code-bugs-reviewer` | Review for logical bugs |
| `code-coverage-reviewer` | Review test coverage |
| `code-maintainability-reviewer` | Review for maintainability issues |
| `code-simplicity-reviewer` | Review for over-engineering |
| `code-testability-reviewer` | Review for testability issues |
| `type-safety-reviewer` | Review for type safety issues |
| `docs-reviewer` | Review documentation accuracy |
| `claude-md-adherence-reviewer` | Review CLAUDE.md compliance |

## License

MIT
