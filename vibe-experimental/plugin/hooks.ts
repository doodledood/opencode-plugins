import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * LIMITATIONS (cannot be fully converted):
 *
 * 1. Stop blocking (stop_do_hook.py):
 *    - Original: Blocks stop unless /done or /escalate was called after /do
 *    - OpenCode: session.idle event CANNOT block stopping
 *    - Mitigation: Log warning only - workflow discipline relies on prompts
 *
 * 2. PreToolUse blocking (pretool_escalate_hook.py):
 *    - Original: Blocks /escalate unless /verify was called first after /do
 *    - OpenCode: tool.execute.before CANNOT block execution
 *    - Mitigation: Log warning only - escalate gating relies on prompts
 *
 * The /do, /verify, /done, /escalate workflow discipline is enforced
 * through the skill prompts rather than hooks in OpenCode.
 */

const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events.
     * Logs when sessions start/idle but cannot block stopping.
     *
     * Original: stop_do_hook.py - blocked stop unless /done or /escalate called
     * Limitation: Cannot block in OpenCode, just log.
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session started - /do workflow tracking active",
        })
      }

      if (event.type === "session.idle") {
        // NOTE: Cannot block stopping in OpenCode
        // The /done and /escalate workflow is enforced via prompts
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session idle - workflow discipline relies on skill prompts",
        })
      }
    },

    /**
     * Before tool execution - observe skill calls.
     *
     * Original: pretool_escalate_hook.py - blocked /escalate unless /verify called
     * Limitation: Cannot block in OpenCode, can only log warnings.
     */
    "tool.execute.before": async (input, output) => {
      // Only care about skill tool calls
      if (input.tool !== "skill") return

      const args = output.args as { name?: string; arguments?: string } | undefined
      const skillName = args?.name ?? ""

      // Log escalate calls (cannot block - workflow discipline is in prompts)
      if (skillName === "escalate" || skillName.endsWith("-vibe-experimental")) {
        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: `Skill invoked: ${skillName}`,
          extra: { skill: skillName },
        })
      }
    },
  }
}

export default VibeExperimentalPlugin
