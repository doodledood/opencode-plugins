# Hooks Conversion TODO

This plugin has hooks that need manual conversion from Python to TypeScript.

## Original Hooks (from plugin.json)

### SessionStart Hooks

1. **session-start-reminder**
   - Purpose: Inject session-start reminders for vibe-workflow best practices
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks session-start-reminder`
   - OpenCode equivalent: `session.created` event in `plugins/hooks.ts`

2. **post-compact-hook** (matcher: compact)
   - Purpose: Re-anchor session after compaction with reminders and implement workflow recovery
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks post-compact-hook`
   - OpenCode equivalent: `session.compacted` event in `plugins/hooks.ts`

### Stop Hooks

3. **stop-todo-enforcement** (matcher: *)
   - Purpose: Prevent premature stops during /implement and /implement-inplace workflows when todos are incomplete
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks stop-todo-enforcement`
   - OpenCode equivalent: **CANNOT CONVERT** - OpenCode `session.idle` event cannot block stopping
   - Note: This is a blocking hook that prevents Claude from stopping. OpenCode does not support blocking hooks.

### PostToolUse Hooks

4. **post-todo-write-hook** (matcher: TodoWrite)
   - Purpose: Remind to update progress/log files after todo completion during implement workflows
   - Command: `uvx --from ${CLAUDE_PLUGIN_ROOT}/hooks post-todo-write-hook`
   - OpenCode equivalent: `tool.execute.after` event in `plugins/hooks.ts` with tool filter

## Conversion Status

| Hook | Claude Code Event | OpenCode Event | Status |
|------|-------------------|----------------|--------|
| session-start-reminder | SessionStart | session.created | Needs TypeScript conversion |
| post-compact-hook | SessionStart (compact) | session.compacted | Needs TypeScript conversion |
| stop-todo-enforcement | Stop | N/A | **Cannot convert** (blocking not supported) |
| post-todo-write-hook | PostToolUse (TodoWrite) | tool.execute.after | Needs TypeScript conversion |

## Next Steps

1. Review the Python hook implementations in the original repo's `hooks/` directory
2. Create `plugins/hooks.ts` with TypeScript equivalents
3. Accept that stop-blocking behavior cannot be replicated in OpenCode
