#!/bin/bash
# Install/sync OpenCode plugins by copying to ~/.config/opencode/
#
# Usage:
#   ./install.sh                           # Sync default plugins (manifest-dev, vibe-extras)
#   ./install.sh vibe-workflow             # Sync specific plugin
#   ./install.sh vibe-workflow,consultant  # Sync multiple (comma-separated)
#   ./install.sh clean                     # Remove ALL installed plugin files
#   ./install.sh clean vibe-workflow       # Remove specific plugin files
#
# Environment variables:
#   OPENCODE_PLUGINS    - Comma or space-separated list of plugins, or:
#                         "all" or "" to install all available plugins
#                         If unset, defaults to: manifest-dev vibe-extras
#   OPENCODE_CONFIG_DIR - Target directory (default: ~/.config/opencode)
#
# Sync behavior:
#   - Removes all existing files for the plugin (detected by postfix)
#   - Copies current files from source
#   - This handles: additions, updates, AND deletions
#
# Files are postfixed with plugin name to avoid collisions:
#   review.md -> review-vibe-workflow.md
#   bug-fixer.md -> bug-fixer-vibe-workflow.md

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Discover all available plugins in the repo
discover_plugins() {
    local plugins=""
    for dir in "$SCRIPT_DIR"/*/; do
        [ -d "$dir" ] || continue
        local name=$(basename "$dir")
        # Skip hidden dirs and .claude
        [[ "$name" == .* ]] && continue
        # Must have at least command/ or agent/ directory
        if [ -d "$dir/command" ] || [ -d "$dir/agent" ]; then
            plugins="$plugins $name"
        fi
    done
    echo "$plugins" | xargs  # trim whitespace
}

# Create target directories
create_dirs() {
    mkdir -p "$CONFIG_DIR"/{command,agent,skill,plugin}
}

# Remove all files for a plugin (detected by postfix pattern)
# This enables proper sync: deletions in source are reflected in target
clean_plugin_files() {
    local plugin="$1"
    local removed=0

    # Remove command files: *-<plugin>.md
    shopt -s nullglob
    for f in "$CONFIG_DIR/command/"*"-${plugin}.md"; do
        [ -e "$f" ] && rm -f "$f" && removed=$((removed + 1))
    done

    # Remove agent files: *-<plugin>.md
    for f in "$CONFIG_DIR/agent/"*"-${plugin}.md"; do
        [ -e "$f" ] && rm -f "$f" && removed=$((removed + 1))
    done

    # Remove skill directories: *-<plugin>/
    for d in "$CONFIG_DIR/skill/"*"-${plugin}"; do
        [ -d "$d" ] && rm -rf "$d" && removed=$((removed + 1))
    done

    # Remove hook files: <plugin>-*.ts or <plugin>-*.js
    for f in "$CONFIG_DIR/plugin/${plugin}-"*.ts "$CONFIG_DIR/plugin/${plugin}-"*.js; do
        [ -e "$f" ] && rm -f "$f" && removed=$((removed + 1))
    done
    shopt -u nullglob

    if [ $removed -gt 0 ]; then
        log_info "  Cleaned $removed existing files"
    fi
    return $removed
}

# Clean ALL installed files from config directory
clean_all() {
    local total=0

    echo ""
    echo "=========================================="
    echo "  OpenCode Plugins Cleaner"
    echo "=========================================="
    echo ""
    log_info "Target: $CONFIG_DIR"
    echo ""

    shopt -s nullglob

    # Remove all command files
    local count=0
    for f in "$CONFIG_DIR/command/"*.md; do
        [ -e "$f" ] && rm -f "$f" && count=$((count + 1))
    done
    [ $count -gt 0 ] && log_success "Removed $count command files" && total=$((total + count))

    # Remove all agent files
    count=0
    for f in "$CONFIG_DIR/agent/"*.md; do
        [ -e "$f" ] && rm -f "$f" && count=$((count + 1))
    done
    [ $count -gt 0 ] && log_success "Removed $count agent files" && total=$((total + count))

    # Remove all skill directories
    count=0
    for d in "$CONFIG_DIR/skill/"*/; do
        [ -d "$d" ] && rm -rf "$d" && count=$((count + 1))
    done
    [ $count -gt 0 ] && log_success "Removed $count skill directories" && total=$((total + count))

    # Remove all plugin/hook files
    count=0
    for f in "$CONFIG_DIR/plugin/"*.ts "$CONFIG_DIR/plugin/"*.js; do
        [ -e "$f" ] && rm -f "$f" && count=$((count + 1))
    done
    [ $count -gt 0 ] && log_success "Removed $count hook files" && total=$((total + count))

    shopt -u nullglob

    echo ""
    echo "=========================================="
    if [ $total -gt 0 ]; then
        log_success "Cleaned $total total files/directories"
    else
        log_info "Nothing to clean"
    fi
    echo "=========================================="
}

# Postfix filename with plugin name
# review.md -> review-vibe-workflow.md
postfix_filename() {
    local filename="$1"
    local plugin="$2"
    local name="${filename%.*}"
    local ext="${filename##*.}"
    echo "${name}-${plugin}.${ext}"
}

# Update name field in file content to match new filename
update_name_field() {
    local file="$1"
    local new_name="$2"

    # Only process .md files
    [[ "$file" != *.md ]] && return 0

    # Check if file has YAML frontmatter with name field
    if head -1 "$file" | grep -q '^---$'; then
        # Use sed to update name: field in frontmatter
        if grep -q '^name:' "$file"; then
            sed -i '' "s/^name:.*$/name: $new_name/" "$file"
        fi
    fi
}

# Update internal slash command references to include plugin postfix
# /review → /review-vibe-workflow (if review.md exists in same plugin)
update_internal_command_refs() {
    local file="$1"
    local plugin="$2"
    local plugin_dir="$3"  # Source plugin directory

    # Only process .md files
    [[ "$file" != *.md ]] && return 0

    # Update /command references for commands in this plugin
    if [ -d "$plugin_dir/command" ]; then
        for cmd_file in "$plugin_dir/command"/*.md; do
            [ -e "$cmd_file" ] || continue
            local cmd_basename=$(basename "$cmd_file" .md)
            # Replace /cmd with /cmd-plugin
            # Match /cmd NOT followed by more hyphenated-alphanumeric (to avoid /cmd-other)
            perl -i -pe "s|(?<=/)${cmd_basename}(?![a-z0-9-])|${cmd_basename}-${plugin}|g" "$file" 2>/dev/null || true
        done
    fi

    # Update skill({ name: "..." }) references for skills in this plugin
    if [ -d "$plugin_dir/skill" ]; then
        for skill_dir in "$plugin_dir/skill"/*/; do
            [ -d "$skill_dir" ] || continue
            local skill_name=$(basename "$skill_dir")
            # Replace skill({ name: "foo" with skill({ name: "foo-plugin"
            # Handles both single and double quotes
            perl -i -pe "s|(?<=skill\\(\\{ name: [\"'])${skill_name}(?=[\"'])|${skill_name}-${plugin}|g" "$file" 2>/dev/null || true
        done
    fi
}

# Copy and rename files from plugin to target
copy_files() {
    local src="$1"
    local dst="$2"
    local type="$3"
    local plugin="$4"
    local plugin_dir="$5"  # Root plugin directory for finding commands

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0

    for file in "$src"/*; do
        [ -e "$file" ] || continue
        local basename=$(basename "$file")
        local new_basename=$(postfix_filename "$basename" "$plugin")
        local target="$dst/$new_basename"

        cp -r "$file" "$target"

        # Update name field in the copied file
        local name_without_ext="${new_basename%.*}"
        update_name_field "$target" "$name_without_ext"

        # Update internal /command and skill() references to include plugin postfix
        if [ -n "$plugin_dir" ]; then
            update_internal_command_refs "$target" "$plugin" "$plugin_dir"
        fi

        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  $type: $count files"
    fi
}

# Copy skill directories with plugin postfix
copy_skills() {
    local src="$1"
    local dst="$2"
    local plugin="$3"
    local plugin_dir="$4"  # Root plugin directory for finding commands

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0

    for skill_dir in "$src"/*/; do
        [ -d "$skill_dir" ] || continue
        local skill_name=$(basename "$skill_dir")
        local new_skill_name="${skill_name}-${plugin}"
        local target="$dst/$new_skill_name"

        mkdir -p "$target"
        cp -r "$skill_dir"/* "$target/"

        # Update name field in SKILL.md if it exists
        if [ -f "$target/SKILL.md" ]; then
            update_name_field "$target/SKILL.md" "$new_skill_name"
            # Update internal /command and skill() references
            if [ -n "$plugin_dir" ]; then
                update_internal_command_refs "$target/SKILL.md" "$plugin" "$plugin_dir"
            fi
        fi

        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  skill: $count dirs"
    fi
}

# Copy hooks with plugin-specific filename
copy_hooks() {
    local src="$1"
    local dst="$2"
    local plugin="$3"

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0

    for file in "$src"/*; do
        [ -e "$file" ] || continue
        local basename=$(basename "$file")
        # hooks.ts -> vibe-workflow-hooks.ts
        local new_basename="${plugin}-${basename}"
        local target="$dst/$new_basename"

        cp -r "$file" "$target"
        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  hooks: $count files"
    fi
}

# Sync a single plugin (clean + copy)
sync_plugin() {
    local plugin="$1"
    local plugin_dir="$SCRIPT_DIR/$plugin"

    if [ ! -d "$plugin_dir" ]; then
        log_error "Plugin not found: $plugin (looked in $plugin_dir)"
        return 1
    fi

    log_info "Syncing $plugin..."

    # First, remove all existing files for this plugin
    clean_plugin_files "$plugin"

    # Then copy fresh files (pass plugin_dir for internal ref updates)
    copy_files "$plugin_dir/command" "$CONFIG_DIR/command" "command" "$plugin" "$plugin_dir"
    copy_files "$plugin_dir/agent" "$CONFIG_DIR/agent" "agent" "$plugin" "$plugin_dir"
    copy_skills "$plugin_dir/skill" "$CONFIG_DIR/skill" "$plugin" "$plugin_dir"
    copy_hooks "$plugin_dir/plugin" "$CONFIG_DIR/plugin" "$plugin"
}

# Default plugins when no args and OPENCODE_PLUGINS is not set
DEFAULT_PLUGINS="manifest-dev vibe-extras"

# Parse plugins from args or env var
get_plugins() {
    local input=""

    # Command line args take precedence
    if [ $# -gt 0 ]; then
        input="$*"
    elif [ -n "${OPENCODE_PLUGINS+x}" ]; then
        # OPENCODE_PLUGINS is set (even if empty)
        if [ -z "$OPENCODE_PLUGINS" ] || [ "$OPENCODE_PLUGINS" = "all" ]; then
            # Empty string or "all" means install all plugins
            input=$(discover_plugins)
        else
            input="$OPENCODE_PLUGINS"
        fi
    else
        # OPENCODE_PLUGINS not set: use defaults
        input="$DEFAULT_PLUGINS"
    fi

    # Normalize: replace commas with spaces
    echo "$input" | tr ',' ' '
}

# Handle clean subcommand
do_clean() {
    shift  # Remove "clean" from args

    if [ $# -eq 0 ]; then
        # No args: clean everything
        clean_all
    else
        # Clean specific plugins
        echo ""
        echo "=========================================="
        echo "  OpenCode Plugins Cleaner"
        echo "=========================================="
        echo ""
        log_info "Target: $CONFIG_DIR"
        echo ""

        local plugins=$(echo "$*" | tr ',' ' ')
        for plugin in $plugins; do
            log_info "Cleaning $plugin..."
            clean_plugin_files "$plugin"
        done

        echo ""
        echo "=========================================="
        log_success "Done"
        echo "=========================================="
    fi
}

# Main
main() {
    # Handle clean subcommand
    if [ "${1:-}" = "clean" ]; then
        do_clean "$@"
        exit 0
    fi

    local plugins=$(get_plugins "$@")

    echo ""
    echo "=========================================="
    echo "  OpenCode Plugins Installer"
    echo "=========================================="
    echo ""
    log_info "Target: $CONFIG_DIR"
    log_info "Plugins: $plugins"
    echo ""

    create_dirs

    local synced=0
    local failed=0

    for plugin in $plugins; do
        if sync_plugin "$plugin"; then
            synced=$((synced + 1))
        else
            failed=$((failed + 1))
        fi
        echo ""
    done

    echo "=========================================="
    if [ $failed -eq 0 ]; then
        log_success "Synced $synced plugin(s) successfully!"
    else
        log_warn "Synced $synced plugin(s), $failed failed"
    fi
    echo ""
    echo "Verify installation:"
    echo "  ls $CONFIG_DIR/command/"
    echo "  ls $CONFIG_DIR/agent/"
    echo ""
    echo "Commands are postfixed with plugin name:"
    echo "  /review-vibe-workflow, /plan-vibe-workflow, etc."
    echo ""
    echo "Start OpenCode and type / to see available commands."
    echo "=========================================="
}

main "$@"
