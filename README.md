# OpenCode Plugins

OpenCode-compatible versions of popular Claude Code plugins.

## Available Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| vibe-workflow | Ship high-quality code faster with less back-and-forth | Pending |
| vibe-extras | Extra utilities and helpers | Pending |
| vibe-experimental | Experimental features and workflows | Pending |

## Installation

### From npm (when published)

```json
// opencode.json
{
  "plugin": ["opencode-vibe-workflow"]
}
```

### From GitHub

```json
// opencode.json
{
  "plugin": ["github:doodledood/opencode-plugins/vibe-workflow"]
}
```

### Global Installation

Place in `~/.config/opencode/`:
- Commands: `~/.config/opencode/commands/`
- Agents: `~/.config/opencode/agents/`

### Project-Level

Place in `.opencode/`:
- Commands: `.opencode/commands/`
- Agents: `.opencode/agents/`

## Converting from Claude Code

This repo includes a Claude Code skill to automatically convert plugins:

```bash
# In Claude Code, from this repo:
/sync-from-claude-plugins

# Convert specific plugins:
/sync-from-claude-plugins vibe-workflow vibe-extras
```

See [CONVERSION_GUIDE.md](./CONVERSION_GUIDE.md) for manual conversion details.

## Feature Parity

| Feature | Claude Code | OpenCode | Notes |
|---------|-------------|----------|-------|
| Slash commands (skills) | Yes | Yes | Full parity |
| Agents/subagents | Yes | Yes | Full parity |
| Event hooks | Python | TypeScript | Requires rewrite |
| MCP servers | Yes | Yes | Full parity |
| Model routing | Auto Haiku | Manual | Different |

## Structure

```
opencode-plugins/
├── CONVERSION_GUIDE.md      # How to convert plugins
├── README.md
├── vibe-workflow/           # Converted plugin
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
│   └── ...
└── vibe-experimental/
    └── ...
```

## Contributing

1. Use `/sync-from-claude-plugins` to convert latest
2. Review and test converted files
3. Manually port hooks if needed
4. Submit PR

## License

MIT - Same as source plugins
