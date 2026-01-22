import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-workflow plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Hook mapping:
 * - SessionStart → event (session.created) + experimental.chat.system.transform
 * - SessionStart (matcher: "compact") → experimental.session.compacting
 * - PostToolUse (matcher: "TodoWrite") → tool.execute.after
 * - Stop → event (session.idle) - CANNOT BLOCK in OpenCode
 */

// Session reminder strings (from hook_utils.py)
const CODEBASE_EXPLORER_REMINDER =
  "When you need to find relevant files for a task - whether for answering questions, " +
  "planning implementation, debugging, or onboarding - prefer using the `explore-codebase` command " +
  "(/explore-codebase-vibe-workflow \"your query\") instead of the built-in Explore agent. " +
  "It returns a structural overview + prioritized file list with precise line ranges. For thorough+ " +
  "queries, it automatically launches parallel agents to explore orthogonal angles (implementation, " +
  "usage, tests, config) and synthesizes a comprehensive reading list."

const WEB_RESEARCHER_REMINDER =
  "For non-trivial web research tasks - technology comparisons, best practices, API documentation, " +
  "library evaluations, or any question requiring synthesis of multiple sources - prefer using " +
  "the `research-web` command (/research-web-vibe-workflow \"your query\") instead of calling " +
  "WebSearch directly. For thorough+ queries, it launches parallel investigators across orthogonal " +
  "facets, continues waves until satisficed, and synthesizes findings with confidence levels and " +
  "source citations."

const IMPLEMENT_RECOVERY_REMINDER =
  "This session may have been in the middle of a /implement-vibe-workflow workflow before compaction. " +
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

export const VibeWorkflowPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events
     * Catches session.created, session.idle, etc.
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
        await client.app.log({
          service: "vibe-workflow",
          level: "debug",
          message:
            "Session idle - NOTE: Stop blocking not supported in OpenCode. " +
            "If in /implement workflow with incomplete todos, session will stop anyway.",
        })
      }
    },

    /**
     * System prompt transformation - inject session reminders
     * This is the main way to inject context at session start.
     * Converted from: session_start_reminder.py (SessionStart hook)
     */
    "experimental.chat.system.transform": async (input, output) => {
      output.system.push(buildSessionReminders())
    },

    /**
     * Session compacting - preserve context during compaction
     * Converted from: post_compact_hook.py (SessionStart with "compact" matcher)
     */
    "experimental.session.compacting": async (input, output) => {
      const context = [
        buildSessionReminders(),
        buildSystemReminder(IMPLEMENT_RECOVERY_REMINDER),
      ].join("\n")

      output.context.push(context)

      await client.app.log({
        service: "vibe-workflow",
        level: "info",
        message: "Session compacted - recovery context injected",
      })
    },

    /**
     * After tool execution - log todo completions
     * Converted from: post_todo_write_hook.py (PostToolUse with "TodoWrite" matcher)
     *
     * NOTE: The OpenCode tool.execute.after hook doesn't support injecting
     * additionalContext. We can only log or modify the output.
     */
    "tool.execute.after": async (input, output) => {
      // Only trigger for todo tool (TodoWrite in Claude Code)
      if (input.tool !== "todo") return

      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message: "Todo tool executed - consider updating implement log files if in workflow",
      })
    },
  }
}

export default VibeWorkflowPlugin
