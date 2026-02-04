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
14. [Conversion Rules](#conversion-rules)

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
4. Updates internal references: `/command` → `/command-<plugin>`, `skill({ name: "x" })` → `skill({ name: "x-<plugin>" })`

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
| SessionStart hook | Python | TypeScript | ✅ Full | Use `event` + `experimental.chat.system.transform` |
| PreToolUse hook (observe) | Python | TypeScript | ✅ Full | `tool.execute.before` - observe/modify |
| PreToolUse hook (block) | Python | TypeScript | ✅ Full | `throw new Error()` in `tool.execute.before` OR `permission.ask` hook OR permission config |
| PostToolUse hook | Python | TypeScript | ⚠️ Partial | `tool.execute.after` - no additionalContext |
| Stop hook (blocking) | Python | TypeScript | ⚠️ Partial | Reactive simulation via `session.idle` + `client.session.prompt` (see [Stop Hook Simulation](#stop-hook-simulation)) |
| Permission control | N/A | TypeScript | ✅+ Better | `permission.ask` hook can allow/deny/ask |
| MCP servers | `.mcp.json` | `opencode.json` | ✅ Full | Different config location |
| Custom tools | Via MCP only | `tools/*.ts` | ✅+ Better | OpenCode has native tools |
| Model routing | Auto Haiku | Manual | ⚠️ Partial | No auto-routing |
| `$ARGUMENTS` | Yes | Yes | ✅ Full | Same placeholder |
| Positional args | No | `$1`, `$2`, `$3` | ✅+ Better | OpenCode adds these |
| Bash injection | No | `` !`cmd` `` | ✅+ Better | OpenCode adds this |
| File injection | No | `@filename` | ✅+ Better | OpenCode adds this |

---

## Skill Classification

### Commands vs Skills

| Aspect | Commands (`command/*.md`) | Skills (`skill/*/SKILL.md`) |
|--------|---------------------------|----------------------------|
| User invocable | Yes (`/command-name`) | **No** (agent-only) |
| Model invocable | No | Yes (`skill({ name: "..." })`) |
| Directory structure | Flat files only | Supports subdirectories |

**Key difference**: OpenCode skills are **NOT** user-invocable. Only commands appear in the `/` menu. Skills are loaded by agents via the `skill()` tool.

### Conversion Table

| Claude Code | → | OpenCode |
|-------------|---|----------|
| User-invocable skill (simple) | → | `command/*.md` (full content) |
| User-invocable skill (has supporting files) | → | `command/*.md` (thin wrapper) + `skill/*/SKILL.md` (full content) |
| Non-user-invocable skill | → | `skill/*/SKILL.md` |

### Thin Wrappers Required for Skills with Supporting Files

When a user-invocable skill has supporting files (subdirectories), create a thin command wrapper that loads the skill:

```yaml
# command/define.md - thin wrapper for skill with supporting files
---
description: 'Plan work, scope tasks, spec out requirements'
---
Task: $ARGUMENTS

Load the define skill: skill({ name: "define" })
```

```yaml
# skill/define/SKILL.md - full content with supporting files
---
name: define
description: 'Plan work, scope tasks, spec out requirements'
---
[Full content here, can reference ./tasks/*.md etc.]
```

The `skill()` tool only accepts `name` — it does NOT accept arguments. Place `$ARGUMENTS` in the command body so they're visible in context when the skill is loaded.

**When to use commands vs skills**:
- **Commands** (`command/*.md`): For all user-invocable functionality. Either contains full content (simple case) or thin wrapper to skill (when supporting files needed).
- **Skills** (`skill/*/SKILL.md`): For non-user-invocable prompts OR when supporting files are needed (with a command wrapper for user invocation).

Agents (`agent/*.md`) are different from skills — check the source directory.

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

The `agent:` field references an **agent name** (e.g., `agent: reviewer`), not a mode. If omitted, the command runs with the default agent.

### File Path Change

```
# Claude Code
skill/review/SKILL.md

# OpenCode
command/review.md
```

OpenCode commands are flat files, not directories.

---

## Converting Non-User-Invocable Skills → Skills

### Format Comparison

Non-user-invocable skills are identical between platforms except for the `user-invocable` field removal.

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

Claude Code skills work without modification if they have no `user-invocable` field or supporting files.

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
model: openai/gpt-5.2
temperature: 0.3
tools:
  read: true
  edit: true
  bash: true
  webfetch: true
  websearch: true
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

### Tool Mapping (Canonical)

This table is the single source of truth for all tool name conversions (frontmatter, hooks, content).

| Claude Code | OpenCode (frontmatter) | OpenCode (hook `input.tool`) |
|-------------|------------------------|------------------------------|
| `Bash` | `bash: true` | `bash` |
| `Read` | `read: true` | `read` |
| `Edit` | `edit: true` | `edit` |
| `Write` | `edit: true` | `edit` |
| `Glob` | `glob: true` | `glob` |
| `Grep` | `grep: true` | `grep` |
| `WebFetch` | `webfetch: true` | `webfetch` |
| `WebSearch` | `websearch: true` | `websearch` |
| `TodoWrite` | `todowrite: true` | `todowrite` |
| `TodoRead` | `todoread: true` | `todoread` |
| `TaskCreate` | `todowrite: true` | `todowrite` |
| `TaskUpdate` | `todowrite: true` | `todowrite` |
| `TaskList` | `todoread: true` | `todoread` |
| `TaskGet` | `todoread: true` | `todoread` |
| `Task` | `task: true` | `task` |
| `Skill` | `skill: true` | `skill` |
| `SlashCommand` | `skill: true` | `skill` |
| `NotebookEdit` | `edit: true` | `edit` |
| `AskUserQuestion` | `question: false` | `question` |

**Additional OpenCode permissions** (no Claude Code equivalent):
- `list: true` — directory listing
- `lsp: true` — LSP queries
- `codesearch: true` — code search
- `external_directory: true` — paths outside project
- `doom_loop: true` — repeated identical calls

All tools are **enabled by default** in OpenCode. Specifying them explicitly in agent frontmatter ensures the agent has access even if global config restricts them.

Explicitly set interactive tools to `false` for all subagents since they run autonomously:
- `question: false` - subagents should not prompt users for input

If a Claude Code agent has no `tools:` line, add a minimal tools section with just the disabled interactive tools:
```yaml
tools:
  question: false
```

### Permission Values

Tool permissions use **boolean values**:
- `true` - Tool is permitted
- `false` - Tool is denied (or simply omit the tool)

---

## Converting Hooks

### Event Mapping

| Claude Code | OpenCode Hook | Can Block? | Notes |
|-------------|---------------|------------|-------|
| `SessionStart` | `event` + `experimental.chat.system.transform` | N/A | See below |
| `PostCompact` | `experimental.session.compacting` | N/A | Re-inject context after compaction |
| `PostToolUse` | `tool.execute.after` | No | React to tool completion |
| `PreToolUse` | `tool.execute.before` | **Yes** | Modify args OR `throw` to block (primary agent only — not subagents) |
| `Stop` | `event` (session.idle) + `client.session.prompt` | **Reactive** | Cannot block, but can resume session (see [Stop Hook Simulation](#stop-hook-simulation)) |
| `SubagentStop` | `event` (session.created + parentID) | **Reactive** | Detect child sessions, react via prompt/abort (see [Subagent Activity Detection](#subagent-activity-detection)) |

Session lifecycle events (`session.created`, `session.idle`) are caught via the **`event`** hook, NOT as direct hook keys. The `event` hook receives `{ event: Event }` where `event.type` can be `"session.created"`, `"session.idle"`, etc.

OpenCode's `tool.execute.before` blocks execution by **throwing an error** (no `output.abort` field — use `throw new Error(...)`). It can also modify `output.args`. For first-class policy enforcement, use `permission.ask` hooks or permission config. These hooks only fire for the primary agent — subagent and MCP tool calls do not trigger them.

### Complete Hooks Interface (Reference)

From `@opencode-ai/plugin` (source: github.com/sst/opencode):

```typescript
export interface Hooks {
  // Event handler for ALL lifecycle events (session, file, message, etc.)
  event?: (input: { event: Event }) => Promise<void>

  // Configuration hook
  config?: (input: Config) => Promise<void>

  // Custom tools definition
  tool?: { [key: string]: ToolDefinition }

  // Authentication hook
  auth?: AuthHook

  // Chat manipulation hooks
  "chat.message"?: (input: { sessionID: string; agent?: string; ... }, output: { message: UserMessage; parts: Part[] }) => Promise<void>
  "chat.params"?: (input: { sessionID: string; agent: string; model: Model; ... }, output: { temperature: number; topP: number; topK: number; options: Record<string, any> }) => Promise<void>
  "chat.headers"?: (input: { sessionID: string; ... }, output: { headers: Record<string, string> }) => Promise<void>

  // Permission hook - can control allow/deny/ask
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>

  // Command execution hook
  "command.execute.before"?: (input: { command: string; sessionID: string; arguments: string }, output: { parts: Part[] }) => Promise<void>

  // Tool execution hooks
  "tool.execute.before"?: (input: { tool: string; sessionID: string; callID: string }, output: { args: any }) => Promise<void>
  "tool.execute.after"?: (input: { tool: string; sessionID: string; callID: string }, output: { title: string; output: string; metadata: any }) => Promise<void>

  // Experimental hooks
  "experimental.chat.messages.transform"?: (input: {}, output: { messages: { info: Message; parts: Part[] }[] }) => Promise<void>
  "experimental.chat.system.transform"?: (input: { sessionID: string }, output: { system: string[] }) => Promise<void>
  "experimental.session.compacting"?: (input: { sessionID: string }, output: { context: string[]; prompt?: string }) => Promise<void>
  "experimental.text.complete"?: (input: { sessionID: string; messageID: string; partID: string }, output: { text: string }) => Promise<void>
}
```

### Event Types (via `event` hook)

The `event` hook receives events with `event.type` set to one of:

| Category | Event Types |
|----------|-------------|
| Session | `session.created`, `session.updated`, `session.deleted`, `session.idle`, `session.error`, `session.compacted`, `session.diff`, `session.status` |
| Message | `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed` |
| File | `file.edited`, `file.watcher.updated` |
| Permission | `permission.updated`, `permission.replied` |
| Command | `command.executed` |
| Tool | `tool.execute.before`, `tool.execute.after` |
| Todo | `todo.updated` |
| Installation | `installation.updated` |
| LSP | `lsp.client.diagnostics`, `lsp.updated` |
| Server | `server.connected` |
| TUI | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |

### Hook Implementation Notes

**Plugin signature**: `Plugin = async ({ project, client, $, directory, worktree, serverUrl }) => Hooks`

**API constraints**:
- Session events (`session.created`, `session.idle`) go through the `event` hook
- `tool.execute.before/after` use `input.tool` (NOT `input.call.name`)
- `tool.execute.before` blocks via `throw new Error()`, modifies via `output.args`
- `tool.execute.before/after` only fire for primary agent (not subagents or MCP tools)
- Hooks cannot return `additionalContext` — use system transform hooks instead

**Logging**: `await client.app.log({ service: "name", level: "info"|"warn"|"error"|"debug", message: "..." })`

### Tool Names in Hooks

See [Tool Mapping (Canonical)](#tool-mapping-canonical) for the full mapping. In hooks, use the lowercase OpenCode name from the third column (e.g., `input.tool === "todowrite"`).

Claude Code v2.1.16+ replaced `TodoWrite`/`TodoRead` with `TaskCreate`/`TaskUpdate`/`TaskList`/`TaskGet` — all map to OpenCode's `todowrite`/`todoread`.

### Context Injection

| When | Hook | Target |
|------|------|--------|
| Session start | `experimental.chat.system.transform` | `output.system.push(...)` |
| During compaction | `experimental.session.compacting` | `output.context.push(...)` |

Unlike Claude Code, OpenCode hooks **cannot return additionalContext** from `tool.execute.after` or other hooks. Use the system transform hooks instead.

### What Cannot Be Converted

| Feature | Why | Workaround |
|---------|-----|------------|
| Stop blocking (synchronous) | `session.idle` cannot prevent stopping synchronously | Reactive simulation: detect idle → check conditions → `client.session.prompt` to resume (see [Stop Hook Simulation](#stop-hook-simulation)) |
| **PreToolUse blocking (subagents)** | `tool.execute.before` does not fire for subagent tool calls | Use agent-level tool permissions; `throw` in `tool.execute.before` works for primary agent only |
| SubagentStop (synchronous) | No cancellable "before subagent stops" hook | Reactive: detect child sessions via `session.created` + `parentID`, then prompt/abort (see [Subagent Activity Detection](#subagent-activity-detection)) |
| Subagent tool interception | `tool.execute.before/after` don't fire for subagent tool calls | Use agent-level tool permissions for enforcement; plugin hooks only for observability of parent session |
| MCP tool interception | MCP tool calls don't trigger hooks | Use MCP server-side logic |
| Python dependencies | Different runtime | Find TypeScript alternatives |
| additionalContext returns | Hooks cannot return additionalContext | Use system transform hooks |

OpenCode's `tool.execute.before` **can block** execution by throwing an error (no `output.abort` field — use `throw new Error(...)`). This hook **only fires for the primary agent** — subagent and MCP tool calls are not intercepted.

**Blocking approaches** (most to least granular):

| Approach | How | Scope |
|----------|-----|-------|
| Permission config | Declarative deny/ask/allow rules in `opencode.json` | System-wide |
| `permission.ask` hook | Set `output.status = "deny"` | Primary agent only |
| `tool.execute.before` | `throw new Error(...)` | Primary agent only |

For subagent enforcement, use agent-level tool permissions in frontmatter.

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

### Permission Config

OpenCode supports declarative permission rules in `opencode.json` that control tool access without writing plugin code. This is the most robust enforcement mechanism and applies system-wide.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "edit": "deny",
    "bash": {
      "*": "ask",
      "git *": "allow",
      "rm *": "deny"
    },
    "task": "deny"
  }
}
```

**Permission values:**
- `"allow"` — Always permit without prompting
- `"ask"` — Prompt user for confirmation (default)
- `"deny"` — Always block

**Key features:**
- Supports glob patterns for command-level granularity (e.g., `"git *": "allow"`)
- `"task": "deny"` prevents subagent spawning (useful to prevent "delegate-to-bypass" policy circumvention)
- Applies to all agents including subagents (unlike plugin hooks)

**Claude Code → OpenCode mapping:**

| Claude Code PreToolUse Pattern | OpenCode Permission Config |
|-------------------------------|---------------------------|
| Block specific tool entirely | `"toolname": "deny"` |
| Block specific commands | `"bash": { "rm *": "deny" }` |
| Prompt before dangerous ops | `"bash": { "*": "ask" }` |
| Allow safe operations | `"bash": { "git *": "allow" }` |
| Block subagent spawning | `"task": "deny"` |

### Stop Hook Simulation

OpenCode cannot synchronously block session idle. Simulate via reactive pattern:

1. Subscribe to `session.idle` via `event` hook
2. Evaluate stop conditions (dirty tree, failing tests, incomplete TODOs)
3. If work remains, call `client.session.prompt({ path: { id: sessionID }, body: { parts: [...] } })` to resume

**Guardrails** (prevent infinite loops):
- Per-session run limits and debounce intervals
- Deterministic checks (flaky tests cause oscillation)
- Logging via `client.app.log`

**Common conditions**: `git diff --name-only` non-empty, test runner exits non-zero, linter fails, `tsc --noEmit` fails

| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| Timing | Synchronous (blocks before idle) | Reactive (resumes after idle) |
| Veto stopping | Yes (`decision: "block"`) | No (goes idle, then resumes) |
| Loop safety | Built-in | Manual guardrails required |

### Subagent Activity Detection

OpenCode subagents run in child sessions. Detect via `session.created` events with `parentID`, react via `session.idle` for child sessions.

| Goal | Possible? | How |
|------|-----------|-----|
| Detect subagent spawning | ✅ | Watch `session.created` with `parentID` |
| React to subagent completion | ✅ | Watch `session.idle` for child sessions |
| Query child sessions | ✅ | `/session/:id/children` endpoint |
| Veto subagent spawning | ❌ | No cancellable "before subagent" hook |
| Intercept subagent tool calls | ❌ | Hooks don't fire for subagent calls |

**Enforcement**: Use agent-level tool permissions in frontmatter for security; plugin hooks for observability only.

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
Load the verify skill: skill({ name: "verify" })

Task completed successfully.
Load the done skill: skill({ name: "done" })
```

The `skill()` tool only accepts `name` — it loads the SKILL.md content into the conversation. Arguments must be placed in context before calling skill(), not passed to the tool.

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
Use `model: openai/gpt-5.2` for complex analysis
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
| `Skill\("[\w-]+:([\w-]+)",\s*"([^"]*)"\)` | `$2\n\nLoad the $1 skill: skill({ name: "$1" })` | With args - place args in context first |

The `skill()` tool does NOT accept arguments. When converting Skill() calls with arguments, place the argument text in context before the skill() call.

**Tool name replacements:** See [Tool Mapping (Canonical)](#tool-mapping-canonical).

**Other replacements:**
| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `\bopus\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `\bsonnet\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `\bhaiku\b` (in model context) | See [Model Mapping](#model-mapping) | |
| `Task tool with subagent_type` | `the <agent> agent` | Agent references |

### OpenCode Terminology (CLAUDE.md → AGENTS.md)

OpenCode uses different terminology for project instruction files:

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `CLAUDE.md` | `AGENTS.md` | Project-level AI instructions file |
| `~/.claude/CLAUDE.md` | `~/.config/opencode/AGENTS.md` | Global user instructions |

**Content transformations:**

| Find | Replace |
|------|---------|
| `CLAUDE.md` | `AGENTS.md` |
| `claude-md` (in names) | `agents-md` |
| `.claude/` (directory) | `.opencode/` |
| `~/.claude/` | `~/.config/opencode/` |

**File renaming:**

Files with "claude-md" in their name should be renamed to "agents-md":
- `review-claude-md-adherence.md` → `review-agents-md-adherence.md`
- `claude-md-adherence-reviewer.md` → `agents-md-adherence-reviewer.md`
- `update-claude-md.md` → `update-agents-md.md`

**Example content transformation:**

Claude Code:
```markdown
Check CLAUDE.md for project conventions.
Use the claude-md-adherence-reviewer agent.
```

OpenCode:
```markdown
Check AGENTS.md for project conventions.
Use the agents-md-adherence-reviewer agent.
```

---

## Model Mapping

This is the **canonical reference** for model ID conversion. All other sections reference this.

### Claude Code → OpenCode Model IDs

| Claude Code | OpenCode Full ID | Notes |
|-------------|------------------|-------|
| `opus` | `openai/gpt-5.2` | Agents get `reasoningEffort: xhigh` |
| `sonnet` | `anthropic/claude-sonnet-4-5-20250929` | |
| `haiku` | `anthropic/claude-haiku-4-5-20251001` | |

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

- Use `"type": "module"` for ESM format
- The `opencode` field describes the plugin type and hooks for npm registry metadata
- Add `@opencode-ai/plugin` dependency for TypeScript types
- This package.json is for npm publishing. OpenCode does NOT read it for discovery — files must be installed to `~/.config/opencode/` directories

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

### manifest-dev (formerly vibe-experimental)

**Note**: `define` and `do` are user-invocable but `define` has supporting files (`tasks/` directory). Both need thin command wrappers since OpenCode skills are not user-invocable.

| Skill | Type | → OpenCode |
|-------|------|------------|
| `define` | User-invocable (has tasks/) | `command/define.md` (wrapper) + `skill/define/SKILL.md` |
| `do` | User-invocable | `command/do.md` (wrapper) + `skill/do/SKILL.md` |
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

1. **Stop hooks that block synchronously**: `session.idle` cannot prevent stopping, but can reactively resume (see [Stop Hook Simulation](#stop-hook-simulation))
2. **SubagentStop hooks (synchronous)**: No cancellable hook, but can reactively detect child sessions and prompt/abort (see [Subagent Activity Detection](#subagent-activity-detection))
3. **Subagent tool interception**: `tool.execute.before/after` don't fire for subagent tool calls — use agent-level tool permissions for enforcement
4. **MCP tool interception**: MCP tool calls don't trigger hooks
5. **Complex Python deps**: Must find TypeScript alternatives
6. **Model auto-routing**: Claude Code uses Haiku for searches automatically

### Requires Manual Work

1. **Hook logic**: Python → TypeScript rewrite required
2. **External API calls in hooks**: Need TypeScript HTTP clients
3. **File system operations in hooks**: Use Bun/Node APIs

### Known Issues

1. **Skills calling skills**: Use `skill({ name: "skill-name" })` tool for non-user-invocable skills, `/command` for user-invocable ones
2. **Agent tool restrictions**: OpenCode tool permissions are more granular
3. **Context fork**: Claude Code `context: fork` needs testing in OpenCode

---

## Conversion Rules

### Resource Classification

For each resource in the source plugin, classify and transform:

| If resource is... | Then → |
|-------------------|--------|
| Skill with `user-invocable: false` | `skill/<name>/SKILL.md` |
| Skill referenced only via `Skill()` (not user-facing) | `skill/<name>/SKILL.md` |
| Skill with supporting files (subdirectories) | `command/<name>.md` (wrapper) + `skill/<name>/SKILL.md` |
| Skill (user-invocable, simple) | `command/<name>.md` |
| Agent | `agent/<name>.md` |
| Python hook | `plugin/hooks.ts` |
| `plugin.json` | `package.json` |

### Transformations by Type

**Commands** (from user-invocable skills):
- Remove `name:` from frontmatter (filename = command name)
- Convert `model:` to full ID
- Replace `Skill()` → `/command` or `skill({ name: "..." })`

**Skills** (from non-user-invocable skills):
- Keep `name:` in frontmatter
- Remove `user-invocable: false`

**Agents**:
- Remove `name:` from frontmatter
- Add `mode: subagent`
- Convert `tools:` comma list → permission object with booleans
- Add `question: false` for subagents
- Convert `model:` to full ID

**Hooks**:
- Convert Python → TypeScript
- Map hook types per [Event Mapping](#event-mapping)

**All content**:
- Replace `CLAUDE.md` → `AGENTS.md`
- Replace `claude-md` → `agents-md` in filenames and references
- Apply model ID conversions
- Apply tool name conversions

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
  read: true
  edit: true
  bash: true
---
```

### Content Transformations

**User-invocable skills (become commands):**

| Find | Replace (Source) | After Install |
|------|------------------|---------------|
| `Skill("plugin:foo")` | `/foo` | `/foo-<plugin>` |
| `Skill("plugin:foo", "args")` | `/foo args` | `/foo-<plugin> args` |

**Non-user-invocable skills (remain skills):**

| Find | Replace (Source) | After Install |
|------|------------------|---------------|
| `Skill("plugin:foo")` | `skill({ name: "foo" })` | `skill({ name: "foo-<plugin>" })` |
| `Skill("plugin:foo", "args")` | `args\n\nskill({ name: "foo" })` | `args\n\nskill({ name: "foo-<plugin>" })` |

The `skill()` tool only accepts `name` — no arguments parameter. Place arguments in context before the skill() call. The install script updates skill names to include the plugin postfix.

**Other transformations:**

| Find | Replace |
|------|---------|
| `model: opus/sonnet/haiku` | See [Model Mapping](#model-mapping) |
| `tools: Bash, Read, ...` | See [Tool Permission Mapping](#tool-permission-mapping) |

The install script adds `-<plugin>` postfix to command filenames. Skill directories also get postfixed (e.g., `skill/verify-<plugin>/SKILL.md`).

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
