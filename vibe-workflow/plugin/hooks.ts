import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-workflow plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Hook mapping:
 * - SessionStart → session.created + experimental.chat.system.transform
 * - SessionStart (matcher: "compact") → experimental.session.compacting
 * - PostToolUse (matcher: "TodoWrite") → tool.execute.after
 * - Stop → session.idle (CANNOT BLOCK in OpenCode)
 */

// Session reminder strings (from hook_utils.py)
const CODEBASE_EXPLORER_REMINDER =
  "When you need to find relevant files for a task - whether for answering questions, " +
  "planning implementation, debugging, or onboarding - prefer using the `explore-codebase` skill " +
  '(Skill("vibe-workflow:explore-codebase", "your query")) instead of the built-in Explore agent. ' +
  "It returns a structural overview + prioritized file list with precise line ranges. For thorough+ " +
  "queries, it automatically launches parallel agents to explore orthogonal angles (implementation, " +
  "usage, tests, config) and synthesizes a comprehensive reading list."

const WEB_RESEARCHER_REMINDER =
  "For non-trivial web research tasks - technology comparisons, best practices, API documentation, " +
  "library evaluations, or any question requiring synthesis of multiple sources - prefer using " +
  'the `research-web` skill (Skill("vibe-workflow:research-web", "your query")) instead of calling ' +
  "WebSearch directly. For thorough+ queries, it launches parallel investigators across orthogonal " +
  "facets, continues waves until satisficed, and synthesizes findings with confidence levels and " +
  "source citations."

const IMPLEMENT_RECOVERY_REMINDER =
  "This session may have been in the middle of a vibe-workflow:implement workflow before compaction. " +
  "If you were implementing a plan and haven't already read your working files in full, " +
  "check for implementation log files in /tmp/ matching the implement-*.md pattern. If found, " +
  "read the FULL log file to recover your progress - it typically contains a reference to " +
  "the associated plan file (plan-*.md) which you should also read in full if not already " +
  "loaded. Check your todo list for incomplete items, then resume from where you left off. " +
  "Do not restart work that was already completed."

const LOG_FILE_REMINDER =
  "If you're in a vibe-workflow:implement or implement-inplace workflow and just completed a todo, " +
  "consider updating your progress/log file in /tmp/ (implement-*.md or implement-progress.md) " +
  "to reflect this completion. This helps maintain external memory for session recovery."

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

/**
 * Check if a todo call contains any completed todos.
 */
function hasCompletedTodo(toolInput: Record<string, unknown>): boolean {
  const todos = toolInput.todos as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(todos)) return false
  return todos.some((t) => typeof t === "object" && t?.status === "completed")
}

export const VibeWorkflowPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Session created - inject initial context reminders
     * Converted from: session_start_reminder.py (SessionStart hook)
     */
    "session.created": async () => {
      await client.app.log({
        service: "vibe-workflow",
        level: "info",
        message: "Session started - vibe-workflow hooks active",
      })
    },

    /**
     * System prompt transformation - inject session reminders
     * This is the OpenCode equivalent of returning additionalContext in SessionStart
     */
    "experimental.chat.system.transform": async (input, output) => {
      output.system.push(buildSessionReminders())
    },

    /**
     * Session compacting - preserve context during compaction
     * Converted from: post_compact_hook.py (SessionStart with "compact" matcher)
     *
     * NOTE: The Python version parses transcript to detect implement workflow.
     * OpenCode doesn't provide transcript access in hooks, so we always include
     * the implement recovery reminder during compaction as a precaution.
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
     * After tool execution - remind to update log files after todo completion
     * Converted from: post_todo_write_hook.py (PostToolUse with "TodoWrite" matcher)
     *
     * NOTE: The Python version parses transcript to detect implement workflow.
     * OpenCode doesn't provide transcript access, so we use a simpler heuristic:
     * if a todo was completed, remind about log files.
     */
    "tool.execute.after": async (input) => {
      // Only trigger for todo tool (TodoWrite in Claude Code)
      if (input.call.name !== "todo") return

      const toolInput = input.call.input as Record<string, unknown>

      // Check if any todo was marked completed
      if (!hasCompletedTodo(toolInput)) return

      // Return reminder context
      // NOTE: OpenCode may not support additionalContext return from tool.execute.after
      // If not, this is a no-op but we log for visibility
      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message: "Todo completed - consider updating implement log files",
      })

      return {
        additionalContext: buildSystemReminder(LOG_FILE_REMINDER),
      }
    },

    /**
     * Session idle - log when session is stopping
     * Converted from: stop_todo_enforcement.py (Stop hook)
     *
     * LIMITATION: OpenCode's session.idle CANNOT BLOCK stopping.
     * The Python version blocks stop when todos are incomplete during implement workflow.
     * In OpenCode, we can only log a warning - the stop cannot be prevented.
     *
     * The Python version also parses transcript to detect:
     * 1. If in implement workflow
     * 2. If there are incomplete todos
     * 3. Prior block count (safety valve after 5 blocks)
     *
     * Without transcript access, we cannot replicate this behavior.
     */
    "session.idle": async () => {
      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message:
          "Session idle - NOTE: Stop blocking not supported in OpenCode. " +
          "If in /implement workflow with incomplete todos, session will stop anyway.",
      })
    },
  }
}

export default VibeWorkflowPlugin
