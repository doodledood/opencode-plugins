---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: all available plugins)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins to OpenCode format.

## Arguments

- `$ARGUMENTS`: Plugin names (comma or space-separated). If empty, discovers and converts ALL plugins from the source repo.

## Execution

### 1. Locate Source Repo

```bash
REPO=""
for dir in ~/Documents/Projects/claude-code-plugins ~/Lemonade/claude-code-plugins /tmp/claude-code-plugins; do
  [ -d "$dir" ] && cd "$dir" && git pull origin main && REPO="$dir" && break
done
[ -z "$REPO" ] && git clone https://github.com/doodledood/claude-code-plugins.git /tmp/claude-code-plugins && REPO=/tmp/claude-code-plugins
```

### 2. Discover Plugins

If no plugins specified, discover all available plugins:

```bash
# Find all directories with .claude-plugin/plugin.json
PLUGINS=""
for dir in "$REPO"/claude-plugins/*/; do
  [ -d "$dir" ] || continue
  [ -f "$dir/.claude-plugin/plugin.json" ] && PLUGINS="$PLUGINS $(basename "$dir")"
done
echo "Available plugins: $PLUGINS"
```

If `$ARGUMENTS` is provided, use those instead (normalize commas to spaces).

### 3. Bulk Copy (per plugin)

```bash
SCRIPTS="${CLAUDE_SKILL_ROOT}/scripts"
for PLUGIN in $PLUGINS; do
  "$SCRIPTS/bulk_copy.sh" "$REPO" "$PLUGIN"
done
```

### 4. Transform Files

```bash
python3 "${CLAUDE_SKILL_ROOT}/scripts/transform.py"
```

### 5. Convert Hooks to TypeScript

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

    // PreToolUse → tool.execute.before (CAN BLOCK via output.abort)
    "tool.execute.before": async (input, output) => {
      // Block via: output.abort = "reason";
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
| PreToolUse | tool.execute.before | **Yes** (via `output.abort`) |
| Stop | session.idle | **No** |

### 6. Create package.json (per plugin)

Read `.claude-plugin/plugin.json` and create `package.json`:

```json
{
  "name": "opencode-<plugin-name>",
  "version": "<from plugin.json>",
  "description": "<from plugin.json>",
  "author": "<name> <<email>>",
  "type": "module",
  "license": "MIT",
  "keywords": ["opencode", "opencode-plugin", ...],
  "opencode": {
    "type": "plugin",
    "hooks": ["session.created", "tool.execute.before"]
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.162"
  }
}
```

**Note**: This package.json is for npm publishing metadata. OpenCode does NOT read it for discovery - files must be installed to `~/.config/opencode/` via `install.sh`.

### 7. Create README.md

List commands, agents, skills for each plugin.

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

## Installation

After conversion, run the install script to copy to OpenCode config:

```bash
./install.sh                    # Install all plugins
./install.sh vibe-workflow      # Install specific plugin
./install.sh plugin1,plugin2    # Install multiple (comma-separated)
```

Files are postfixed with plugin name to avoid collisions:
- `review.md` → `review-vibe-workflow.md` → `/review-vibe-workflow`
