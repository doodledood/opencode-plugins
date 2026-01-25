import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-workflow plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Original hooks:
 * - SessionStart: Inject reminders for codebase explorer and web researcher
 * - PostCompact: Re-anchor session after compaction with implement recovery
 * - PostToolUse (TaskUpdate): Remind to update log files after task completion
 * - Stop: Enforce task completion during implement workflows (CANNOT block in OpenCode)
 *
 * LIMITATIONS:
 * - Stop blocking is not supported in OpenCode - converted to logging
 * - additionalContext returns not supported - using system transform hooks instead
 */

// Session reminder strings
const CODEBASE_EXPLORER_REMINDER = `When you need to find relevant files for a task - whether for answering questions, \
planning implementation, debugging, or onboarding - prefer using /explore-codebase \
instead of the built-in Explore agent. \
It returns a structural overview + prioritized file list with precise line ranges. For thorough+ \
queries, it automatically launches parallel agents to explore orthogonal angles (implementation, \
usage, tests, config) and synthesizes a comprehensive reading list.`

const WEB_RESEARCHER_REMINDER = `For non-trivial web research tasks - technology comparisons, best practices, API documentation, \
library evaluations, or any question requiring synthesis of multiple sources - prefer using \
/research-web instead of calling WebSearch directly. For thorough+ queries, it launches \
parallel investigators across orthogonal facets, continues waves until satisficed, and \
synthesizes findings with confidence levels and source citations.`

const IMPLEMENT_RECOVERY_REMINDER = `This session may have been in the middle of an implement workflow before compaction. \
If you were implementing a plan and haven't already read your working files in full, \
check for implementation log files in /tmp/ matching the implement-*.md pattern. If found, \
read the FULL log file to recover your progress - it typically contains a reference to \
the associated plan file (plan-*.md) which you should also read in full if not already \
loaded. Check your todo list for incomplete items, then resume from where you left off. \
Do not restart work that was already completed.`

const LOG_FILE_REMINDER = `If you're in an implement or implement-inplace workflow and just completed a task, \
consider updating your progress/log file in /tmp/ (implement-*.md or implement-progress.md) \
to reflect this completion. This helps maintain external memory for session recovery.`

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

export const VibeWorkflowPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events
     * Catches session.created, session.idle, etc.
     *
     * NOTE: Stop blocking is NOT supported in OpenCode.
     * The original stop_todo_enforcement.py logic cannot be replicated.
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          service: "vibe-workflow",
          level: "info",
          message: "Session started - vibe-workflow hooks active",
        })
      }

      if (event.type === "session.idle") {
        // LIMITATION: Cannot block stopping in OpenCode
        // Original Python hook would block if incomplete tasks exist during implement workflow
        await client.app.log({
          service: "vibe-workflow",
          level: "debug",
          message: "Session idle - stop enforcement not available in OpenCode",
        })
      }
    },

    /**
     * System prompt transformation - inject context at session start.
     * Converted from: SessionStart hook (additionalContext)
     *
     * Injects reminders to prefer vibe-workflow agents over built-in alternatives.
     */
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(buildSessionReminders())
    },

    /**
     * Session compacting - preserve context during compaction.
     * Converted from: PostCompact / SessionStart with "compact" matcher
     *
     * Re-anchors session after compaction with:
     * 1. Standard session reminders (agent preferences)
     * 2. Implement workflow recovery reminder
     */
    "experimental.session.compacting": async (_input, output) => {
      // Add standard reminders
      output.context.push(buildSessionReminders())

      // Add implement recovery reminder
      // Note: We don't have transcript access to check if in implement workflow,
      // so we add the reminder unconditionally - it's harmless if not applicable
      output.context.push(buildSystemReminder(IMPLEMENT_RECOVERY_REMINDER))
    },

    /**
     * After tool execution - react to todo updates.
     * Converted from: PostToolUse hook with TaskUpdate matcher
     *
     * Reminds to update log files after task completion during implement workflows.
     *
     * NOTE: Cannot return additionalContext - just logging for now.
     * Consider using system transform hooks for persistent reminders.
     */
    "tool.execute.after": async (input, _output) => {
      // Only react to todowrite tool (OpenCode equivalent of TaskUpdate)
      if (input.tool !== "todowrite") return

      // Log reminder about updating progress files
      // Note: We can't inject additionalContext like Claude Code, just log
      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message: LOG_FILE_REMINDER,
      })
    },
  }
}

export default VibeWorkflowPlugin
