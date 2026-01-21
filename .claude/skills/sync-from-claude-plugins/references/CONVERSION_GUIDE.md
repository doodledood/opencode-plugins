# Claude Code → OpenCode Plugin Conversion Guide

The definitive guide for converting Claude Code plugins to OpenCode format.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Feature Parity](#feature-parity)
4. [Skill Classification](#skill-classification)
5. [Converting User-Invocable Skills → Commands](#converting-user-invocable-skills--commands)
6. [Converting Non-User-Invocable Skills → Skills](#converting-non-user-invocable-skills--skills)
7. [Converting Agents](#converting-agents)
8. [Converting Hooks](#converting-hooks)
9. [Prompt Content Transformations](#prompt-content-transformations)
10. [Model Mapping](#model-mapping)
11. [Plugin Manifest Conversion](#plugin-manifest-conversion)
12. [Known Plugins Classification](#known-plugins-classification)
13. [Edge Cases & Limitations](#edge-cases--limitations)
14. [Migration Checklist](#migration-checklist)

---

## Overview

Claude Code and OpenCode share similar concepts but with different implementations:

| Concept | Claude Code | OpenCode |
|---------|-------------|----------|
| User commands | Skills (user-invocable) | Commands |
| Internal skills | Skills (non-user-invocable) | Skills |
| Subagents | Agents | Agents |
| Event hooks | Python hooks | TypeScript plugins |
| External tools | MCP servers | MCP servers + custom tools |

---

## Directory Structure

### Claude Code Plugin Layout

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skill/
│   ├── review/
│   │   └── SKILL.md         # User-invocable skill
│   └── chunk-impl/
│       └── SKILL.md         # Non-user-invocable skill
├── agent/
│   └── bug-fixer.md         # Subagent definition
├── hooks/
│   ├── pyproject.toml
│   └── session_start.py     # Python hook
└── README.md
```

### OpenCode Plugin Layout

```
my-plugin/
├── package.json             # npm manifest with opencode config
├── command/
│   └── review.md            # User-invocable command
├── skill/
│   └── chunk-impl/
│       └── SKILL.md         # Non-user-invocable skill
├── agent/
│   └── bug-fixer.md         # Subagent definition
├── plugins/
│   └── hooks.ts             # TypeScript hooks (optional)
└── README.md
```

### Path Mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `.claude-plugin/plugin.json` | `package.json` | npm package manifest |
| `skill/<name>/SKILL.md` (user-invocable) | `command/<name>.md` | Flat file, not directory |
| `skill/<name>/SKILL.md` (non-user-invocable) | `skill/<name>/SKILL.md` | Same structure |
| `agent/<name>.md` | `agent/<name>.md` | Same |
| `hooks/*.py` | `plugins/<name>.ts` | Language change |

---

## Feature Parity

| Feature | Claude Code | OpenCode | Parity | Notes |
|---------|-------------|----------|--------|-------|
| User-invocable skills | `skill/*/SKILL.md` | `command/*.md` | ✅ Full | Different path |
| Non-user-invocable skills | `skill/*/SKILL.md` | `skill/*/SKILL.md` | ✅ Full | Same format |
| Agents/subagents | `agent/*.md` | `agent/*.md` | ✅ Full | Different frontmatter |
| SessionStart hook | Python | TypeScript | ✅ Full | `session.created` |
| PreToolUse hook | Python | TypeScript | ✅ Full | `tool.execute.before` |
| PostToolUse hook | Python | TypeScript | ✅ Full | `tool.execute.after` |
| Stop hook (blocking) | Python | N/A | ❌ None | Cannot block in OpenCode |
| MCP servers | `.mcp.json` | `opencode.json` | ✅ Full | Different config location |
| Custom tools | Via MCP only | `tools/*.ts` | ✅+ Better | OpenCode has native tools |
| Model routing | Auto Haiku | Manual | ⚠️ Partial | No auto-routing |
| `$ARGUMENTS` | Yes | Yes | ✅ Full | Same placeholder |
| Positional args | No | `$1`, `$2`, `$3` | ✅+ Better | OpenCode adds these |
| Bash injection | No | `` !`cmd` `` | ✅+ Better | OpenCode adds this |
| File injection | No | `@filename` | ✅+ Better | OpenCode adds this |

---

## Skill Classification

### User-Invocable vs Non-User-Invocable

Claude Code skills can be:
- **User-invocable** (default): Appear in `/` menu, user invokes directly
- **Non-user-invocable**: Only called via `Skill()` tool programmatically

### Detection Rules

A skill is **non-user-invocable** if ANY of:
1. Has `user-invocable: false` in frontmatter (definitive)
2. Description says "called by /X, not directly" or similar
3. Is only referenced via `Skill("plugin:name")` calls (never directly by user)

**Note**: Internal helpers like `chunk-implementor` in vibe-workflow are **agents**, not skills. Check if the file is in `skill/` or `agent/` directory.

### Conversion Strategy

| Skill Type | → | OpenCode Target | Why |
|------------|---|-----------------|-----|
| User-invocable | → | `command/*.md` | Direct `/command` access |
| Non-user-invocable | → | `skill/*/SKILL.md` | Agent loads via skill tool |

---

## Converting User-Invocable Skills → Commands

### Frontmatter Transformation

**Claude Code:**
```yaml
---
name: review
description: Run all code review agents in parallel
model: sonnet
---
```

**OpenCode:**
```yaml
---
description: Run all code review agents in parallel
agent: build
model: anthropic/claude-sonnet-4-5-20250929
---
```

### Frontmatter Field Mapping

| Claude Code | OpenCode | Action |
|-------------|----------|--------|
| `name:` | (filename) | **Remove** - filename is the command name |
| `description:` | `description:` | Keep as-is |
| `model:` | `model:` | Convert to full model ID |
| N/A | `agent:` | **Add** - typically `build` |
| N/A | `subtask:` | Add if should run as subagent |

### File Path Change

```
# Claude Code
skill/review/SKILL.md

# OpenCode
command/review.md
```

Note: OpenCode commands are flat files, not directories.

---

## Converting Non-User-Invocable Skills → Skills

### Format Comparison

Non-user-invocable skills are nearly identical between platforms.

**Claude Code:**
```yaml
---
name: verify
description: 'Manifest verification runner. Called by /do, not directly by users.'
user-invocable: false
---
```

**OpenCode:**
```yaml
---
name: verify
description: 'Manifest verification runner. Called by /do, not directly by users.'
---
```

### Key Difference

| Field | Claude Code | OpenCode | Notes |
|-------|-------------|----------|-------|
| `name:` | Required | Required | **Keep it** for skills |
| `user-invocable:` | `false` | (remove) | OpenCode skills are not in `/` menu by default |
| Path | `skill/<name>/SKILL.md` | `skill/<name>/SKILL.md` | Same! |

### OpenCode Skill Discovery Paths

OpenCode finds skills in (order of precedence):
1. `.opencode/skill/<name>/SKILL.md` (project)
2. `~/.config/opencode/skill/<name>/SKILL.md` (global)
3. `.claude/skill/<name>/SKILL.md` (Claude-compatible!)
4. `~/.claude/skill/<name>/SKILL.md` (Claude-compatible!)

This means Claude Code skills can often work without modification.

---

## Converting Agents

### Frontmatter Transformation

**Claude Code:**
```yaml
---
name: bug-fixer
description: Expert bug investigator and fixer
tools: Bash, Glob, Grep, Read, Edit, Write, WebFetch, TodoWrite, WebSearch
model: opus
---
```

**OpenCode:**
```yaml
---
description: Expert bug investigator and fixer
mode: subagent
model: anthropic/claude-opus-4-5-20251101
temperature: 0.3
tools:
  read: allow
  edit: allow
  bash: allow
  webfetch: allow
  websearch: allow
---
```

### Frontmatter Field Mapping

| Claude Code | OpenCode | Action |
|-------------|----------|--------|
| `name:` | (filename) | **Remove** |
| `description:` | `description:` | Keep |
| `tools:` (comma list) | `tools:` (object) | **Convert format** |
| `model:` | `model:` | Convert to full ID |
| N/A | `mode:` | **Add** `subagent` or `primary` |
| N/A | `temperature:` | Optional, add if needed |
| N/A | `maxSteps:` | Optional iteration limit |
| N/A | `hidden:` | Optional, hide from autocomplete |

### Tool Permission Mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `Bash` | `bash: allow` | |
| `Read` | `read: allow` | |
| `Edit` | `edit: allow` | |
| `Write` | `edit: allow` | Same as edit in OpenCode |
| `Glob` | (built-in) | No permission needed |
| `Grep` | (built-in) | No permission needed |
| `WebFetch` | `webfetch: allow` | |
| `WebSearch` | `websearch: allow` | |
| `TodoWrite` | (built-in) | No permission needed |
| `Task` | `task: allow` | For spawning subagents |
| `Skill` | `skill: allow` | For loading skills |
| `NotebookEdit` | `notebook: allow` | Jupyter notebooks |

### Permission Values

- `allow` - Always permitted
- `ask` - Ask user each time
- `deny` - Never permitted

### Bash Glob Patterns

OpenCode supports glob patterns for bash permissions:
```yaml
tools:
  bash: allow
  "bash(npm test*)": allow
  "bash(rm -rf*)": deny
```

---

## Converting Hooks

### Event Mapping

| Claude Code | OpenCode | Equivalent |
|-------------|----------|------------|
| `SessionStart` | `session.created` | ✅ Yes |
| `PreToolUse` | `tool.execute.before` | ✅ Yes |
| `PostToolUse` | `tool.execute.after` | ✅ Yes |
| `Stop` | `session.idle` | ⚠️ Partial (can't block) |
| `PreCompact` | `session.compacted` | ✅ Yes |
| `SubagentStop` | N/A | ❌ No equivalent |

### Python → TypeScript Conversion

**Claude Code (Python):**
```python
# hooks/session_start.py
import json
import sys

def main():
    result = {
        "continue": True,
        "message": "Session started!"
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
```

**OpenCode (TypeScript):**
```typescript
// plugins/hooks.ts
export const SessionHooks = async ({ project, client }) => {
  return {
    "session.created": async (event) => {
      client.app.log("info", "Session started!")
      // Return value format differs
    },
  }
}
```

### Hook Context

**Claude Code** hooks receive context via environment variables:
- `CLAUDE_TOOL_NAME`
- `CLAUDE_TOOL_INPUT`
- etc.

**OpenCode** hooks receive context via event parameter:
```typescript
"tool.execute.after": async (event) => {
  const { tool, args, result } = event
}
```

### Matchers

**Claude Code** uses `matcher` field:
```json
{
  "matcher": "TodoWrite",
  "hooks": [...]
}
```

**OpenCode** implements matching in code:
```typescript
"tool.execute.after": async (event) => {
  if (event.tool === "todo") {
    // Handle TodoWrite
  }
}
```

### What Cannot Be Converted

1. **Stop blocking**: Claude Code can return `{"continue": false}` to prevent stopping; OpenCode cannot
2. **SubagentStop**: No equivalent in OpenCode
3. **Python-specific logic**: Must be rewritten in TypeScript
4. **External Python deps**: Need TypeScript alternatives

---

## Prompt Content Transformations

### Skill/Command References

**Claude Code:**
```markdown
Use the Skill tool: Skill("vibe-workflow:review-bugs")

Or with arguments:
Skill("vibe-workflow:explore-codebase", "authentication system")
```

**OpenCode:**
```markdown
Run the /review-bugs command

Or with arguments:
/explore-codebase authentication system
```

### Task Tool References

**Claude Code:**
```markdown
Launch the bug-fixer agent using the Task tool with subagent_type="vibe-workflow:bug-fixer"
```

**OpenCode:**
```markdown
Use the bug-fixer agent (defined in agent/bug-fixer.md)
```

### Model References

**Claude Code:**
```markdown
Use `model: opus` for complex analysis
```

**OpenCode:**
```markdown
Use `model: anthropic/claude-opus-4-5-20251101` for complex analysis
```

### Regex Replacements

Apply these transformations to prompt content:

| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `Skill\("[\w-]+:([\w-]+)"(?:,\s*"([^"]*)")?\)` | `/$1 $2` | Skill calls → slash commands |
| `\bopus\b` (in model context) | `anthropic/claude-opus-4-5-20251101` | Model names |
| `\bsonnet\b` (in model context) | `anthropic/claude-sonnet-4-5-20250929` | Model names |
| `\bhaiku\b` (in model context) | `anthropic/claude-haiku-4-5-20251001` | Model names |
| `Task tool with subagent_type` | `the <agent> agent` | Agent references |

---

## Model Mapping

### Full Model ID Reference

| Claude Code | OpenCode Full ID | OpenCode Short |
|-------------|------------------|----------------|
| `opus` | `anthropic/claude-opus-4-5-20251101` | `claude-opus-4-5` |
| `sonnet` | `anthropic/claude-sonnet-4-5-20250929` | `claude-sonnet-4-5` |
| `haiku` | `anthropic/claude-haiku-4-5-20251001` | `claude-haiku-4-5` |

### Provider Prefixes

OpenCode supports multiple providers:
- `anthropic/` - Anthropic direct
- `openai/` - OpenAI models
- `google/` - Google Gemini
- `bedrock/` - AWS Bedrock
- `vertex/` - Google Vertex AI

---

## Plugin Manifest Conversion

### Claude Code plugin.json

```json
{
  "name": "vibe-workflow",
  "description": "Ship high-quality code faster",
  "version": "2.13.2",
  "author": {
    "name": "doodledood",
    "email": "email@example.com"
  },
  "homepage": "https://github.com/doodledood/claude-code-plugins",
  "repository": "https://github.com/doodledood/claude-code-plugins",
  "license": "MIT",
  "keywords": ["vibe-coding", "workflow"],
  "hooks": { ... }
}
```

### OpenCode package.json

```json
{
  "name": "opencode-vibe-workflow",
  "version": "2.13.2",
  "description": "Ship high-quality code faster",
  "author": "doodledood <email@example.com>",
  "homepage": "https://github.com/doodledood/opencode-plugins",
  "repository": {
    "type": "git",
    "url": "https://github.com/doodledood/opencode-plugins"
  },
  "license": "MIT",
  "keywords": ["opencode", "opencode-plugin", "vibe-coding", "workflow"],
  "opencode": {
    "command": "./commands",
    "agent": "./agents",
    "skill": "./skills",
    "plugins": "./plugins"
  }
}
```

---

## Known Plugins Classification

### vibe-workflow

**Note**: All skills in vibe-workflow are user-invocable. Internal helpers are implemented as agents.

| Skill | Type | → OpenCode |
|-------|------|------------|
| `review` | User-invocable | `command/review.md` |
| `plan` | User-invocable | `command/plan.md` |
| `spec` | User-invocable | `command/spec.md` |
| `implement` | User-invocable | `command/implement.md` |
| `implement-inplace` | User-invocable | `command/implement-inplace.md` |
| `explore-codebase` | User-invocable | `command/explore-codebase.md` |
| `research-web` | User-invocable | `command/research-web.md` |
| `bugfix` | User-invocable | `command/bugfix.md` |
| `fix-review-issues` | User-invocable | `command/fix-review-issues.md` |
| `review-*` (all) | User-invocable | `command/review-*.md` |

| Agent | → OpenCode |
|-------|------------|
| `bug-fixer` | `agent/bug-fixer.md` |
| `chunk-implementor` | `agent/chunk-implementor.md` |
| `chunk-verifier` | `agent/chunk-verifier.md` |
| `codebase-explorer` | `agent/codebase-explorer.md` |
| `web-researcher` | `agent/web-researcher.md` |
| `plan-verifier` | `agent/plan-verifier.md` |
| `*-reviewer` (all) | `agent/*-reviewer.md` |

### vibe-extras

| Skill | Type | → OpenCode |
|-------|------|------------|
| `clean-slop` | User-invocable | `command/clean-slop.md` |
| `rebase-on-main` | User-invocable | `command/rebase-on-main.md` |
| `rewrite-history` | User-invocable | `command/rewrite-history.md` |
| `update-claude-md` | User-invocable | `command/update-claude-md.md` |

| Agent | → OpenCode |
|-------|------------|
| `slop-cleaner` | `agent/slop-cleaner.md` |

### vibe-experimental

**Note**: `verify`, `done`, and `escalate` have `user-invocable: false` - they're called by `/do`, not directly.

| Skill | Type | → OpenCode |
|-------|------|------------|
| `define` | User-invocable | `command/define.md` |
| `do` | User-invocable | `command/do.md` |
| `verify` | **Non-user-invocable** | `skill/verify/SKILL.md` |
| `done` | **Non-user-invocable** | `skill/done/SKILL.md` |
| `escalate` | **Non-user-invocable** | `skill/escalate/SKILL.md` |

| Agent | → OpenCode |
|-------|------------|
| `criteria-checker` | `agent/criteria-checker.md` |
| `*-reviewer` (all) | `agent/*-reviewer.md` |

---

## Edge Cases & Limitations

### Cannot Convert

1. **Stop hooks that block**: Claude Code can prevent stopping; OpenCode cannot
2. **SubagentStop hooks**: No equivalent event in OpenCode
3. **Complex Python deps**: Must find TypeScript alternatives
4. **Model auto-routing**: Claude Code uses Haiku for searches automatically

### Requires Manual Work

1. **Hook logic**: Python → TypeScript rewrite required
2. **External API calls in hooks**: Need TypeScript HTTP clients
3. **File system operations in hooks**: Use Bun/Node APIs

### Known Issues

1. **Skills calling skills**: May need adjustment for skill tool vs `/command`
2. **Agent tool restrictions**: OpenCode tool permissions are more granular
3. **Context fork**: Claude Code `context: fork` needs testing in OpenCode

---

## Migration Checklist

### Per Plugin

- [ ] Create `package.json` from `plugin.json`
- [ ] Identify user-invocable vs non-user-invocable skills
- [ ] Convert user-invocable skills → `command/*.md`
- [ ] Copy non-user-invocable skills → `skill/*/SKILL.md`
- [ ] Convert agents → `agent/*.md`
- [ ] Document hooks needing manual conversion
- [ ] Update all `Skill()` references to `/command` format
- [ ] Update all model names to full IDs
- [ ] Update tool lists in agents to permission format
- [ ] Create README for converted plugin

### Per Skill/Command

- [ ] Remove `name:` from frontmatter (commands only)
- [ ] Add `agent:` field (commands only)
- [ ] Convert `model:` to full ID
- [ ] Replace `Skill()` calls in content
- [ ] Replace `Task` tool references

### Per Agent

- [ ] Remove `name:` from frontmatter
- [ ] Add `mode: subagent`
- [ ] Convert `tools:` to permission object
- [ ] Convert `model:` to full ID
- [ ] Update prompt content references

### Testing

- [ ] Test each command via `/command-name`
- [ ] Verify agents spawn correctly
- [ ] Check skill discovery works
- [ ] Validate prompt transformations
- [ ] Test with different OpenCode models

---

## Quick Reference Card

### Frontmatter Cheat Sheet

**Command (user-invocable):**
```yaml
---
description: What it does
agent: build
model: anthropic/claude-sonnet-4-5-20250929  # optional
---
```

**Skill (non-user-invocable):**
```yaml
---
name: skill-name
description: What it does
---
```

**Agent:**
```yaml
---
description: What it does
mode: subagent
model: anthropic/claude-opus-4-5-20251101
tools:
  read: allow
  edit: allow
  bash: allow
---
```

### Content Transformations

| Find | Replace |
|------|---------|
| `Skill("plugin:foo")` | `/foo` |
| `Skill("plugin:foo", "args")` | `/foo args` |
| `model: opus` | `model: anthropic/claude-opus-4-5-20251101` |
| `model: sonnet` | `model: anthropic/claude-sonnet-4-5-20250929` |
| `tools: Bash, Read` | `tools:\n  bash: allow\n  read: allow` |
