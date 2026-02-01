# Conversion Notes

Lessons learned during conversion. Read alongside CONVERSION_GUIDE.md.

## Model Mapping: Opus → GPT-5.2

When converting `model: opus` agents:
- Map to `model: openai/gpt-5.2`
- Add `reasoningEffort: xhigh`

## Dual Invocability Pattern

**Pattern**: `command/X.md` + `skill/_X/SKILL.md`

In Claude Code, `_define` and `define` were separate skills. In OpenCode:
- `command/define.md` - user invokes `/define`
- `skill/_define/SKILL.md` - model invokes `skill({ name: "_define" })`

The command is a thin wrapper:
```yaml
---
description: 'Description'
---

Use the skill tool: skill({ name: "_define", arguments: "$ARGUMENTS" })
```

Keep the underscore prefix on skills to match the source repo pattern.

## Tool Name Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `AskUserQuestion` | `question` |
| `TodoWrite` | `todowrite` |
| `TaskCreate` | `todowrite` |
