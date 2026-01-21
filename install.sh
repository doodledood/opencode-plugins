#!/bin/bash
# Install OpenCode plugins by copying to ~/.config/opencode/
#
# Environment variables:
#   OPENCODE_PLUGINS    - Space-separated list of plugins to install
#                         Default: "vibe-workflow vibe-extras vibe-experimental"
#   OPENCODE_CONFIG_DIR - Target directory (default: ~/.config/opencode)
#   FORCE               - Set to 1 to overwrite existing files

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PLUGINS="vibe-workflow vibe-extras vibe-experimental"
PLUGINS="${OPENCODE_PLUGINS:-$DEFAULT_PLUGINS}"
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

# Create target directories
create_dirs() {
    log_info "Creating directories in $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"/{command,agent,skill,plugin}
}

# Copy files from plugin to target, respecting FORCE flag
copy_files() {
    local src="$1"
    local dst="$2"
    local type="$3"

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0
    local skipped=0

    for file in "$src"/*; do
        [ -e "$file" ] || continue
        local basename=$(basename "$file")
        local target="$dst/$basename"

        if [ -e "$target" ] && [ "$FORCE" != "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi

        cp -r "$file" "$target"
        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  $type: $count files copied"
    fi
    if [ $skipped -gt 0 ]; then
        log_warn "  $type: $skipped files skipped (already exist, use FORCE=1 to overwrite)"
    fi
}

# Copy skill directories (special handling for nested structure)
copy_skills() {
    local src="$1"
    local dst="$2"

    if [ ! -d "$src" ] || [ -z "$(ls -A "$src" 2>/dev/null)" ]; then
        return 0
    fi

    local count=0
    local skipped=0

    for skill_dir in "$src"/*/; do
        [ -d "$skill_dir" ] || continue
        local skill_name=$(basename "$skill_dir")
        local target="$dst/$skill_name"

        if [ -d "$target" ] && [ "$FORCE" != "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi

        mkdir -p "$target"
        cp -r "$skill_dir"/* "$target/"
        count=$((count + 1))
    done

    if [ $count -gt 0 ]; then
        log_success "  skill: $count skills copied"
    fi
    if [ $skipped -gt 0 ]; then
        log_warn "  skill: $skipped skills skipped (already exist)"
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

    # Copy each resource type
    copy_files "$plugin_dir/command" "$CONFIG_DIR/command" "command"
    copy_files "$plugin_dir/agent" "$CONFIG_DIR/agent" "agent"
    copy_skills "$plugin_dir/skill" "$CONFIG_DIR/skill"
    copy_files "$plugin_dir/plugin" "$CONFIG_DIR/plugin" "plugin"
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  OpenCode Plugins Installer"
    echo "=========================================="
    echo ""
    log_info "Target: $CONFIG_DIR"
    log_info "Plugins: $PLUGINS"
    echo ""

    create_dirs

    local installed=0
    local failed=0

    for plugin in $PLUGINS; do
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
    echo "Start OpenCode and type / to see available commands."
    echo "=========================================="
}

main "$@"
