/**
 * OpenCode hooks for vibe-workflow plugin.
 *
 * Converted from Python hooks in claude-code-plugins.
 *
 * Note: OpenCode cannot block stopping or tool execution.
 * Stop hooks (stop_todo_enforcement) cannot be fully converted.
 */

const CODEBASE_EXPLORER_REMINDER = `When you need to find relevant files for a task - whether for answering questions, planning implementation, debugging, or onboarding - prefer using /explore-codebase instead of manual searching. It returns a structural overview + prioritized file list with precise line ranges.`;

const WEB_RESEARCHER_REMINDER = `For non-trivial web research tasks - technology comparisons, best practices, API documentation, library evaluations, or any question requiring synthesis of multiple sources - prefer using /research-web instead of calling WebSearch directly.`;

const IMPLEMENT_RECOVERY_REMINDER = `This session may have been in the middle of an implement workflow before compaction. Check for implementation log files in /tmp/ matching implement-*.md. If found, read the FULL log file to recover your progress and resume from where you left off.`;

const LOG_FILE_REMINDER = `If you're in an implement workflow and just completed a todo, consider updating your progress/log file in /tmp/ (implement-*.md) to reflect this completion.`;

function buildSystemReminder(content: string): string {
  return `<system-reminder>${content}</system-reminder>`;
}

export default async ({ project, client }: { project: any; client: any }) => {
  return {
    /**
     * Session created - inject agent preference reminders
     * Converted from: session_start_reminder.py
     */
    "session.created": async () => {
      client.app.log("info", "[vibe-workflow] Session started - injecting reminders");
      return {
        additionalContext: [
          buildSystemReminder(CODEBASE_EXPLORER_REMINDER),
          buildSystemReminder(WEB_RESEARCHER_REMINDER),
        ].join("\n"),
      };
    },

    /**
     * Session compacted - re-anchor with reminders and implement recovery
     * Converted from: post_compact_hook.py
     */
    "session.compacted": async () => {
      client.app.log("info", "[vibe-workflow] Session compacted - injecting recovery reminders");
      return {
        additionalContext: [
          buildSystemReminder(CODEBASE_EXPLORER_REMINDER),
          buildSystemReminder(WEB_RESEARCHER_REMINDER),
          buildSystemReminder(IMPLEMENT_RECOVERY_REMINDER),
        ].join("\n"),
      };
    },

    /**
     * After tool execution - remind about log files after todo completion
     * Converted from: post_todo_write_hook.py
     */
    "tool.execute.after": async (event: { tool: string; args: any; result: any }) => {
      // Only handle todo tool
      if (event.tool !== "todo") return;

      const todos = event.args?.todos || [];
      const hasCompleted = todos.some((t: any) => t?.status === "completed");

      if (hasCompleted) {
        client.app.log("info", "[vibe-workflow] Todo completed - reminding about log files");
        return {
          additionalContext: buildSystemReminder(LOG_FILE_REMINDER),
        };
      }
    },

    /**
     * Session idle - NOTE: Cannot block stopping like Claude Code's Stop hook
     * The original stop_todo_enforcement.py prevented stopping when todos incomplete.
     * OpenCode does not support blocking - this is informational only.
     */
    "session.idle": async () => {
      // Cannot block stopping in OpenCode
      // Original behavior: check for incomplete todos and block if found
      // Best we can do: log a warning
      client.app.log("debug", "[vibe-workflow] Session idle");
    },
  };
};
