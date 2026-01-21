---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert specified plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: vibe-workflow vibe-extras vibe-experimental)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins from https://github.com/doodledood/claude-code-plugins to OpenCode format.

**Default plugins**: vibe-workflow, vibe-extras, vibe-experimental
**Custom**: Pass plugin names as arguments (e.g., `/sync-from-claude-plugins vibe-workflow consultant`)

## Step 1: Setup Source Repository

Check if the claude-code-plugins repo exists locally at `~/Lemonade/claude-code-plugins` or `~/Documents/Projects/claude-code-plugins`.

If found, pull latest:
```bash
cd <repo-path> && git pull origin main
```

If not found, clone it:
```bash
git clone https://github.com/doodledood/claude-code-plugins.git /tmp/claude-code-plugins
```

Store the repo path for later steps.

## Step 2: Determine Plugins to Convert

Parse $ARGUMENTS to get plugin names. If empty, use defaults:
- vibe-workflow
- vibe-extras
- vibe-experimental

Verify each plugin exists at `<repo>/claude-plugins/<plugin-name>/`.

## Step 3: Create OpenCode Plugin Structure

For each plugin, create the OpenCode structure in the target repo (current working directory or specified output path):

```
<plugin-name>/
├── package.json
├── commands/
├── agents/
└── README.md
```

## Step 4: Convert Plugin Manifest

Read `.claude-plugin/plugin.json` and create `package.json`:

**Input (Claude Code)**:
```json
{
  "name": "vibe-workflow",
  "description": "Ship high-quality code faster",
  "version": "2.13.2",
  "author": { "name": "doodledood" },
  "license": "MIT"
}
```

**Output (OpenCode)**:
```json
{
  "name": "opencode-<plugin-name>",
  "version": "<version>",
  "description": "<description>",
  "author": "<author>",
  "license": "MIT",
  "keywords": ["opencode", "opencode-plugin"],
  "opencode": {
    "commands": "./commands",
    "agents": "./agents"
  }
}
```

## Step 5: Convert Skills → Commands

For each `skills/<skill-name>/SKILL.md`:

1. Read the file and parse YAML frontmatter
2. Extract: `name`, `description`, and prompt content
3. Transform the content:
   - Replace `Skill("plugin:skill-name", ...)` → reference to `/skill-name`
   - Replace `Task` tool agent references appropriately
   - Keep `$ARGUMENTS` as-is (compatible)
4. Write to `commands/<skill-name>.md`:

**Frontmatter transformation**:
```yaml
# Input (Claude Code)
---
name: review
description: Run all code review agents
---

# Output (OpenCode)
---
description: Run all code review agents
agent: build
---
```

## Step 6: Convert Agents

For each `agents/<agent-name>.md`:

1. Read the file and parse YAML frontmatter
2. Extract: `name`, `description`, `tools`, `model`, and system prompt
3. Transform frontmatter:

**Tool conversion** (Claude Code → OpenCode):
- `Bash` → `bash: allow`
- `Read` → `read: allow`
- `Edit`, `Write` → `edit: allow`
- `WebFetch` → `webfetch: allow`
- `WebSearch` → `websearch: allow`
- `Glob`, `Grep`, `TodoWrite` → (built-in, omit)

**Model conversion**:
- `opus` → `anthropic/claude-opus-4-5-20251101`
- `sonnet` → `anthropic/claude-sonnet-4-20250514`
- `haiku` → `anthropic/claude-haiku-3-5-20241022`

4. Add `mode: subagent` to frontmatter
5. Transform prompt content:
   - Replace `Skill(...)` references with `/command` style
6. Write to `agents/<agent-name>.md`

## Step 7: Handle Hooks (Documentation Only)

Hooks require manual conversion (Python → TypeScript). For each plugin with hooks:

1. List the hooks in the plugin.json
2. Create a `HOOKS_TODO.md` documenting what needs manual conversion:

```markdown
# Hooks Requiring Manual Conversion

The following Claude Code hooks need to be converted to OpenCode TypeScript plugins:

## SessionStart Hooks
- `session-start-reminder` - Inject session-start reminders
  - OpenCode equivalent: `session.created` event

## PostToolUse Hooks
- `post-todo-write-hook` - Remind to update progress files
  - OpenCode equivalent: `tool.execute.after` with tool filter

## Stop Hooks
- `stop-todo-enforcement` - Prevent premature stops
  - OpenCode equivalent: `session.idle` (partial - cannot block)

See CONVERSION_GUIDE.md for TypeScript hook examples.
```

## Step 8: Create README

Generate a README.md for the converted plugin:

```markdown
# OpenCode <Plugin Name>

Converted from [claude-code-plugins](https://github.com/doodledood/claude-code-plugins).

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-<plugin-name>"]
}
```

Or install from GitHub:

```json
{
  "plugin": ["github:doodledood/opencode-plugins/<plugin-name>"]
}
```

## Commands

| Command | Description |
|---------|-------------|
<list all commands>

## Agents

| Agent | Description |
|-------|-------------|
<list all agents>

## Hooks Status

<hooks status - converted or needs manual work>
```

## Step 9: Verify Conversion

After conversion, verify:

1. All skill files converted to commands
2. All agent files converted
3. Frontmatter is valid YAML
4. No `Skill()` references remain (should be `/command`)
5. Model names are full IDs
6. Tools are in OpenCode format

Report any issues found.

## Step 10: Summary

Output a summary:

```
## Conversion Complete

### <plugin-name>
- Commands: X converted
- Agents: Y converted
- Hooks: Z documented (manual conversion needed)

### Files Created
- <plugin-name>/package.json
- <plugin-name>/commands/*.md
- <plugin-name>/agents/*.md
- <plugin-name>/README.md
- <plugin-name>/HOOKS_TODO.md (if hooks exist)

### Next Steps
1. Review converted files for accuracy
2. Manually convert hooks if needed
3. Test commands: `opencode` then `/<command-name>`
4. Publish to npm or use GitHub reference
```

## Execution Notes

- Process plugins in parallel where possible
- Use Glob to find all skills/agents efficiently
- Parse YAML frontmatter carefully (handle multiline descriptions)
- Preserve prompt content formatting
- Create parent directories as needed
- Report progress for each plugin
