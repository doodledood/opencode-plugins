#!/bin/bash
# Install OpenCode plugins by copying to ~/.config/opencode/
#
# Usage:
#   ./install.sh                           # Install all plugins
#   ./install.sh vibe-workflow             # Install specific plugin
#   ./install.sh vibe-workflow,vibe-extras # Install multiple (comma-separated)
#
# Environment variables:
#   OPENCODE_PLUGINS    - Comma or space-separated list of plugins
#                         Default: all available plugins in repo
#   OPENCODE_CONFIG_DIR - Target directory (default: ~/.config/opencode)
#   FORCE               - Set to 1 to overwrite existing files
#
# Files are postfixed with plugin name to avoid collisions:
#   review.md -> review-vibe-workflow.md
#   bug-fixer.md -> bug-fixer-vibe-workflow.md

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
FORCE="${FORCE:-0}"

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
    log_info "Creating directories in $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"/{command,agent,skill,plugin}
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
        # Match name: followed by any value, replace with new name
        if grep -q '^name:' "$file"; then
            sed -i "s/^name:.*$/name: $new_name/" "$file"
        fi
    fi
}

# Copy and rename files from plugin to target
copy_files() {
    local src="$1"
    local dst="$2"
    local type="$3"
    local plugin="$4"

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0
    local skipped=0

    for file in "$src"/*; do
        [ -e "$file" ] || continue
        local basename=$(basename "$file")
        local new_basename=$(postfix_filename "$basename" "$plugin")
        local target="$dst/$new_basename"

        if [ -e "$target" ] && [ "$FORCE" != "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi

        cp -r "$file" "$target"

        # Update name field in the copied file
        local name_without_ext="${new_basename%.*}"
        update_name_field "$target" "$name_without_ext"

        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  $type: $count files copied"
    fi
    if [ $skipped -gt 0 ]; then
        log_warn "  $type: $skipped files skipped (already exist, use FORCE=1 to overwrite)"
    fi
}

# Copy skill directories with plugin postfix
copy_skills() {
    local src="$1"
    local dst="$2"
    local plugin="$3"

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0
    local skipped=0

    for skill_dir in "$src"/*/; do
        [ -d "$skill_dir" ] || continue
        local skill_name=$(basename "$skill_dir")
        local new_skill_name="${skill_name}-${plugin}"
        local target="$dst/$new_skill_name"

        if [ -d "$target" ] && [ "$FORCE" != "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi

        mkdir -p "$target"
        cp -r "$skill_dir"/* "$target/"

        # Update name field in SKILL.md if it exists
        if [ -f "$target/SKILL.md" ]; then
            update_name_field "$target/SKILL.md" "$new_skill_name"
        fi

        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  skill: $count skills copied"
    fi
    if [ $skipped -gt 0 ]; then
        log_warn "  skill: $skipped skills skipped (already exist)"
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
    local skipped=0

    for file in "$src"/*; do
        [ -e "$file" ] || continue
        local basename=$(basename "$file")
        local ext="${basename##*.}"
        # hooks.ts -> vibe-workflow-hooks.ts
        local new_basename="${plugin}-${basename}"
        local target="$dst/$new_basename"

        if [ -e "$target" ] && [ "$FORCE" != "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi

        cp -r "$file" "$target"
        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  hooks: $count files copied"
    fi
    if [ $skipped -gt 0 ]; then
        log_warn "  hooks: $skipped files skipped (already exist)"
    fi
}

# Install a single plugin
install_plugin() {
    local plugin="$1"
    local plugin_dir="$SCRIPT_DIR/$plugin"

    if [ ! -d "$plugin_dir" ]; then
        log_error "Plugin not found: $plugin (looked in $plugin_dir)"
        return 1
    fi

    log_info "Installing $plugin..."

    # Copy each resource type with plugin postfix
    copy_files "$plugin_dir/command" "$CONFIG_DIR/command" "command" "$plugin"
    copy_files "$plugin_dir/agent" "$CONFIG_DIR/agent" "agent" "$plugin"
    copy_skills "$plugin_dir/skill" "$CONFIG_DIR/skill" "$plugin"
    copy_hooks "$plugin_dir/plugin" "$CONFIG_DIR/plugin" "$plugin"
}

# Parse plugins from args or env var
get_plugins() {
    local input=""

    # Command line args take precedence
    if [ $# -gt 0 ]; then
        input="$*"
    elif [ -n "$OPENCODE_PLUGINS" ]; then
        input="$OPENCODE_PLUGINS"
    else
        # Default: all available plugins
        input=$(discover_plugins)
    fi

    # Normalize: replace commas with spaces
    echo "$input" | tr ',' ' '
}

# Main
main() {
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

    local installed=0
    local failed=0

    for plugin in $plugins; do
        if install_plugin "$plugin"; then
            installed=$((installed + 1))
        else
            failed=$((failed + 1))
        fi
        echo ""
    done

    echo "=========================================="
    if [ $failed -eq 0 ]; then
        log_success "Installed $installed plugin(s) successfully!"
    else
        log_warn "Installed $installed plugin(s), $failed failed"
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
