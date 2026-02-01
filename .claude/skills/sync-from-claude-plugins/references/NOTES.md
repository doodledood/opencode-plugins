# Conversion Notes

Fine-tuning decisions for the sync operation. These are literal notes about specific requests/choices.

## Model Mapping

- `model: opus` → `model: openai/gpt-5.2` with `reasoningEffort: xhigh`

## Skill Naming (manifest-dev)

- `_define` → `define` (skill, no command wrapper)
- `_do` → `do` (skill, no command wrapper)

OpenCode skills are user-invocable, so no need for thin command wrappers that just call `skill({ name: "..." })`. Use skills directly.

## Tool Name Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `AskUserQuestion` | `question` |
| `TodoWrite` | `todowrite` |
| `TaskCreate` | `todowrite` |
