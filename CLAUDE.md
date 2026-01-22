# OpenCode Plugins

OpenCode-compatible ports of Claude Code plugins.

## Purpose

This repo converts and hosts Claude Code plugins in OpenCode format.

## Key Files

- `README.md` - Installation and usage
- `.claude/skills/sync-from-claude-plugins/SKILL.md` - Conversion skill
- `.claude/skills/sync-from-claude-plugins/references/CONVERSION_GUIDE.md` - **Complete conversion specification**

## Commands

```bash
# Convert all default plugins (vibe-workflow, vibe-extras, vibe-experimental)
/sync-from-claude-plugins

# Convert specific plugins
/sync-from-claude-plugins vibe-workflow consultant
```

## Structure After Conversion

```
<plugin>/
├── package.json      # npm manifest
├── commands/*.md     # User-invocable slash commands
├── skills/*/SKILL.md # Non-user-invocable skills (if any)
├── agents/*.md       # Subagent definitions
└── README.md
```

## Conventions

- User-invocable skills → `commands/` (flat `.md` files)
- Non-user-invocable skills → `skills/` (directory with `SKILL.md`)
- Agents → `agents/` (same as Claude Code)
- Hooks → `plugins/` (TypeScript, manual conversion needed)
