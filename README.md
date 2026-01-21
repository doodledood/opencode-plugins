# OpenCode Plugins

OpenCode-compatible ports of Claude Code plugins from [doodledood/claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Installation

OpenCode discovers commands, agents, skills, and plugins from flat directories:
- `~/.config/opencode/command/*.md` - Slash commands
- `~/.config/opencode/agent/*.md` - Subagents
- `~/.config/opencode/skill/*/SKILL.md` - Non-user-invocable skills
- `~/.config/opencode/plugin/*.ts` - Hook plugins

This repo contains multiple plugins as subdirectories. The install script copies their contents to the appropriate locations.

### Quick Install (All Plugins)

```bash
# Clone and install all plugins
git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins && \
/tmp/opencode-plugins/install.sh
```

### Install Specific Plugins

Use the `OPENCODE_PLUGINS` environment variable to select which plugins to install:

```bash
# Install only vibe-workflow
OPENCODE_PLUGINS="vibe-workflow" /tmp/opencode-plugins/install.sh

# Install vibe-workflow and vibe-extras (no vibe-experimental)
OPENCODE_PLUGINS="vibe-workflow vibe-extras" /tmp/opencode-plugins/install.sh
```

### Update Existing Installation

```bash
# Pull latest and reinstall
cd /tmp/opencode-plugins && git pull && ./install.sh

# Or one-liner:
[ -d /tmp/opencode-plugins ] && git -C /tmp/opencode-plugins pull || \
git clone https://github.com/doodledood/opencode-plugins.git /tmp/opencode-plugins && \
/tmp/opencode-plugins/install.sh
```

### Project-Level Installation

Install to a specific project instead of globally:

```bash
OPENCODE_CONFIG_DIR=".opencode" /tmp/opencode-plugins/install.sh
```

### What the Install Script Does

1. Creates directories if needed: `command/`, `agent/`, `skill/`, `plugin/`
2. For each selected plugin, copies:
   - `<plugin>/command/*.md` → `~/.config/opencode/command/`
   - `<plugin>/agent/*.md` → `~/.config/opencode/agent/`
   - `<plugin>/skill/*/` → `~/.config/opencode/skill/`
   - `<plugin>/plugin/*.ts` → `~/.config/opencode/plugin/`
3. Preserves existing files (no overwrites by default, use `FORCE=1` to overwrite)

## Available Plugins

| Plugin | Description | Commands | Agents |
|--------|-------------|----------|--------|
| `vibe-workflow` | Planning, implementation, and review workflows | 17 | 12 |
| `vibe-extras` | Slop cleaning, git helpers, CLAUDE.md management | 4 | 1 |
| `vibe-experimental` | Define/do/verify workflow | 2 commands + 3 skills | 9 |

### vibe-workflow Commands

| Command | Description |
|---------|-------------|
| `/review` | Run all code review agents in parallel |
| `/plan` | Create implementation plans via iterative research |
| `/spec` | Requirements discovery through structured interview |
| `/implement` | Execute plans via subagents with verification |
| `/implement-inplace` | Single-agent implementation without subagents |
| `/explore-codebase` | Find files relevant to a query |
| `/research-web` | Deep web research with parallel investigators |
| `/bugfix` | Investigate and fix bugs systematically |
| `/review-bugs` | Audit code for logical bugs |
| `/review-coverage` | Verify test coverage for changes |
| `/review-maintainability` | Audit for DRY violations, dead code |
| `/review-simplicity` | Audit for over-engineering |
| `/review-testability` | Audit for testability issues |
| `/review-type-safety` | Audit TypeScript for type safety |
| `/review-docs` | Audit documentation accuracy |
| `/review-claude-md-adherence` | Check CLAUDE.md compliance |
| `/fix-review-issues` | Fix issues found by /review |

### vibe-extras Commands

| Command | Description |
|---------|-------------|
| `/clean-slop` | Remove AI-generated code slop |
| `/rebase-on-main` | Rebase current branch on main |
| `/rewrite-history` | Interactive git history rewriting |
| `/update-claude-md` | Update CLAUDE.md with project changes |

### vibe-experimental Commands

| Command | Description |
|---------|-------------|
| `/define` | Define acceptance criteria for a task |
| `/do` | Execute task with verification loop |

## Uninstall

To remove installed commands/agents, delete the files:

```bash
# Remove all vibe-workflow commands
rm ~/.config/opencode/command/{review,plan,spec,implement,implement-inplace,explore-codebase,research-web,bugfix,review-*,fix-review-issues}.md

# Or remove everything and reinstall fresh
rm -rf ~/.config/opencode/{command,agent,skill,plugin}
```

## Converting Plugins (For Developers)

This repo includes a Claude Code skill to automatically convert plugins:

```bash
# In Claude Code, from this repo:
/sync-from-claude-plugins

# Convert specific plugins:
/sync-from-claude-plugins vibe-workflow vibe-extras
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
# You should see /review, /plan, etc.
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

2. Ensure files have `.md` extension

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
