# Consultant Plugin

Flexible multi-provider LLM consultations using Python/LiteLLM - includes consultant agent, review/bug-investigation commands, and consultant skill for deep AI-powered code analysis across 100+ models.

## Commands

| Command | Description |
|---------|-------------|
| `/analyze-code` | Deep code analysis for technical debt, risks, and improvements |
| `/ask` | Single-model consultation (defaults to gpt-5.2-pro) |
| `/ask-council` | Multi-model ensemble consultation (3 models in parallel) |
| `/consultant` | General consultation with external AI models |
| `/investigate-bug` | Deep bug investigation with root cause analysis |
| `/review` | Production-level PR review using consultant agent |

## Agents

| Agent | Description |
|-------|-------------|
| `consultant` | Consults external AI models for complex analysis |

## Installation

```bash
./install.sh consultant
```
