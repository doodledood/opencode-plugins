# Conversion Notes

Fine-tuning decisions for the sync operation. These are literal notes about specific requests/choices.

## Model Mapping

- `model: inherit` → **remove the model line entirely** (and any `reasoningEffort:` line). OpenCode inherits by default. This is the most common case now — upstream is migrating from explicit models to `inherit`.
- `model: opus` → `model: openai/gpt-5.2` with `reasoningEffort: xhigh`

## Skill Naming (manifest-dev)

- `_define` → `define` (skill, no command wrapper)
- `_do` → `do` (skill, no command wrapper)

OpenCode skills are user-invocable, so no need for thin command wrappers that just call `skill({ name: "..." })`. Use skills directly.

## File Copy Strategy

- **Reference files** (task files, `references/*.md`, supporting data without frontmatter conversion): use `cp` from source to target, then grep for `CLAUDE.md`/`.claude/` — apply content transformations only if hits found.
- **Files needing conversion** (agents, commands, skills with frontmatter, package.json, README): read source, apply conversions, write target.

## Tool Name Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `AskUserQuestion` | `question` |
| `TodoWrite` | `todowrite` |
| `TaskCreate` | `todowrite` |
