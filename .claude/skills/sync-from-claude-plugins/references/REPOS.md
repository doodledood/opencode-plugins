# Source Repos Configuration

Repos to sync plugins from. The sync skill reads this file to determine where to find plugins.

## Repos

| Repo | Local Paths | Git URL | Plugins Dir | Plugins |
|------|-------------|---------|-------------|---------|
| claude-code-plugins | ~/Documents/Projects/claude-code-plugins, ~/Lemonade/claude-code-plugins | https://github.com/doodledood/claude-code-plugins | claude-plugins | vibe-extras, consultant, prompt-engineering, solo-dev, frontend-design, life-ops |
| manifest-dev | ~/Documents/Projects/manifest-dev, ~/Lemonade/manifest-dev | https://github.com/doodledood/manifest-dev | claude-plugins | manifest-dev |

## Notes

- **Local Paths**: Comma-separated list of directories to check (in order). First existing dir is used.
- **Git URL**: Fallback clone URL if no local path exists.
- **Plugins Dir**: Subdirectory within the repo containing plugins.
- **Plugins**: Comma-separated list of plugin names to sync from this repo.

## Adding a New Repo

1. Add a row to the table above
2. Run `/sync-plugins <repo>:<plugin>` or `/sync-plugins --all`
