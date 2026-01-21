# Vibe Workflow

Ship high-quality code faster with less back-and-forth.

## Commands

- `/bugfix` - Fix bugs with structured analysis
- `/explore-codebase` - Explore and understand the codebase
- `/fix-review-issues` - Fix issues from code review
- `/implement` - Implement a feature with planning
- `/implement-inplace` - Implement changes in-place
- `/plan` - Create an implementation plan
- `/research-web` - Research topic on the web
- `/review` - Run comprehensive code review
- `/review-bugs` - Review code for bugs
- `/review-claude-md-adherence` - Review CLAUDE.md adherence
- `/review-coverage` - Review test coverage
- `/review-docs` - Review documentation
- `/review-maintainability` - Review code maintainability
- `/review-simplicity` - Review code simplicity
- `/review-testability` - Review code testability
- `/review-type-safety` - Review type safety
- `/spec` - Create a specification document
- `/web-research` - Research topic on the web

## Agents

- `bug-fixer` - Fix bugs
- `chunk-implementor` - Implement code chunks
- `chunk-verifier` - Verify code chunks
- `claude-md-adherence-reviewer` - Review CLAUDE.md adherence
- `code-bugs-reviewer` - Review code for bugs
- `code-coverage-reviewer` - Review test coverage
- `code-maintainability-reviewer` - Review code maintainability
- `code-simplicity-reviewer` - Review code simplicity
- `code-testability-reviewer` - Review code testability
- `codebase-explorer` - Explore the codebase
- `docs-reviewer` - Review documentation
- `plan-verifier` - Verify implementation plans
- `type-safety-reviewer` - Review type safety
- `web-researcher` - Research on the web

## Installation

```bash
./install.sh vibe-workflow
```

## Note

This plugin has hooks that require manual TypeScript conversion. The original Python hooks handle:
- SessionStart hook: Inject session-start reminders
- PostCompact hook: Re-anchor session after compaction
- Stop hook: Prevent premature stops during /implement workflows
- PostToolUse (TodoWrite): Remind to update progress files
