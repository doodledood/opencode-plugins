import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Original hooks:
 * - PreToolUse (Skill/escalate): Gate escalate calls - require verify before escalation
 * - Stop: Enforce /done or /escalate before stopping during /do workflow
 *
 * LIMITATIONS:
 * - PreToolUse blocking is NOT supported in OpenCode - tool.execute.before cannot abort
 * - Stop blocking is NOT supported in OpenCode - session.idle cannot prevent stopping
 * - Using permission.ask hook as alternative for escalate gating
 * - Stop enforcement converted to logging only
 */

export const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events.
     *
     * NOTE: Stop blocking is NOT supported in OpenCode.
     * The original stop_do_hook.py logic cannot be fully replicated.
     * Original behavior:
     * - Block stop if /do was called but neither /done nor /escalate
     * - Allow stop if /done or /escalate was properly called
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: "Session started - vibe-experimental hooks active",
        })
      }

      if (event.type === "session.idle") {
        // LIMITATION: Cannot block stopping in OpenCode
        // Original Python hook would block if /do workflow incomplete
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message:
            "Session idle - /do workflow enforcement not available in OpenCode. " +
            "Ensure /verify was called and /done or /escalate properly invoked.",
        })
      }
    },

    /**
     * Before tool execution - log warnings for escalate without verify.
     * Converted from: PreToolUse hook with Skill/escalate matcher
     *
     * LIMITATION: Cannot block tool execution in OpenCode.
     * Original behavior would block /escalate unless /verify was called first.
     * Now we just log a warning.
     */
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "skill") return

      const args = output.args as { name?: string } | undefined
      const skillName = args?.name ?? ""

      // Check if this is an escalate skill call
      if (skillName !== "escalate" && !skillName.endsWith("-escalate")) return

      // Log warning about escalate workflow
      // LIMITATION: Cannot block - original hook would block if /verify not called
      await client.app.log({
        service: "vibe-experimental",
        level: "warn",
        message:
          "Escalate skill invoked. Reminder: /verify should be called before /escalate " +
          "to check acceptance criteria. If this escalation is premature, consider " +
          "running /verify first.",
      })
    },

    /**
     * Permission hook - can control allow/deny/ask for tools.
     *
     * This is the closest equivalent to PreToolUse blocking in OpenCode.
     * However, it operates at the permission level, not per-invocation.
     *
     * For now, we don't implement strict gating here as it would require
     * tracking /do and /verify state across the session, which OpenCode
     * hooks don't have access to (no transcript_path equivalent).
     *
     * Future enhancement: Could use session storage to track workflow state.
     */
    // "permission.ask": async (input, output) => {
    //   // Placeholder for future workflow state tracking
    //   // Could implement escalate gating here if session state becomes available
    // },
  }
}

export default VibeExperimentalPlugin
