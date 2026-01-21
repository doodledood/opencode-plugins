/**
 * OpenCode hooks for vibe-experimental plugin.
 *
 * Converted from Python hooks in claude-code-plugins.
 *
 * Note: OpenCode cannot block stopping or tool execution.
 * - stop_do_hook cannot be converted (blocking not supported)
 * - pretool_escalate_hook can only warn, not block
 */

function buildSystemReminder(content: string): string {
  return `<system-reminder>${content}</system-reminder>`;
}

export default async ({ project, client }: { project: any; client: any }) => {
  return {
    /**
     * Before tool execution - warn about escalate without verify
     * Converted from: pretool_escalate_hook.py
     *
     * NOTE: Cannot actually block the tool call like Claude Code.
     * This only logs a warning - the escalate will still proceed.
     */
    "tool.execute.before": async (event: { tool: string; args: any }) => {
      // Only handle skill tool calls for escalate
      if (event.tool !== "skill") return;

      const skill = event.args?.skill || "";
      if (!skill.includes("escalate")) return;

      // In Claude Code, this would check transcript for /do and /verify calls
      // and block if /verify wasn't called. OpenCode can't block, so we just warn.
      client.app.log(
        "warn",
        "[vibe-experimental] /escalate called - ensure /verify was run first"
      );

      return {
        additionalContext: buildSystemReminder(
          "Reminder: /escalate should only be used after running /verify. " +
          "If you haven't verified acceptance criteria, consider running /verify first."
        ),
      };
    },

    /**
     * Session idle - NOTE: Cannot block stopping like Claude Code's Stop hook
     * The original stop_do_hook.py prevented stopping during /do workflow.
     * OpenCode does not support blocking.
     */
    "session.idle": async () => {
      // Cannot block stopping in OpenCode
      client.app.log("debug", "[vibe-experimental] Session idle");
    },
  };
};
