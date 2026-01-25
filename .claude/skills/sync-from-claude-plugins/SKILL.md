---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: all available plugins)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins to OpenCode format.

**Source of truth**: `references/CONVERSION_GUIDE.md` contains ALL conversion rules. Refer to it during conversion.

## Arguments

- `$ARGUMENTS`: Plugin names and flags (space-separated). If no plugins specified, uses changelog to determine what changed.

### Flags

- `--full`: Force full resync of all plugins (skip changelog, do everything from scratch)
- `--reasoning-effort[=LEVEL]`: Add `reasoningEffort` to agent frontmatter (`low`/`medium`/`high`/`xhigh`, default: `medium`)

## Workflow

### 1. Locate Source Repo

```bash
REPO=""
for dir in ~/Documents/Projects/claude-code-plugins ~/Lemonade/claude-code-plugins /tmp/claude-code-plugins; do
  [ -d "$dir" ] && cd "$dir" && git pull origin main && REPO="$dir" && break
done
[ -z "$REPO" ] && git clone https://github.com/doodledood/claude-code-plugins.git /tmp/claude-code-plugins && REPO=/tmp/claude-code-plugins
```

### 2. Check Changelog (Default Mode)

Unless `--full` flag is passed:

1. **Read** `$REPO/CHANGELOG.md`
2. **Find** `[Unreleased]` section entries for requested plugins (or all if none specified)
3. **Parse** each entry to understand:
   - Which plugin changed (e.g., `[vibe-experimental]`)
   - What changed (skill names, agent names, hooks)
   - Nature of change (new feature, refactor, fix)
4. **Identify** specific files to sync based on changelog entries
5. **Skip** hook-only changes if they involve blocking behavior (OpenCode limitation)

Example changelog parsing:
```
- [vibe-experimental] v0.24.5 - manifest-verifier: Rewrite with principles-based gap detection
  → Sync: agent/manifest-verifier.md

- [vibe-experimental] v0.24.3 - /define, /do: Surface logging discipline
  → Sync: command/define.md, command/do.md (or skill/ paths in source)

- [vibe-workflow] v2.17.2 - Stop hook: Allow stops on API errors
  → Skip: OpenCode cannot block stops (document limitation only)
```

### 3. Targeted Sync

For each identified file:

1. **Read** source file from `$REPO/claude-plugins/<plugin>/`
2. **Read** corresponding OpenCode file (if exists)
3. **Compare** and identify actual differences
4. **Apply** conversions per CONVERSION_GUIDE.md:
   - Remove `name:` from commands/agents (keep for skills)
   - Remove `user-invocable:` field
   - Convert `model:` to full ID (opus→openai/gpt-5.2, sonnet→anthropic/claude-sonnet-4-5-20250929)
   - Convert `tools:` comma list to boolean object
   - Add `mode: subagent` to agents
   - Replace `CLAUDE.md` → `AGENTS.md`
   - Replace `AskUserQuestion` → `question tool`
   - Replace `Skill("plugin:name")` → `/name` (commands) or `skill({ name: "name" })` (skills)
5. **Write** updated file

### 4. Full Sync (--full flag only)

If `--full` flag passed, use original workflow:

1. Read `references/CONVERSION_GUIDE.md` completely
2. Bulk copy all files using `scripts/bulk_copy.sh`
3. Transform using `scripts/transform.py`
4. Convert hooks to TypeScript
5. Create/update package.json and README.md
6. Validate all files

### 5. Report Changes

Output summary:
```
Synced from claude-code-plugins:

<plugin-name>:
  - <file>: <brief description of change>
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

## Output

```
<plugin>/
├── package.json
├── README.md
├── command/*.md
├── agent/*.md
├── skill/*/SKILL.md
└── plugin/hooks.ts
```
