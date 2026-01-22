import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * LIMITATIONS (not convertible - both original hooks are blocking):
 * - Stop hook (block until /done or /escalate) - OpenCode cannot block stopping
 * - PreToolUse hook (block /escalate before /verify) - OpenCode cannot block tool use
 *
 * This file provides logging only. The workflow enforcement relies on
 * the agent following instructions rather than hard blocks.
 */

const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Log skill invocations for /do workflow tracking.
     * Original: PreToolUse hook that blocked /escalate before /verify
     *
     * NOTE: Cannot block in OpenCode - logging only.
     */
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "skill") return

      const args = output.args as { name?: string } | undefined
      const skillName = args?.name || ""

      if (skillName === "escalate" || skillName.endsWith("-escalate")) {
        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: "Escalate skill invoked - ensure /verify was called first",
        })
      }
    },

    /**
     * Log session idle events for /do workflow tracking.
     * Original: Stop hook that blocked until /done or /escalate
     *
     * NOTE: Cannot block stopping in OpenCode - logging only.
     */
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session idle - if in /do workflow, ensure /done or /escalate was called",
        })
      }
    },
  }
}

export default VibeExperimentalPlugin
