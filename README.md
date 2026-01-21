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

### Quick Install (All Plugins)

```bash
# Clone and install all plugins
git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins && \
/tmp/opencode-plugins/install.sh
```

### Install Specific Plugins

Pass plugin names as arguments (comma or space-separated):

```bash
# Install only vibe-workflow
/tmp/opencode-plugins/install.sh vibe-workflow

# Install multiple plugins (comma-separated)
/tmp/opencode-plugins/install.sh vibe-workflow,vibe-extras

# Or use environment variable
OPENCODE_PLUGINS="vibe-workflow,vibe-extras" /tmp/opencode-plugins/install.sh
```

### Update Existing Installation

```bash
# Pull latest and reinstall (FORCE=1 overwrites existing)
cd /tmp/opencode-plugins && git pull && FORCE=1 ./install.sh

# Or one-liner:
[ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || \
git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins && \
FORCE=1 /tmp/opencode-plugins/install.sh
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

| Plugin | Description | Commands | Agents |
|--------|-------------|----------|--------|
| `vibe-workflow` | Planning, implementation, and review workflows | 17 | 12 |
| `vibe-extras` | Slop cleaning, git helpers, CLAUDE.md management | 4 | 1 |
| `vibe-experimental` | Define/do/verify workflow | 2 commands + 3 skills | 9 |

### vibe-workflow Commands

After installation, commands are available as `/command-vibe-workflow`:

| Command | Description |
|---------|-------------|
| `/review-vibe-workflow` | Run all code review agents in parallel |
| `/plan-vibe-workflow` | Create implementation plans via iterative research |
| `/spec-vibe-workflow` | Requirements discovery through structured interview |
| `/implement-vibe-workflow` | Execute plans via subagents with verification |
| `/implement-inplace-vibe-workflow` | Single-agent implementation without subagents |
| `/explore-codebase-vibe-workflow` | Find files relevant to a query |
| `/research-web-vibe-workflow` | Deep web research with parallel investigators |
| `/bugfix-vibe-workflow` | Investigate and fix bugs systematically |
| `/review-bugs-vibe-workflow` | Audit code for logical bugs |
| `/review-coverage-vibe-workflow` | Verify test coverage for changes |
| `/review-maintainability-vibe-workflow` | Audit for DRY violations, dead code |
| `/review-simplicity-vibe-workflow` | Audit for over-engineering |
| `/review-testability-vibe-workflow` | Audit for testability issues |
| `/review-type-safety-vibe-workflow` | Audit TypeScript for type safety |
| `/review-docs-vibe-workflow` | Audit documentation accuracy |
| `/review-claude-md-adherence-vibe-workflow` | Check CLAUDE.md compliance |
| `/fix-review-issues-vibe-workflow` | Fix issues found by /review |

### vibe-extras Commands

| Command | Description |
|---------|-------------|
| `/clean-slop-vibe-extras` | Remove AI-generated code slop |
| `/rebase-on-main-vibe-extras` | Rebase current branch on main |
| `/rewrite-history-vibe-extras` | Interactive git history rewriting |
| `/update-claude-md-vibe-extras` | Update CLAUDE.md with project changes |

### vibe-experimental Commands

| Command | Description |
|---------|-------------|
| `/define-vibe-experimental` | Define acceptance criteria for a task |
| `/do-vibe-experimental` | Execute task with verification loop |

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
├── vibe-workflow/                               # Plugin: workflow tools
│   ├── package.json                             # Plugin metadata
│   ├── command/*.md                             # Slash commands
│   ├── agent/*.md                               # Subagents
│   └── plugin/hooks.ts                          # TypeScript hooks
├── vibe-extras/                                 # Plugin: git utilities
│   ├── command/*.md
│   └── agent/*.md
└── vibe-experimental/                           # Plugin: define/do/verify
    ├── command/*.md
    ├── agent/*.md
    ├── skill/*/SKILL.md                         # Non-user-invocable skills
    └── plugin/hooks.ts
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
- `anthropic/claude-opus-4-5-20251101` (not `opus`)
- `anthropic/claude-sonnet-4-5-20250929` (not `sonnet`)

## Contributing

1. Run `/sync-from-claude-plugins` to convert latest
2. Review converted files
3. Test commands and agents
4. Submit PR

## License

MIT - Same as source plugins
