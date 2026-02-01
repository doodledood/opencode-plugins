---
name: sync-plugins
description: Sync plugins from configured source repos to OpenCode format. Usage: /sync-plugins [repo:plugin...] or /sync-plugins --all
---

# Sync Plugins to OpenCode

Convert Claude Code plugins from multiple source repos to OpenCode format.

**Source of truth**:
- `references/CONVERSION_GUIDE.md` - ALL conversion rules
- `references/NOTES.md` - Lessons learned and special patterns (MUST READ)

## Source Repos Configuration

Read `references/REPOS.md` for the list of source repos and their plugins.

## Arguments

- `$ARGUMENTS`: Space-separated list of `repo:plugin` pairs, plugin names (searches all repos), or flags.
  - `vibe-workflow` → finds in any repo
  - `claude-code-plugins:vibe-workflow` → explicit repo
  - `manifest-dev:manifest-dev` → explicit repo
  - No args → sync all plugins from all repos

### Flags

- `--all`: Sync all plugins from all configured repos
- `--full`: Force full resync (skip changelog, do everything from scratch)
- `--repo=NAME`: Only sync from specified repo
- `--reasoning-effort[=LEVEL]`: Add `reasoningEffort` to agent frontmatter (`low`/`medium`/`high`/`xhigh`, default: `medium`)

## Workflow

### 1. Load Repo Config

1. **Read** `references/REPOS.md`
2. **Parse** the table to get repo configs
3. **Filter** by `--repo` flag if specified

### 2. For Each Repo

```bash
# Find or clone repo
REPO=""
for dir in <local-paths>; do
  [ -d "$dir" ] && cd "$dir" && git pull origin main && REPO="$dir" && break
done
[ -z "$REPO" ] && git clone <git-url> /tmp/<repo-name> && REPO=/tmp/<repo-name>
```

### 3. Identify Plugins to Sync

- If specific plugins requested: filter to those
- If `--all` or no args: sync all plugins listed for this repo
- Check changelog for incremental sync (unless `--full`)

### 4. For Each Plugin

1. **Read** source files from `$REPO/<plugins-dir>/<plugin>/`
2. **Apply** conversions per CONVERSION_GUIDE.md:
   - Remove `name:` from commands/agents (keep for skills)
   - Remove `user-invocable:` field
   - Convert `model:` to full ID (opus→openai/gpt-5.2, sonnet→anthropic/claude-sonnet-4-5-20250929)
   - Convert `tools:` comma list to boolean object
   - Add `mode: subagent` to agents
   - Replace `CLAUDE.md` → `AGENTS.md`
   - Replace `AskUserQuestion` → `question tool`
   - Replace `Skill("plugin:name")` → `/name` (commands) or `skill({ name: "name" })` (skills)
3. **Write** to `<plugin>/` in this repo

### 5. Report Changes

```
Synced from <repo>:

<plugin-name>:
  - <file>: <brief description of change>

Skipped (OpenCode limitations):
  - <description of hook changes that can't be ported>
```

## OpenCode Limitations

Document but don't attempt to sync:
- **Stop hook blocking**: OpenCode `session.idle` cannot prevent stops
- **PreToolUse blocking**: OpenCode `tool.execute.before` cannot abort execution
- **SubagentStop hooks**: No equivalent event in OpenCode
- **additionalContext returns**: Hooks cannot inject context mid-conversation

## Output Structure

```
<plugin>/
├── package.json
├── README.md
├── command/*.md
├── agent/*.md
├── skill/*/SKILL.md
└── plugin/hooks.ts
```
