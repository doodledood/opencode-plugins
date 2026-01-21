# OpenCode Plugins

OpenCode-compatible ports of Claude Code plugins from [doodledood/claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Installation

### Recommended: Clone to Global Plugins Directory

```bash
# Install or update
[ -d ~/.config/opencode/plugins/opencode-plugins ] && git -C ~/.config/opencode/plugins/opencode-plugins pull || git clone https://github.com/doodledood/opencode-plugins.git ~/.config/opencode/plugins/opencode-plugins
```

OpenCode auto-discovers plugins from `~/.config/opencode/plugins/`. No config changes needed.

### Alternative: Project-Level

Clone to your project's `.opencode/plugins/`:

```bash
git clone https://github.com/doodledood/opencode-plugins.git .opencode/plugins/opencode-plugins
```

### Alternative: npm Package (when published)

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["opencode-vibe-workflow"]
}
```

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

## Converting Plugins

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
| PreToolUse hook | Python | TypeScript | ✅ Full |
| PostToolUse hook | Python | TypeScript | ✅ Full |
| Stop hook (blocking) | Python | N/A | ❌ Cannot convert |
| MCP servers | Yes | Yes | ✅ Full |
| `$ARGUMENTS` | Yes | Yes | ✅ Full |
| Positional args | No | `$1`, `$2` | ✅+ Better |

## Repository Structure

```
opencode-plugins/
├── README.md                                    # This file
├── CLAUDE.md                                    # Project context
├── .claude/skills/sync-from-claude-plugins/     # Conversion skill
│   ├── SKILL.md
│   └── references/
│       └── CONVERSION_GUIDE.md                  # Complete spec
├── vibe-workflow/                               # Converted plugin
│   ├── package.json
│   ├── commands/
│   │   ├── review.md
│   │   ├── plan.md
│   │   └── ...
│   ├── agents/
│   │   ├── bug-fixer.md
│   │   └── ...
│   └── README.md
├── vibe-extras/
└── vibe-experimental/
```

## Verifying Installation

After installing, verify commands are available:

```bash
# Start OpenCode
opencode

# Type / to see available commands
# You should see /review, /plan, etc.
```

## Troubleshooting

### Commands not appearing

1. Check files are in correct location:
   ```bash
   ls ~/.config/opencode/commands/
   ```

2. Ensure files have `.md` extension

3. Restart OpenCode

### Agents not spawning

1. Verify agent files exist:
   ```bash
   ls ~/.config/opencode/agents/
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
