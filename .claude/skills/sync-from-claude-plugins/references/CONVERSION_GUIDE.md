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
| User commands | Skills (user-invocable) | Commands (`command/*.md`) |
| Internal skills | Skills (non-user-invocable) | Skills (`skill/*/SKILL.md`) |
| Subagents | Agents | Agents (`agent/*.md`) |
| Event hooks | Python hooks | Hooks (`plugin/*.ts`) |
| Plugin bundles | Plugins (with plugin.json) | **No equivalent** - flat directories |
| External tools | MCP servers | MCP servers + custom tools |

**Terminology note**: OpenCode confusingly calls hooks "plugins" (stored in `plugin/` directory). There's no "plugin bundle" concept - OpenCode uses flat directories that are merged together. This repo organizes related resources into directories we call "plugins" for convenience.

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

### OpenCode Plugin Layout (Source)

This is the **source** layout for plugins in this repository:

```
my-plugin/
├── package.json             # Plugin metadata (for npm publishing)
├── command/
│   └── review.md            # User-invocable command
├── skill/
│   └── chunk-impl/
│       └── SKILL.md         # Non-user-invocable skill
├── agent/
│   └── bug-fixer.md         # Subagent definition
├── plugin/
│   └── hooks.ts             # TypeScript hooks (optional)
└── README.md
```

### OpenCode Discovery (Installed)

OpenCode discovers resources from **flat directories**, not nested plugin structures. The `install.sh` script copies files with a **plugin postfix** to avoid name collisions:

```
~/.config/opencode/
├── command/
│   ├── review-vibe-workflow.md        # /review-vibe-workflow
│   ├── plan-vibe-workflow.md          # /plan-vibe-workflow
│   ├── define-vibe-experimental.md    # /define-vibe-experimental
│   └── ...
├── agent/
│   ├── bug-fixer-vibe-workflow.md
│   ├── criteria-checker-vibe-experimental.md
│   └── ...
├── skill/
│   └── verify-vibe-experimental/
│       └── SKILL.md
└── plugin/
    ├── vibe-workflow-hooks.ts
    └── vibe-experimental-hooks.ts
```

**Naming convention**: All files are postfixed with `-<plugin-name>` to:
- Avoid collisions between plugins with similar commands/agents
- Enable clean uninstall per plugin
- Support sync (deletions detected by postfix pattern)

**Installation**: Use `install.sh` which performs a full sync:
1. Cleans existing files for the plugin (by postfix pattern)
2. Copies fresh files from source
3. Updates `name:` fields to match new filenames

### Path Mapping

| Claude Code | OpenCode (Source) | OpenCode (Installed) |
|-------------|-------------------|----------------------|
| `.claude-plugin/plugin.json` | `package.json` | N/A (metadata only) |
| `skill/<name>/SKILL.md` (user-invocable) | `command/<name>.md` | `command/<name>-<plugin>.md` |
| `skill/<name>/SKILL.md` (non-user-invocable) | `skill/<name>/SKILL.md` | `skill/<name>-<plugin>/SKILL.md` |
| `agent/<name>.md` | `agent/<name>.md` | `agent/<name>-<plugin>.md` |
| `hooks/*.py` | `plugin/hooks.ts` | `plugin/<plugin>-hooks.ts` |

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
model: anthropic/claude-sonnet-4-5-20250929
---
```

### Frontmatter Field Mapping

| Claude Code | OpenCode | Action |
|-------------|----------|--------|
| `name:` | (filename) | **Remove** - filename is the command name |
| `description:` | `description:` | Keep as-is |
| `model:` | `model:` | Convert to full model ID |
| N/A | `agent:` | Optional - references an agent name to execute the command |
| N/A | `subtask:` | Add `true` if should run as subagent |

**Note**: The `agent:` field references an **agent name** (e.g., `agent: reviewer`), not a mode. If omitted, the command runs with the default agent.

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

| Claude Code | OpenCode | Can Block? | Notes |
|-------------|----------|------------|-------|
| `SessionStart` | `session.created` | N/A | Inject context on session start |
| `PostCompact` | `session.compacted` | N/A | Re-inject context after compaction |
| `PostToolUse` | `tool.execute.after` | No | React to tool completion |
| `PreToolUse` | `tool.execute.before` | **Yes** | Use `output.abort` to block |
| `Stop` | `session.idle` | **No** | Cannot prevent stopping |
| `SubagentStop` | N/A | — | ❌ No equivalent |

**Important**: OpenCode's `tool.execute.before` **CAN block** tool execution via `output.abort = "reason"`. This is different from Claude Code's `{"continue": false}` pattern but achieves the same result. However, `session.idle` (Stop) still cannot block.

### Complete TypeScript Hook Template

Create `plugin/hooks.ts`:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for <plugin-name> plugin.
 * Converted from Python hooks in claude-code-plugins.
 */

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    /**
     * Session created - inject initial context
     * Converted from: SessionStart hook
     */
    "session.created": async () => {
      await client.app.log({
        service: "my-plugin",
        level: "info",
        message: "Session started"
      });
      // Note: For context injection, use experimental.chat.system.transform instead
    },

    /**
     * System prompt transformation - inject context
     * Use this to add custom context to the system prompt
     */
    "experimental.chat.system.transform": async (input, output) => {
      output.system.push(`<system-reminder>Your reminder text here</system-reminder>`);
    },

    /**
     * Session compacting - preserve context during compaction
     * Converted from: PostCompact hook
     */
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`<preserved-state>Recovery info for compacted sessions</preserved-state>`);
    },

    /**
     * After tool execution - react to tool results (CANNOT block)
     * Converted from: PostToolUse hook
     */
    "tool.execute.after": async (input) => {
      // Filter by tool name (OpenCode uses "todo" not "TodoWrite")
      if (input.call.name !== "todo") return;

      await client.app.log({
        service: "my-plugin",
        level: "info",
        message: "Todo tool executed"
      });
    },

    /**
     * Before tool execution - CAN BLOCK via output.abort
     * Converted from: PreToolUse hook
     *
     * Unlike Claude Code's {"continue": false}, use output.abort = "reason"
     */
    "tool.execute.before": async (input, output) => {
      const toolName = input.call.name;
      const toolInput = input.call.input;

      // Example: Block reading .env files
      if (toolName === "Read" && toolInput.file_path?.includes(".env")) {
        output.abort = "Cannot read .env files for security reasons";
        return;
      }

      // Example: Warn but don't block (just log)
      if (toolName === "bash") {
        await client.app.log({
          service: "my-plugin",
          level: "warn",
          message: `Bash command: ${toolInput.command}`
        });
      }
    },

    /**
     * Session idle - CANNOT prevent stopping
     * Converted from: Stop hook
     *
     * NOTE: Claude Code's Stop hook can return {"continue": false} to prevent
     * stopping. OpenCode does NOT support blocking here.
     */
    "session.idle": async () => {
      await client.app.log({
        service: "my-plugin",
        level: "debug",
        message: "Session idle"
      });
    },
  };
};
```

### Alternative: Simple Default Export (for basic hooks)

For simpler plugins without the full type system:

```typescript
export default async ({ project, client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Block dangerous commands
      if (input.call.name === "bash" && input.call.input.command?.includes("rm -rf")) {
        output.abort = "Blocked dangerous rm -rf command";
      }
    },
  };
};
```

### Tool Name Mapping in Hooks

| Claude Code Tool | OpenCode Tool Name |
|-----------------|-------------------|
| `TodoWrite` | `todo` |
| `Bash` | `bash` |
| `Read` | `read` |
| `Edit` | `edit` |
| `Write` | `edit` |
| `Skill` | `skill` |
| `Task` | `task` |

### Return Value Format

Hooks can return `additionalContext` to inject text into the conversation:

```typescript
return {
  additionalContext: "<system-reminder>Your message</system-reminder>",
};
```

Multiple reminders can be combined:
```typescript
return {
  additionalContext: [
    buildSystemReminder("First"),
    buildSystemReminder("Second"),
  ].join("\n"),
};
```

### What Cannot Be Converted

| Feature | Why | Workaround |
|---------|-----|------------|
| Stop blocking | `session.idle` cannot prevent stopping | Log warning |
| SubagentStop | No equivalent event | None |
| Subagent tool interception | Hooks don't intercept subagent tool calls | Design around this limitation |
| MCP tool interception | MCP tool calls don't trigger hooks | Use MCP server-side logic |
| Python dependencies | Different runtime | Find TypeScript alternatives |

**Note**: `tool.execute.before` **CAN block** via `output.abort` - this is fully supported.

### Logging

Use `client.app.log()` with structured format:
```typescript
await client.app.log({
  service: "my-plugin",
  level: "info",     // debug | info | warn | error
  message: "Description of what happened",
  extra: { foo: "bar" }  // optional metadata
});
```

Enable verbose logging with `opencode --verbose`.

---

## Prompt Content Transformations

### Skill/Command References

**User-invocable skills → Slash commands:**

Claude Code:
```markdown
Skill("vibe-workflow:review")
Skill("vibe-workflow:explore-codebase", "authentication system")
```

OpenCode:
```markdown
/review
/explore-codebase authentication system
```

**Non-user-invocable skills → Skill tool:**

Claude Code:
```markdown
Skill("vibe-experimental:verify")
Skill("vibe-experimental:done", "task completed")
```

OpenCode:
```markdown
Use the skill tool: skill({ name: "verify" })
Use the skill tool with arguments: skill({ name: "done", arguments: "task completed" })
```

**Note**: The `skill()` tool is OpenCode's native way to programmatically load skill content into the conversation. It returns the SKILL.md content for the agent to use.

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

**For user-invocable skills (→ commands):**
| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `Skill\("[\w-]+:([\w-]+)"(?:,\s*"([^"]*)")?\)` | `/$1 $2` | Skill calls → slash commands |

**For non-user-invocable skills (→ skill tool):**
| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `Skill\("[\w-]+:([\w-]+)"\)` | `skill({ name: "$1" })` | Skill calls → skill tool |
| `Skill\("[\w-]+:([\w-]+)",\s*"([^"]*)"\)` | `skill({ name: "$1", arguments: "$2" })` | With args |

**Other replacements:**
| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `\bopus\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `\bsonnet\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `\bhaiku\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `Task tool with subagent_type` | `the <agent> agent` | Agent references |

---

## Model Mapping

This is the **canonical reference** for model ID conversion. All other sections reference this.

### Claude Code → OpenCode Model IDs

| Claude Code | OpenCode Full ID |
|-------------|------------------|
| `opus` | `anthropic/claude-opus-4-5-20251101` |
| `sonnet` | `anthropic/claude-sonnet-4-5-20250929` |
| `haiku` | `anthropic/claude-haiku-4-5-20251001` |

### Provider Prefixes

OpenCode supports multiple providers:
- `anthropic/` - Anthropic direct
- `openai/` - OpenAI models
- `google/` - Google Gemini
- `bedrock/` - AWS Bedrock
- `vertex/` - Google Vertex AI

### Usage in Frontmatter

```yaml
# Claude Code
model: sonnet

# OpenCode
model: anthropic/claude-sonnet-4-5-20250929
```

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
  "type": "module",
  "homepage": "https://github.com/doodledood/opencode-plugins",
  "repository": {
    "type": "git",
    "url": "https://github.com/doodledood/opencode-plugins"
  },
  "license": "MIT",
  "keywords": ["opencode", "opencode-plugin", "vibe-coding", "workflow"],
  "opencode": {
    "type": "plugin",
    "hooks": ["tool.execute.before", "session.created"]
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.162"
  }
}
```

**Notes**:
- Use `"type": "module"` for ESM format
- The `opencode` field describes the plugin type and hooks for npm registry metadata
- Add `@opencode-ai/plugin` dependency for TypeScript types
- **Important**: This package.json is for npm publishing. OpenCode does NOT read it for discovery. Files must be installed to `~/.config/opencode/` directories

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

### Directory Naming

OpenCode uses glob patterns that accept **both** singular and plural:
- `{command,commands}/**/*.md`
- `{agent,agents}/**/*.md`
- `{plugin,plugins}/**/*.{ts,js}`

**Convention**: Official docs use **plural** (`commands/`, `agents/`, `plugins/`). Singular works for backwards compatibility.

### Cannot Convert

1. **Stop hooks that block**: `session.idle` cannot prevent stopping
2. **SubagentStop hooks**: No equivalent event in OpenCode
3. **Subagent tool interception**: Hooks don't fire for subagent tool calls
4. **MCP tool interception**: MCP tool calls don't trigger hooks
5. **Complex Python deps**: Must find TypeScript alternatives
6. **Model auto-routing**: Claude Code uses Haiku for searches automatically

### CAN Convert (contrary to earlier belief)

1. **PreToolUse blocking**: OpenCode's `tool.execute.before` **CAN block** via `output.abort`

### Requires Manual Work

1. **Hook logic**: Python → TypeScript rewrite required
2. **External API calls in hooks**: Need TypeScript HTTP clients
3. **File system operations in hooks**: Use Bun/Node APIs

### Known Issues

1. **Skills calling skills**: Use `skill({ name: "skill-name" })` tool for non-user-invocable skills, `/command` for user-invocable ones
2. **Agent tool restrictions**: OpenCode tool permissions are more granular
3. **Context fork**: Claude Code `context: fork` needs testing in OpenCode

---

## Migration Checklist

### Per Plugin

- [ ] Create `package.json` from `plugin.json` (use singular paths!)
- [ ] Identify user-invocable vs non-user-invocable skills
- [ ] Convert user-invocable skills → `command/<name>.md`
- [ ] Copy non-user-invocable skills → `skill/<name>/SKILL.md`
- [ ] Convert agents → `agent/<name>.md`
- [ ] Convert hooks → `plugin/hooks.ts` (see [Converting Hooks](#converting-hooks))
- [ ] Update `Skill()` references: user-invocable → `/command`, non-user-invocable → `skill({ name: "..." })`
- [ ] Update all model names to full IDs (see [Model Mapping](#model-mapping))
- [ ] Update tool lists in agents to permission format
- [ ] Create README for converted plugin

### Per Skill/Command

- [ ] Remove `name:` from frontmatter (commands only)
- [ ] Add `agent:` field if command should use specific agent (optional)
- [ ] Convert `model:` to full ID
- [ ] Replace `Skill()` calls: → `/command` or → `skill({ name: "..." })`
- [ ] Replace `Task` tool references

### Per Agent

- [ ] Remove `name:` from frontmatter
- [ ] Add `mode: subagent`
- [ ] Convert `tools:` to permission object
- [ ] Convert `model:` to full ID
- [ ] Update prompt content references

### Per Hook (if source has `hooks/` directory)

- [ ] Create `plugin/hooks.ts` (or `plugins/hooks.ts`)
- [ ] Add `@opencode-ai/plugin` dependency
- [ ] Map `SessionStart` → `session.created`
- [ ] Map `PostCompact` → `experimental.session.compacting`
- [ ] Map `PostToolUse` → `tool.execute.after`
- [ ] Map `PreToolUse` → `tool.execute.before` (CAN block via `output.abort`)
- [ ] Document any `Stop` hooks (blocking not supported)
- [ ] Convert Python logic to TypeScript
- [ ] Use `output.abort` pattern instead of `{"continue": false}`

### Testing

- [ ] Test each command via `/command-name`
- [ ] Verify agents spawn correctly
- [ ] Check skill discovery works
- [ ] Validate prompt transformations
- [ ] Verify hooks fire correctly
- [ ] Test with different OpenCode models

---

## Quick Reference Card

### Frontmatter Cheat Sheet

**Command** (user-invocable, `command/<name>.md`):
```yaml
---
description: What it does
model: <full-model-id>  # optional, see Model Mapping
agent: <agent-name>     # optional, references an agent to execute the command
subtask: true           # optional, run as subagent
---
```

**Skill** (non-user-invocable, `skill/<name>/SKILL.md`):
```yaml
---
name: skill-name
description: What it does
---
```

**Agent** (`agent/<name>.md`):
```yaml
---
description: What it does
mode: subagent
model: <full-model-id>  # see Model Mapping
tools:
  read: allow
  edit: allow
  bash: allow
---
```

### Content Transformations

**User-invocable skills (become commands):**

| Find | Replace (Source) | After Install |
|------|------------------|---------------|
| `Skill("plugin:foo")` | `/foo` | `/foo-<plugin>` |
| `Skill("plugin:foo", "args")` | `/foo args` | `/foo-<plugin> args` |

**Non-user-invocable skills (remain skills):**

| Find | Replace |
|------|---------|
| `Skill("plugin:foo")` | `skill({ name: "foo" })` |
| `Skill("plugin:foo", "args")` | `skill({ name: "foo", arguments: "args" })` |

**Other transformations:**

| Find | Replace |
|------|---------|
| `model: opus/sonnet/haiku` | See [Model Mapping](#model-mapping) |
| `tools: Bash, Read, ...` | See [Tool Permission Mapping](#tool-permission-mapping) |

**Note**: The install script adds `-<plugin>` postfix to command filenames. Skill directories also get postfixed (e.g., `skill/verify-<plugin>/SKILL.md`).

### Directory Structure

**Source** (this repo):
```
<plugin-name>/
├── package.json
├── command/       # User-invocable commands
│   └── review.md
├── agent/         # Subagent definitions
│   └── bug-fixer.md
├── skill/         # Non-user-invocable skills
│   └── verify/
│       └── SKILL.md
└── plugin/        # TypeScript hooks
    └── hooks.ts
```

**Installed** (after `./install.sh`):
```
~/.config/opencode/
├── command/
│   └── review-<plugin-name>.md
├── agent/
│   └── bug-fixer-<plugin-name>.md
├── skill/
│   └── verify-<plugin-name>/
│       └── SKILL.md
└── plugin/
    └── <plugin-name>-hooks.ts
```
