#!/bin/bash
# Bulk copy a Claude Code plugin to OpenCode structure
# Usage: ./bulk_copy.sh <source-repo> <plugin-name>

REPO="$1"
PLUGIN="$2"

if [ -z "$REPO" ] || [ -z "$PLUGIN" ]; then
  echo "Usage: $0 <source-repo> <plugin-name>"
  exit 1
fi

SRC="$REPO/claude-plugins/$PLUGIN"
DST="./$PLUGIN"

if [ ! -d "$SRC" ]; then
  echo "Error: Plugin not found at $SRC"
  exit 1
fi

echo "Copying $PLUGIN..."

rm -rf "$DST"
mkdir -p "$DST"/{commands,agents,skills}

# Copy agents
cp "$SRC"/agents/*.md "$DST/agents/" 2>/dev/null && echo "  agents: $(ls "$DST/agents" | wc -l | tr -d ' ') files"

# Copy skills → commands or skills based on user-invocable flag
for skill_dir in "$SRC"/skills/*/; do
  skill_name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"
  [ -f "$skill_file" ] || continue

  if grep -q 'user-invocable: false' "$skill_file"; then
    # Non-user-invocable → keep as skill
    mkdir -p "$DST/skills/$skill_name"
    cp "$skill_file" "$DST/skills/$skill_name/SKILL.md"
    [ -d "$skill_dir/references" ] && cp -r "$skill_dir/references" "$DST/skills/$skill_name/"
  else
    # User-invocable → convert to command
    cp "$skill_file" "$DST/commands/$skill_name.md"
  fi
done

echo "  commands: $(ls "$DST/commands" 2>/dev/null | wc -l | tr -d ' ') files"
echo "  skills: $(ls "$DST/skills" 2>/dev/null | wc -l | tr -d ' ') dirs"
echo "Done: $PLUGIN"
