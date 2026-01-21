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

### 4. Convert Hooks to TypeScript

If plugin.json has hooks, create `plugin/hooks.ts`:

```typescript
export default async ({ project, client }) => {
  return {
    // SessionStart → session.created
    "session.created": async () => {
      return { additionalContext: "<system-reminder>...</system-reminder>" };
    },

    // PostCompact → session.compacted
    "session.compacted": async () => {
      return { additionalContext: "..." };
    },

    // PostToolUse → tool.execute.after
    "tool.execute.after": async (event) => {
      if (event.tool !== "todo") return;
      // handle...
    },

    // PreToolUse → tool.execute.before (CANNOT BLOCK)
    "tool.execute.before": async (event) => {
      // Can only warn, cannot block tool execution
    },

    // Stop → session.idle (CANNOT BLOCK STOPPING)
    "session.idle": async () => {
      // Cannot prevent stopping in OpenCode
    },
  };
};
```

**Hook mapping:**
| Claude Code | OpenCode | Can Block? |
|-------------|----------|------------|
| SessionStart | session.created | N/A |
| PostCompact | session.compacted | N/A |
| PostToolUse | tool.execute.after | No |
| PreToolUse | tool.execute.before | **No** |
| Stop | session.idle | **No** |

### 5. Create package.json (per plugin)

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
    "command": "./command",
    "agent": "./agent",
    "skill": "./skill",
    "plugin": "./plugin"
  }
}
```

### 6. Create README.md

List commands, agents, skills.

## Reference

See `references/CONVERSION_GUIDE.md` for full specification.

## Output

```
<plugin>/
├── package.json
├── README.md
├── command/*.md
├── agent/*.md
├── skill/*/SKILL.md   (non-user-invocable only)
└── plugin/hooks.ts    (if source has hooks)
```
