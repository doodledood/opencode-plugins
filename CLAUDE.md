# OpenCode Plugins

OpenCode-compatible ports of Claude Code plugins.

## Structure

- `vibe-workflow/` - Main workflow plugin (commands + agents)
- `vibe-extras/` - Extra utilities
- `vibe-experimental/` - Experimental features
- `CONVERSION_GUIDE.md` - How to convert Claude Code → OpenCode

## Commands

```bash
# Sync/convert plugins from claude-code-plugins repo
/sync-from-claude-plugins [plugin-names...]
```

## Conventions

- Commands go in `<plugin>/commands/*.md`
- Agents go in `<plugin>/agents/*.md`
- Each plugin has its own `package.json`
