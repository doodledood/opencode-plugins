---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert specified plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: vibe-workflow vibe-extras vibe-experimental)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins to OpenCode format.

## Arguments

- `$ARGUMENTS`: Plugin names (space-separated), default: `vibe-workflow vibe-extras vibe-experimental`

## Execution

### 1. Locate Source Repo

```bash
REPO=""
for dir in ~/Documents/Projects/claude-code-plugins ~/Lemonade/claude-code-plugins /tmp/claude-code-plugins; do
  [ -d "$dir" ] && cd "$dir" && git pull origin main && REPO="$dir" && break
done
[ -z "$REPO" ] && git clone https://github.com/doodledood/claude-code-plugins.git /tmp/claude-code-plugins && REPO=/tmp/claude-code-plugins
```

### 2. Bulk Copy (per plugin)

```bash
SCRIPTS="${CLAUDE_SKILL_ROOT}/scripts"
for PLUGIN in vibe-workflow vibe-extras vibe-experimental; do
  "$SCRIPTS/bulk_copy.sh" "$REPO" "$PLUGIN"
done
```

### 3. Transform Files

```bash
python3 "${CLAUDE_SKILL_ROOT}/scripts/transform.py"
```

### 4. Create package.json (per plugin)

Read `.claude-plugin/plugin.json` and create `package.json`:

```json
{
  "name": "opencode-<plugin-name>",
  "version": "<from plugin.json>",
  "description": "<from plugin.json>",
  "author": "<name> <<email>>",
  "license": "MIT",
  "keywords": ["opencode", "opencode-plugin", ...],
  "opencode": {
    "commands": "./commands",
    "agents": "./agents",
    "skills": "./skills"
  }
}
```

### 5. Create HOOKS_TODO.md (if hooks in plugin.json)

Document hook conversion status:
- SessionStart → session.created (needs TypeScript)
- PreToolUse → tool.execute.before (needs TypeScript)
- PostToolUse → tool.execute.after (needs TypeScript)
- Stop (blocking) → **CANNOT CONVERT**

### 6. Create README.md

List commands, agents, skills, and hook status.

## Reference

See `references/CONVERSION_GUIDE.md` for full specification.

## Output

```
<plugin>/
├── package.json
├── README.md
├── HOOKS_TODO.md      (if hooks)
├── commands/*.md
├── agents/*.md
└── skills/*/SKILL.md  (non-user-invocable only)
```
