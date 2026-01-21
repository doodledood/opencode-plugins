---
name: sync-from-claude-plugins
description: Fetch claude-code-plugins repo and convert plugins to OpenCode format. Usage: /sync-from-claude-plugins [plugin-names...] (default: all available plugins)
---

# Sync Claude Code Plugins to OpenCode

Convert Claude Code plugins to OpenCode format. **All conversion rules are in `references/CONVERSION_GUIDE.md`** - read it first.

## Arguments

- `$ARGUMENTS`: Plugin names (comma or space-separated). If empty, discovers and converts ALL plugins from the source repo.

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

### 6. Convert Hooks (if source has hooks/)

See CONVERSION_GUIDE.md section "Converting Hooks" for:
- Event mapping table
- TypeScript template
- Blocking behavior differences

Create `plugin/hooks.ts` following the guide's template.

### 7. Create package.json (per plugin)

See CONVERSION_GUIDE.md section "Plugin Manifest Conversion" for format.

### 8. Create README.md

List commands, agents, skills for each plugin.

### 9. Validate EVERY File Against Conversion Guide

**CRITICAL**: Verify ALL transformed files match CONVERSION_GUIDE expectations. Do not sample - check everything.

#### For Each Plugin, Verify:

**Read the CONVERSION_GUIDE sections** for expected format, then check:

1. **EVERY command** (`command/*.md`):
   - Compare against "Converting User-Invocable Skills → Commands"
   - Check "Frontmatter Field Mapping" table
   - Check "Model Mapping" section
   - Check "Prompt Content Transformations" for Skill() calls

2. **EVERY agent** (`agent/*.md`):
   - Compare against "Converting Agents"
   - Check "Frontmatter Field Mapping" table
   - Check "Tool Permission Mapping" table
   - Check "Model Mapping" section

3. **EVERY skill** (`skill/*/SKILL.md`):
   - Compare against "Converting Non-User-Invocable Skills → Skills"
   - Verify `name:` is KEPT (unlike commands/agents)
   - Check "Prompt Content Transformations" for Skill() calls

4. **Cross-references in ALL files**:
   - Check "Skill/Command References" section
   - User-invocable targets → `/command`
   - Non-user-invocable targets → `skill({ name: "..." })`
   - Task tool references → agent references

5. **Hooks** (if any):
   - Compare against "Converting Hooks" section
   - Verify event names match mapping table
   - Check blocking behavior notes

#### Adaptation Process

If validation finds issues:

1. **Consult CONVERSION_GUIDE**: Which rule was violated?
2. **Fix the file**: Edit to match guide specification
3. **Update transform.py**: If systematic issue, add the rule
4. **Re-verify**: Check all files for same issue

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
