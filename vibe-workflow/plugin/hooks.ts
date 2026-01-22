import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-workflow plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * LIMITATIONS (not convertible):
 * - Stop hook (blocking todos incomplete) - OpenCode cannot block stopping
 * - PostToolUse additionalContext - OpenCode cannot inject context after tool use
 */

const CODEBASE_EXPLORER_REMINDER =
  "When you need to find relevant files for a task - whether for answering questions, " +
  "planning implementation, debugging, or onboarding - prefer using the `explore-codebase` skill " +
  '(skill({ name: "explore-codebase" })) instead of the built-in Explore agent. ' +
  "It returns a structural overview + prioritized file list with precise line ranges. For thorough+ " +
  "queries, it automatically launches parallel agents to explore orthogonal angles (implementation, " +
  "usage, tests, config) and synthesizes a comprehensive reading list."

const WEB_RESEARCHER_REMINDER =
  "For non-trivial web research tasks - technology comparisons, best practices, API documentation, " +
  "library evaluations, or any question requiring synthesis of multiple sources - prefer using " +
  'the `research-web` skill (skill({ name: "research-web" })) instead of calling ' +
  "WebSearch directly. For thorough+ queries, it launches parallel investigators across orthogonal " +
  "facets, continues waves until satisficed, and synthesizes findings with confidence levels and " +
  "source citations."

const IMPLEMENT_RECOVERY_REMINDER =
  "This session may have been in the middle of a vibe-workflow implement workflow before compaction. " +
  "If you were implementing a plan and haven't already read your working files in full, " +
  "check for implementation log files in /tmp/ matching the implement-*.md pattern. If found, " +
  "read the FULL log file to recover your progress - it typically contains a reference to " +
  "the associated plan file (plan-*.md) which you should also read in full if not already " +
  "loaded. Check your todo list for incomplete items, then resume from where you left off. " +
  "Do not restart work that was already completed."

function buildSystemReminder(content: string): string {
  return `<system-reminder>${content}</system-reminder>`
}

function buildSessionReminders(): string {
  return (
    buildSystemReminder(CODEBASE_EXPLORER_REMINDER) +
    "\n" +
    buildSystemReminder(WEB_RESEARCHER_REMINDER)
  )
}

const VibeWorkflowPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Inject session-start reminders for vibe-workflow best practices.
     * Converted from: SessionStart hook
     */
    "experimental.chat.system.transform": async (input, output) => {
      output.system.push(buildSessionReminders())
    },

    /**
     * Re-anchor session after compaction with reminders and implement workflow recovery.
     * Converted from: SessionStart hook with "compact" matcher
     */
    "experimental.session.compacting": async (input, output) => {
      // Standard session reminders
      output.context.push(buildSessionReminders())
      // Implement recovery reminder
      output.context.push(buildSystemReminder(IMPLEMENT_RECOVERY_REMINDER))
    },

    /**
     * Log when todo is updated during implement workflow.
     * Converted from: PostToolUse (TodoWrite) hook
     *
     * NOTE: Cannot inject additionalContext like Claude Code - just log for debugging.
     */
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "todowrite") return

      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message: "Todo updated - consider updating progress/log file if in implement workflow",
      })
    },
  }
}

export default VibeWorkflowPlugin
