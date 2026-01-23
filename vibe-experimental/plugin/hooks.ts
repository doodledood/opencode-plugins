import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * LIMITATIONS (from CONVERSION_GUIDE.md):
 * - Stop hooks CANNOT block in OpenCode - can only log warnings
 * - PreToolUse hooks CANNOT block - use permission.ask or log warnings
 *
 * Original Python hooks:
 * - stop_do_hook.py: Blocked stop unless /done or /escalate called after /do
 * - pretool_escalate_hook.py: Blocked /escalate unless /verify called first
 *
 * These hooks are converted to logging-only since blocking is not supported.
 * The workflow enforcement relies on the skill prompts themselves.
 */

const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events.
     * Converted from: Stop hook (stop_do_hook.py)
     *
     * LIMITATION: Cannot block stopping in OpenCode.
     * The original hook blocked stop unless /done or /escalate was called.
     * Now we just log for debugging purposes.
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session started - vibe-experimental hooks active"
        });
      }

      if (event.type === "session.idle") {
        // LIMITATION: Cannot block stopping in OpenCode
        // Original: Blocked unless /done or /escalate called after /do
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session idle - workflow enforcement relies on skill prompts"
        });
      }
    },

    /**
     * System prompt transformation - inject reminders.
     * Provides context about the /do workflow requirements.
     */
    "experimental.chat.system.transform": async (input, output) => {
      // Inject workflow reminder for /do context
      output.system.push(
        `<system-reminder>` +
        `vibe-experimental workflow: When using /do, you must call /verify before stopping. ` +
        `If verification fails, keep working. Only call /escalate after attempting /verify. ` +
        `Only call /done when all acceptance criteria pass.` +
        `</system-reminder>`
      );
    },

    /**
     * Before tool execution - log escalate attempts.
     * Converted from: PreToolUse hook (pretool_escalate_hook.py)
     *
     * LIMITATION: Cannot block in OpenCode.
     * Original: Blocked /escalate unless /verify was called first.
     * The skill prompt itself enforces this - hook just logs.
     */
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "skill") return;

      const args = output.args as { name?: string } | undefined;

      // Log escalate attempts for debugging
      if (args?.name === "escalate" || args?.name?.endsWith("-vibe-experimental")) {
        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: "Escalate skill invoked - ensure /verify was called first"
        });
      }
    },
  };
};

export default VibeExperimentalPlugin;
