import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Hook mapping:
 * - PreToolUse (matcher: "Skill") → tool.execute.before
 * - Stop → event (session.idle) - CANNOT BLOCK in OpenCode
 *
 * NOTE: The Python hooks rely on transcript parsing to detect /do workflow state.
 * OpenCode doesn't provide transcript access in hooks, so we track state in memory.
 */

export const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  // Track workflow state in memory (reset each session)
  let doWorkflowActive = false
  let verifyWasCalled = false
  let doneWasCalled = false
  let escalateWasCalled = false

  return {
    /**
     * Event handler for session lifecycle events
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        // Reset workflow state on new session
        doWorkflowActive = false
        verifyWasCalled = false
        doneWasCalled = false
        escalateWasCalled = false

        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: "Session started - vibe-experimental hooks active",
        })
      }

      if (event.type === "session.idle") {
        if (doWorkflowActive && !doneWasCalled && !escalateWasCalled) {
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message:
              "Session stopping with incomplete /do workflow! " +
              "Neither /done nor /escalate was called. " +
              "NOTE: OpenCode cannot block this stop - workflow may be incomplete.",
          })
        }
      }
    },

    /**
     * Before tool execution - gate skill calls and track workflow state
     * Converted from: pretool_escalate_hook.py (PreToolUse with "Skill" matcher)
     *
     * NOTE: OpenCode tool.execute.before uses `output.args` to modify args,
     * but there's no direct way to abort. We log warnings instead.
     */
    "tool.execute.before": async (input, output) => {
      // Only intercept skill tool calls
      if (input.tool !== "skill") return

      const args = output.args as { name?: string; arguments?: string } | undefined
      const skillName = args?.name

      if (!skillName) return

      // Track /do invocations
      if (skillName === "do" || skillName.endsWith("-vibe-experimental")) {
        if (skillName === "do" || skillName === "do-vibe-experimental") {
          // New /do resets the flow
          doWorkflowActive = true
          verifyWasCalled = false
          doneWasCalled = false
          escalateWasCalled = false
          await client.app.log({
            service: "vibe-experimental",
            level: "info",
            message: "/do workflow started",
          })
        }
      }

      // Track /verify
      if (skillName === "verify" || skillName === "verify-vibe-experimental") {
        if (doWorkflowActive) {
          verifyWasCalled = true
          await client.app.log({
            service: "vibe-experimental",
            level: "info",
            message: "/verify called in /do workflow",
          })
        }
      }

      // Track /done
      if (skillName === "done" || skillName === "done-vibe-experimental") {
        if (doWorkflowActive) {
          doneWasCalled = true
          await client.app.log({
            service: "vibe-experimental",
            level: "info",
            message: "/done called - workflow complete",
          })
        }
      }

      // Gate /escalate calls - log warning if conditions not met
      // NOTE: OpenCode tool.execute.before can't truly block like Claude Code's PreToolUse
      if (skillName === "escalate" || skillName === "escalate-vibe-experimental") {
        if (!doWorkflowActive) {
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message:
              "WARNING: /escalate called but no /do workflow is active. " +
              "/escalate is only valid during a /do workflow.",
          })
        } else if (!verifyWasCalled) {
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message:
              "WARNING: /escalate called without /verify first. " +
              "Run /verify to check acceptance criteria before escalating.",
          })
        } else {
          escalateWasCalled = true
          await client.app.log({
            service: "vibe-experimental",
            level: "info",
            message: "/escalate allowed after /verify",
          })
        }
      }
    },
  }
}

export default VibeExperimentalPlugin
