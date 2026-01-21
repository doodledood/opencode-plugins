# Claude Code to OpenCode Plugin Conversion Guide

This guide documents how to convert Claude Code plugins to OpenCode format.

## Directory Structure Mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `.claude-plugin/plugin.json` | `package.json` | npm package manifest |
| `skills/<name>/SKILL.md` | `commands/<name>.md` | Slash commands |
| `agents/<name>.md` | `agents/<name>.md` | Subagents |
| `hooks/*.py` | `plugins/<name>.ts` | Event hooks (Python → TypeScript) |

## Feature Parity

| Feature | Claude Code | OpenCode | Parity |
|---------|-------------|----------|--------|
| Slash commands | Skills (SKILL.md) | Commands (.md) | Full |
| Agents/subagents | agents/*.md | agents/*.md | Full |
| Event hooks | Python hooks | TypeScript plugins | Partial |
| MCP servers | .mcp.json | opencode.json mcp section | Full |
| Custom tools | N/A (via MCP) | tools/*.ts | OpenCode has more |

## Converting Skills → Commands

### Claude Code Skill Format

```markdown
# skills/review/SKILL.md
---
name: review
description: Run all code review agents in parallel
---

Your prompt content here...

$ARGUMENTS  # User arguments
```

### OpenCode Command Format

```markdown
# commands/review.md
---
description: Run all code review agents in parallel
agent: build
model: anthropic/claude-sonnet-4-20250514
---

Your prompt content here...

$ARGUMENTS  # User arguments (same!)
```

### Key Differences

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `name:` | (filename) | OpenCode uses filename as command name |
| `description:` | `description:` | Same |
| N/A | `agent:` | Which agent executes (build, plan, custom) |
| N/A | `model:` | Model override (optional) |
| `$ARGUMENTS` | `$ARGUMENTS` | Same placeholder |
| `Skill("plugin:skill")` | `/command-name` | Invoke other commands |

### Conversion Rules

1. Remove `name:` from frontmatter (filename = command name)
2. Keep `description:` as-is
3. Add `agent: build` (or appropriate agent)
4. Add `model:` if skill specified one
5. Replace `Skill("plugin:skill-name")` → `/skill-name`
6. Replace `Task` tool references with OpenCode equivalents

## Converting Agents

### Claude Code Agent Format

```markdown
# agents/bug-fixer.md
---
name: bug-fixer
description: Expert bug investigator...
tools: Bash, Glob, Grep, Read, Edit, Write, WebFetch, TodoWrite
model: opus
---

System prompt content...
```

### OpenCode Agent Format

```markdown
# agents/bug-fixer.md
---
description: Expert bug investigator...
mode: subagent
model: anthropic/claude-opus-4-20250514
temperature: 0.3
tools:
  read: allow
  edit: allow
  bash: allow
  write: allow
---

System prompt content...
```

### Key Differences

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `name:` | (filename) | OpenCode uses filename |
| `description:` | `description:` | Same |
| `tools: Bash, Read, ...` | `tools:` object | Different format |
| `model: opus` | `model: anthropic/claude-opus-4-...` | Full model ID |
| N/A | `mode: subagent` | Required for subagents |
| N/A | `temperature:` | Optional |

### Tool Mapping

| Claude Code Tool | OpenCode Permission |
|------------------|---------------------|
| `Bash` | `bash: allow` |
| `Read` | `read: allow` |
| `Edit` | `edit: allow` |
| `Write` | `write: allow` (same as edit) |
| `Glob` | (built-in, no permission needed) |
| `Grep` | (built-in, no permission needed) |
| `WebFetch` | `webfetch: allow` |
| `WebSearch` | `websearch: allow` |
| `TodoWrite` | (built-in, no permission needed) |
| `Task` | `task: allow` (for subagents) |

## Converting Hooks (Partial Support)

Claude Code hooks are Python-based; OpenCode hooks are TypeScript.

### Claude Code Hook (plugin.json)

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks session-start-hook"
      }]
    }],
    "PostToolUse": [{
      "matcher": "TodoWrite",
      "hooks": [{ "type": "command", "command": "..." }]
    }]
  }
}
```

### OpenCode Plugin Hook

```typescript
// plugins/my-plugin.ts
export const MyPlugin = async ({ project, client }) => {
  return {
    "session.created": async (event) => {
      // SessionStart equivalent
    },
    "tool.execute.after": async (event) => {
      // PostToolUse equivalent
      if (event.tool === "todo") {
        // Handle todo write
      }
    },
  }
}
```

### Hook Event Mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `SessionStart` | `session.created` | Same purpose |
| `PreToolUse` | `tool.execute.before` | Same purpose |
| `PostToolUse` | `tool.execute.after` | Same purpose |
| `Stop` | `session.idle` | Partial - different semantics |
| `PreCompact` | `session.compacted` | Similar |

### What's NOT Convertible

- **Stop hooks with blocking**: Claude Code can block stop; OpenCode cannot
- **Matcher patterns**: Need to implement matching logic in TypeScript
- **Python dependencies**: Must rewrite in TypeScript/JavaScript

## Model Name Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `opus` | `anthropic/claude-opus-4-5-20251101` |
| `sonnet` | `anthropic/claude-sonnet-4-20250514` |
| `haiku` | `anthropic/claude-haiku-3-5-20241022` |

## Placeholder Reference

| Placeholder | Both Support | Notes |
|-------------|--------------|-------|
| `$ARGUMENTS` | Yes | All user arguments |
| `$1`, `$2`, `$3` | OpenCode only | Positional args |
| `` !`cmd` `` | OpenCode only | Bash output injection |
| `@filename` | OpenCode only | File content injection |

## Invoking Other Commands/Skills

### Claude Code

```markdown
Use the Skill tool: Skill("vibe-workflow:review-bugs")
```

### OpenCode

```markdown
Run the /review-bugs command
```

Or in commands, reference directly: `/review-bugs $ARGUMENTS`

## Example Full Conversion

### Before (Claude Code skill)

```markdown
# skills/bugfix/SKILL.md
---
name: bugfix
description: Investigate and fix bugs systematically
---

Use the bug-fixer agent via Task tool.

Skill("vibe-workflow:explore-codebase", "$ARGUMENTS")

Then fix the bug.
```

### After (OpenCode command)

```markdown
# commands/bugfix.md
---
description: Investigate and fix bugs systematically
agent: bug-fixer
---

Explore the codebase for: $ARGUMENTS

Then fix the bug.
```

## Plugin Package Structure

### OpenCode npm Plugin

```
my-opencode-plugin/
├── package.json
├── commands/
│   ├── review.md
│   └── bugfix.md
├── agents/
│   ├── bug-fixer.md
│   └── code-reviewer.md
└── plugins/
    └── hooks.ts  (optional)
```

### package.json

```json
{
  "name": "opencode-vibe-workflow",
  "version": "1.0.0",
  "description": "Vibe workflow for OpenCode",
  "opencode": {
    "commands": "./commands",
    "agents": "./agents",
    "plugins": "./plugins"
  }
}
```

## Limitations

1. **Hooks are partial**: Complex Python hooks need TypeScript rewrite
2. **No stop blocking**: Can't prevent agent from stopping like Claude Code
3. **Different Task tool**: OpenCode uses different subagent invocation
4. **Model routing**: Claude Code auto-routes to Haiku; OpenCode doesn't

## Migration Checklist

- [ ] Convert `plugin.json` → `package.json`
- [ ] Move `skills/*/SKILL.md` → `commands/*.md`
- [ ] Update skill frontmatter (remove name, add agent/model)
- [ ] Move `agents/*.md` → `agents/*.md`
- [ ] Update agent frontmatter (add mode, convert tools)
- [ ] Convert tool names in prompts
- [ ] Replace `Skill()` calls with `/command` references
- [ ] Update model names to full IDs
- [ ] Rewrite hooks in TypeScript (if needed)
- [ ] Test all commands and agents
