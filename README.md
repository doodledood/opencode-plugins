# OpenCode Plugins

OpenCode-compatible ports of Claude Code plugins from [doodledood/claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Terminology

**Important**: OpenCode doesn't have a "plugin bundle" concept like Claude Code. In OpenCode:
- **Commands** (`command/*.md`) - Slash commands the user invokes
- **Agents** (`agent/*.md`) - Subagents that can be spawned
- **Skills** (`skill/*/SKILL.md`) - Non-user-invocable prompts loaded by agents
- **Hooks** (`plugin/*.ts`) - TypeScript event handlers (confusingly called "plugins" in OpenCode)

This repo organizes related commands/agents/skills/hooks into directories we call "plugins" for convenience, but they're just bundles that get installed to OpenCode's flat directory structure.

## Installation

OpenCode discovers resources from flat directories:
- `~/.config/opencode/command/*.md` - Slash commands
- `~/.config/opencode/agent/*.md` - Subagents
- `~/.config/opencode/skill/*/SKILL.md` - Non-user-invocable skills
- `~/.config/opencode/plugin/*.ts` - Hooks (event handlers)

The install script copies contents to these locations, **postfixing filenames with the plugin name** to avoid collisions:
- `review.md` → `review-vibe-workflow.md` → `/review-vibe-workflow`

### Quick Install (Default Plugins)

```bash
# Clone/pull and install default plugins (manifest-dev, vibe-extras)
([ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins) && /tmp/opencode-plugins/install.sh
```

### Install All Plugins

```bash
# Clone/pull and install all available plugins
([ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins) && OPENCODE_PLUGINS=all /tmp/opencode-plugins/install.sh
```

### Install Specific Plugins

Pass plugin names as arguments (comma or space-separated):

```bash
# Install only vibe-workflow
/tmp/opencode-plugins/install.sh vibe-workflow

# Install multiple plugins (comma-separated)
/tmp/opencode-plugins/install.sh vibe-workflow,consultant

# Or use environment variable
OPENCODE_PLUGINS="vibe-workflow,consultant" /tmp/opencode-plugins/install.sh
```

### Shell Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Sync default plugins (manifest-dev, vibe-extras)
alias opencode-sync='([ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins) && /tmp/opencode-plugins/install.sh'

# Sync all plugins
alias opencode-sync-all='([ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins) && OPENCODE_PLUGINS=all /tmp/opencode-plugins/install.sh'
```

### Update Existing Installation

```bash
# Pull latest and reinstall
cd /tmp/opencode-plugins && git pull && ./install.sh

# Or one-liner (all plugins):
([ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins) && OPENCODE_PLUGINS=all /tmp/opencode-plugins/install.sh
```

### Project-Level Installation

Install to a specific project instead of globally:

```bash
OPENCODE_CONFIG_DIR=".opencode" /tmp/opencode-plugins/install.sh
```

### What the Install Script Does

The script performs a **full sync** for each plugin:

1. **Cleans** existing files for the plugin (detected by `-<plugin>` postfix)
2. **Copies** fresh files with plugin postfix:
   - `review.md` → `review-vibe-workflow.md`
   - `bug-fixer.md` → `bug-fixer-vibe-workflow.md`
3. **Updates** `name:` fields in files to match new filenames

This sync behavior ensures:
- **Additions**: New files are copied
- **Updates**: Changed files are replaced
- **Deletions**: Removed files are cleaned up
- **Isolation**: Each plugin's files are independent (syncing one doesn't affect others)

## Available Plugins

Each plugin directory contains a `README.md` with detailed documentation. Browse the directories in this repo or see below for a summary.

After installation, commands are available as `/<command>-<plugin>` (e.g., `/review-vibe-workflow`).

| Plugin | Description |
|--------|-------------|
| `vibe-workflow` | Planning, implementation, and review workflows |
| `vibe-extras` | Slop cleaning, git helpers, CLAUDE.md management |
| `vibe-experimental` | Define/do/verify workflow with acceptance criteria |
| `consultant` | Expert consulting and code analysis |
| `prompt-engineering` | Prompt optimization and review tools |
| `solo-dev` | Brand, design, UX, and content tools for solo devs |
| `frontend-design` | Frontend design patterns |
| `life-ops` | Decision-making framework |

## Uninstall

Remove installed files by plugin:

```bash
# Remove all vibe-workflow files
rm ~/.config/opencode/command/*-vibe-workflow.md
rm ~/.config/opencode/agent/*-vibe-workflow.md
rm ~/.config/opencode/plugin/vibe-workflow-*.ts

# Or remove everything and reinstall fresh
rm -rf ~/.config/opencode/{command,agent,skill,plugin}
```

## Converting Plugins (For Developers)

This repo includes a Claude Code skill to automatically convert plugins:

```bash
# In Claude Code, from this repo:
/sync-from-claude-plugins              # Convert ALL available plugins

# Convert specific plugins:
/sync-from-claude-plugins vibe-workflow,vibe-extras
```

### Conversion Guide

See the comprehensive conversion specification:
- [.claude/skills/sync-from-claude-plugins/references/CONVERSION_GUIDE.md](.claude/skills/sync-from-claude-plugins/references/CONVERSION_GUIDE.md)

## Feature Parity with Claude Code

| Feature | Claude Code | OpenCode | Status |
|---------|-------------|----------|--------|
| Slash commands | Skills | Commands | ✅ Full |
| Non-user-invocable skills | Skills | Skills | ✅ Full |
| Agents/subagents | Agents | Agents | ✅ Full |
| SessionStart hook | Python | TypeScript | ✅ Full |
| PreToolUse hook | Python | TypeScript | ✅ Full (can block via `output.abort`) |
| PostToolUse hook | Python | TypeScript | ✅ Full |
| Stop hook (blocking) | Python | N/A | ❌ Cannot block stopping |
| MCP servers | Yes | Yes | ✅ Full |
| `$ARGUMENTS` | Yes | Yes | ✅ Full |
| Positional args | No | `$1`, `$2` | ✅+ Better |

## Repository Structure

```
opencode-plugins/
├── README.md                                    # This file
├── install.sh                                   # Installation script
├── CLAUDE.md                                    # Project context
├── .claude/skills/sync-from-claude-plugins/    # Conversion skill
│   ├── SKILL.md
│   └── references/
│       └── CONVERSION_GUIDE.md                  # Complete spec
│
└── <plugin>/                                    # Each plugin directory
    ├── package.json                             # Plugin metadata
    ├── README.md                                # Plugin documentation
    ├── command/                                 # User-invocable commands
    │   └── <command>.md
    ├── agent/                                   # Subagent definitions (optional)
    │   └── <agent>.md
    ├── skill/                                   # Non-user-invocable skills (optional)
    │   └── <skill>/
    │       └── SKILL.md
    └── plugin/                                  # TypeScript hooks (optional)
        └── hooks.ts
```

### Installed Structure

After running `install.sh`, files are copied to:

```
~/.config/opencode/
├── command/
│   └── <command>-<plugin>.md          # /command-plugin
├── agent/
│   └── <agent>-<plugin>.md
├── skill/
│   └── <skill>-<plugin>/
│       └── SKILL.md
└── plugin/
    └── <plugin>-hooks.ts
```

## Verifying Installation

After installing, verify commands are available:

```bash
# Start OpenCode
opencode

# Type / to see available commands
# You should see /review-vibe-workflow, /plan-vibe-workflow, etc.
```

Or check files directly:

```bash
ls ~/.config/opencode/command/
ls ~/.config/opencode/agent/
```

## Troubleshooting

### Commands not appearing

1. Check files are in correct location:
   ```bash
   ls ~/.config/opencode/command/
   ```

2. Ensure files have `.md` extension and correct postfix

3. Restart OpenCode

### Agents not spawning

1. Verify agent files exist:
   ```bash
   ls ~/.config/opencode/agent/
   ```

2. Check frontmatter has `mode: subagent`

### Model errors

OpenCode requires full model IDs. If you see model errors, ensure the converted files use:
- `openai/gpt-5.2` (not `opus`)
- `anthropic/claude-sonnet-4-5-20250929` (not `sonnet`)

## Contributing

1. Run `/sync-from-claude-plugins` to convert latest
2. Review converted files
3. Test commands and agents
4. Submit PR

## License

MIT - Same as source plugins
