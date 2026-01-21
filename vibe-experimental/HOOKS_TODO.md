# Hooks Conversion TODO

This plugin has hooks that need manual conversion from Python to TypeScript.

## Original Hooks (from plugin.json)

### Stop Hooks

1. **stop-do-hook** (matcher: *)
   - Purpose: Prevent premature stops during /do workflow when verification incomplete
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks stop-do-hook`
   - OpenCode equivalent: **CANNOT CONVERT** - OpenCode `session.idle` event cannot block stopping
   - Note: This is a blocking hook that prevents Claude from stopping. OpenCode does not support blocking hooks.

### PreToolUse Hooks

2. **pretool-escalate-hook** (matcher: Skill)
   - Purpose: Gate /escalate calls - require /verify before escalation
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks pretool-escalate-hook`
   - OpenCode equivalent: `tool.execute.before` event in `plugins/hooks.ts`
   - Note: Can intercept but cannot block tool execution in OpenCode

## Conversion Status

| Hook | Claude Code Event | OpenCode Event | Status |
|------|-------------------|----------------|--------|
| stop-do-hook | Stop | N/A | **Cannot convert** (blocking not supported) |
| pretool-escalate-hook | PreToolUse (Skill) | tool.execute.before | Partial (cannot block) |

## Next Steps

1. Review the Python hook implementations in the original repo's `hooks/` directory
2. Create `plugins/hooks.ts` with TypeScript equivalents where possible
3. Accept that stop-blocking and tool-blocking behavior cannot be replicated in OpenCode
4. Consider alternative approaches (e.g., validation in skill prompts instead of hooks)
