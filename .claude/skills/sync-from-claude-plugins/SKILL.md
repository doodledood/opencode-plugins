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

## Reasoning Effort (This Repo's Default)

When syncing plugins for this repo, **always** convert `model: opus` agents to:

```yaml
model: openai/gpt-5.2
reasoningEffort: xhigh
```

This applies to all plugins synced here (vibe-workflow, vibe-extras, manifest-dev, consultant, prompt-engineering, solo-dev, etc.). The `xhigh` reasoning effort matches the intent of using a high-capability model like opus.

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
if [ -z "$REPO" ]; then
  if [ -d "/tmp/<repo-name>" ]; then
    cd /tmp/<repo-name> && git pull origin main
  else
    git clone <git-url> /tmp/<repo-name>
  fi
  REPO=/tmp/<repo-name>
fi
```

### 3. Identify Plugins to Sync

- If specific plugins requested: filter to those
- If `--all` or no args: sync all plugins listed for this repo

### 4. For Each Plugin — Incremental Sync via SYNC.md

Each plugin directory has a `SYNC.md` tracking the last synced source commit (repo, path, commit hash, date).

**If `SYNC.md` exists and has a commit hash** (and `--full` not set):
1. `cd $REPO && git diff <last-commit>..HEAD -- <plugins-dir>/<plugin>/` to get changed files
2. If diff is empty → skip plugin ("already up to date")
3. If diff exists → read only the changed source files + their converted counterparts
4. Apply conversions to changed files only, write updates
5. Record new HEAD commit in `SYNC.md`

**If `SYNC.md` missing or `--full` flag set**:
1. Full sync — read all source files, apply all conversions, write everything
2. Create/update `SYNC.md` with current HEAD commit

This avoids reading and diffing every file on every sync.

### 5. Apply Conversions

For each file (changed or all):

1. **Read** source files from `$REPO/<plugins-dir>/<plugin>/`
2. **Apply** conversions per CONVERSION_GUIDE.md:
   - Remove `name:` from commands/agents (keep for skills)
   - Remove `user-invocable:` field
   - Convert `model: opus` → `model: openai/gpt-5.2` + `reasoningEffort: xhigh`
   - Convert `model: sonnet` → `model: anthropic/claude-sonnet-4-5-20250929`
   - Convert `model: haiku` → `model: anthropic/claude-haiku-4-5-20251001`
   - Convert `tools:` comma list to boolean object
   - Add `mode: subagent` to agents
   - Replace `CLAUDE.md` → `AGENTS.md`
   - Replace `AskUserQuestion` → `question tool`
   - Replace `Skill("plugin:name")` → `/name` (commands) or `skill({ name: "name" })` (skills)
3. **Write** to `<plugin>/` in this repo

### 6. Update SYNC.md

After successful sync, update `<plugin>/SYNC.md` with the current HEAD commit of the source repo. This is the last step — only written after all files are synced.

### 7. Report Changes

```
Synced from <repo>:

<plugin-name> (<old-commit>..<new-commit>):
  - <file>: <brief description of change>

Skipped (OpenCode limitations):
  - <description of hook changes that can't be ported>

Already up to date:
  - <plugin-name> (at <commit>)
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
