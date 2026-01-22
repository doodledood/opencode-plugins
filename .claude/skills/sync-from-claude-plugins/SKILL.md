---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: all available plugins)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins to OpenCode format. **All conversion rules are in `references/CONVERSION_GUIDE.md`** - read it first.

## Arguments

- `$ARGUMENTS`: Plugin names and flags (space-separated). If no plugins specified, discovers and converts ALL plugins from the source repo.

### Flags

- `--reasoning-effort[=LEVEL]`: Add `reasoningEffort` to all agent frontmatter. By default, agents don't include this field (matching Claude Code behavior). Use this flag when you want OpenCode agents to have explicit reasoning effort settings.
  - Values: `low`, `medium`, `high`, `xhigh`
  - Default (if no value): `medium`
  - Examples: `--reasoning-effort`, `--reasoning-effort=high`, `--reasoning-effort xhigh`

## Execution

### 1. Read the Conversion Guide

**FIRST**: Read `references/CONVERSION_GUIDE.md` to understand:
- Directory structure mapping
- Skill classification rules (command vs skill)
- Frontmatter transformations
- Tool permission mapping
- Model ID mapping
- Skill() call transformations
- Hook event mapping

### 2. Locate Source Repo

```bash
REPO=""
for dir in ~/Documents/Projects/claude-code-plugins ~/Lemonade/claude-code-plugins /tmp/claude-code-plugins; do
  [ -d "$dir" ] && cd "$dir" && git pull origin main && REPO="$dir" && break
done
[ -z "$REPO" ] && git clone https://github.com/doodledood/claude-code-plugins.git /tmp/claude-code-plugins && REPO=/tmp/claude-code-plugins
```

### 3. Discover Plugins

If no plugins specified, discover all available:

```bash
PLUGINS=""
for dir in "$REPO"/claude-plugins/*/; do
  [ -d "$dir" ] || continue
  [ -f "$dir/.claude-plugin/plugin.json" ] && PLUGINS="$PLUGINS $(basename "$dir")"
done
echo "Available plugins: $PLUGINS"
```

If `$ARGUMENTS` provided, use those (normalize commas to spaces).

### 4. Bulk Copy (per plugin)

```bash
SCRIPTS="${CLAUDE_SKILL_ROOT}/scripts"
for PLUGIN in $PLUGINS; do
  "$SCRIPTS/bulk_copy.sh" "$REPO" "$PLUGIN"
done
```

### 5. Transform Files

```bash
python3 "${CLAUDE_SKILL_ROOT}/scripts/transform.py" "./*"
```

### 5b. Apply Reasoning Effort (if --reasoning-effort flag)

If `--reasoning-effort` was specified in arguments, add to ALL agent files (`agent/*.md`):

```yaml
reasoningEffort: <level>  # low, medium, high, or xhigh
```

Insert after `mode:` line in frontmatter. Default level is `medium` if no value specified.

### 6. Convert Hooks (if .hooks-reference/ exists)

The bulk_copy.sh script copies hooks to `.hooks-reference/` for conversion. For each plugin with this directory:

#### 6a. Read Hook Configuration

Read `.hooks-reference/plugin.json` (copied from source) to understand hook structure:
```json
{
  "hooks": {
    "SessionStart": [{ "matcher": "...", "description": "...", "hooks": [...] }],
    "PostToolUse": [{ "matcher": "TodoWrite", ... }],
    "PreToolUse": [{ "matcher": "Skill", ... }],
    "Stop": [{ "matcher": "*", ... }]
  }
}
```

#### 6b. Analyze Python Hook Implementations

For each hook defined in plugin.json:
1. Read the corresponding Python file in `.hooks-reference/`
2. Read `.hooks-reference/hook_utils.py` for shared utilities
3. Understand the hook's purpose:
   - What event does it respond to?
   - Does it inject context? (additionalContext)
   - Does it block execution? (decision: block)
   - Does it parse transcript for workflow state?

#### 6c. Generate TypeScript Plugin

Create `plugin/hooks.ts` with equivalent functionality. See CONVERSION_GUIDE.md "Converting Hooks" for:
- Event mapping table
- TypeScript template with proper types
- Tool name mapping (TodoWrite → todo, etc.)

**CRITICAL API RULES:**
- Session events (`session.created`, `session.idle`) go through the `event` hook with `event.type` checks
- Context injection at session start uses `experimental.chat.system.transform` with `output.system.push()`
- `tool.execute.before`/`after` use `input.tool` (NOT `input.call.name`)
- `tool.execute.before` **CANNOT block** - no `output.abort` exists, can only modify `output.args`
- Hooks **CANNOT return additionalContext** - use system transform hooks instead

**Key transformations:**
- `SessionStart` → `event` hook (check `event.type === "session.created"`) + `experimental.chat.system.transform`
- `PostCompact` (matcher: "compact") → `experimental.session.compacting`
- `PostToolUse` → `tool.execute.after` (use `input.tool`)
- `PreToolUse` → `tool.execute.before` (**CANNOT block** - log warning only, modify args)
- `Stop` → `event` hook (check `event.type === "session.idle"`) (**CANNOT block** - log warning only)

**For transcript parsing:** If Python hook uses `parse_transcript()` to detect workflow state, replicate the logic in TypeScript or document the limitation.

#### 6d. Document Limitations

Add comments in generated hooks.ts for:
- Stop hooks that block in Claude Code but cannot in OpenCode
- Any transcript-dependent logic that may behave differently
- SubagentStop (no equivalent in OpenCode)

#### 6e. Cleanup

After generating `plugin/hooks.ts`, remove the reference directory:
```bash
rm -rf "$PLUGIN/.hooks-reference"
```

### 7. Create package.json (per plugin)

See CONVERSION_GUIDE.md section "Plugin Manifest Conversion" for format.

### 8. Create README.md

List commands, agents, skills for each plugin.

### 9. Final Validation Pass - Review ALL Files

**CRITICAL**: The automated scripts (bulk_copy.sh, transform.py) may miss edge cases. This step ensures complete conversion.

#### 9a. Re-read the Conversion Guide

Before validating, re-read `references/CONVERSION_GUIDE.md` sections:
- Frontmatter Field Mapping tables
- Model Mapping
- Tool Permission Mapping
- Prompt Content Transformations
- OpenCode Terminology (CLAUDE.md → AGENTS.md)

#### 9b. Validate Every File

For EACH file in the converted plugin (do not sample - check ALL):

**Commands** (`command/*.md`):
- [ ] `name:` field removed (filename is the name)
- [ ] `model:` uses full ID (anthropic/claude-sonnet-4-5-20250929, not "sonnet")
- [ ] `user-invocable:` field removed
- [ ] `Skill("plugin:name")` → `/name` for user-invocable targets
- [ ] `Skill("plugin:name")` → `skill({ name: "name" })` for non-user-invocable
- [ ] `AskUserQuestion` → `question` in content
- [ ] `TodoWrite` → `todo` in content
- [ ] `CLAUDE.md` → `AGENTS.md` in content
- [ ] `.claude/` → `.opencode/` in paths
- [ ] Files with "claude-md" renamed to "agents-md"

**Agents** (`agent/*.md`):
- [ ] `name:` field removed
- [ ] `mode: subagent` added
- [ ] `tools:` converted from comma list to YAML object with booleans
- [ ] `model:` uses full ID
- [ ] Same content transformations as commands

**Skills** (`skill/*/SKILL.md`):
- [ ] `name:` field KEPT (required for skills)
- [ ] `user-invocable: false` removed
- [ ] Same content transformations as commands

**Hooks/Plugins** (`plugin/hooks.ts`):
- [ ] Uses `event` hook for session lifecycle events (NOT direct `"session.created"` keys)
- [ ] Session events checked via `event.type === "session.created"` etc.
- [ ] Uses `experimental.chat.system.transform` for context injection
- [ ] Uses `input.tool` (NOT `input.call.name`) in tool.execute hooks
- [ ] No `output.abort` usage (doesn't exist - log warnings instead)
- [ ] No `additionalContext` returns (not supported)
- [ ] Tool names use OpenCode format (todo, question, etc.)
- [ ] Stop and PreToolUse blocking hooks have limitation comments
- [ ] Proper TypeScript types from @opencode-ai/plugin

#### 9c. Fix Issues Found

For each issue:
1. Edit the file to match CONVERSION_GUIDE specification
2. If systematic (same issue in multiple files), consider updating transform.py
3. Re-check the fix

#### 9d. Cross-Reference Validation

Check that internal references are consistent:
- Commands referencing agents use correct agent filenames
- Skills referencing other skills use correct names
- Agent descriptions match their actual capabilities

## Reference

**`references/CONVERSION_GUIDE.md`** is the single source of truth for all conversion rules. This skill only describes the workflow.

## Output

```
<plugin>/
├── package.json
├── README.md
├── command/*.md
├── agent/*.md
├── skill/*/SKILL.md   (non-user-invocable only)
└── plugin/hooks.ts    (if source has hooks)
```

## Installation

After conversion:

```bash
./install.sh                    # Install all plugins
./install.sh vibe-workflow      # Install specific plugin
./install.sh plugin1,plugin2    # Install multiple
```
