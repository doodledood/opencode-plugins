import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Hook mapping:
 * - PreToolUse (matcher: "Skill") → tool.execute.before (CAN BLOCK via output.abort)
 * - Stop → session.idle (CANNOT BLOCK in OpenCode)
 *
 * NOTE: Both Python hooks rely on transcript parsing to detect /do workflow state.
 * OpenCode doesn't provide transcript access in hooks, so we use alternative approaches.
 */

export const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  // Track workflow state in memory (reset each session)
  // This is an imperfect workaround since we can't parse transcript
  let doWorkflowActive = false
  let verifyWasCalled = false
  let doneWasCalled = false
  let escalateWasCalled = false

  return {
    /**
     * Before tool execution - gate /escalate calls
     * Converted from: pretool_escalate_hook.py (PreToolUse with "Skill" matcher)
     *
     * Decision matrix:
     * - No /do: BLOCK (no flow to escalate from)
     * - /do + /verify: ALLOW (genuinely tried)
     * - /do only: BLOCK (must verify first)
     *
     * NOTE: Python version parses transcript to detect workflow state.
     * We track state in memory instead, which resets each session but
     * should work for typical single-session workflows.
     */
    "tool.execute.before": async (input, output) => {
      const toolName = input.call.name
      const toolInput = input.call.input as Record<string, unknown>

      // Track /do invocations (skill tool calling "do")
      if (toolName === "skill") {
        const skillName = toolInput.name as string | undefined

        if (skillName === "do" || skillName?.endsWith(":do")) {
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
          return
        }

        if (skillName === "verify" || skillName?.endsWith(":verify")) {
          if (doWorkflowActive) {
            verifyWasCalled = true
            await client.app.log({
              service: "vibe-experimental",
              level: "info",
              message: "/verify called in /do workflow",
            })
          }
          return
        }

        if (skillName === "done" || skillName?.endsWith(":done")) {
          if (doWorkflowActive) {
            doneWasCalled = true
            await client.app.log({
              service: "vibe-experimental",
              level: "info",
              message: "/done called - workflow complete",
            })
          }
          return
        }

        // Gate /escalate calls
        if (skillName === "escalate" || skillName?.endsWith(":escalate")) {
          // No /do in progress - can't escalate from nothing
          if (!doWorkflowActive) {
            output.abort =
              "Cannot escalate - no /do workflow is active. " +
              "/escalate is only valid during a /do workflow."
            await client.app.log({
              service: "vibe-experimental",
              level: "warn",
              message: "Blocked /escalate - no /do in progress",
            })
            return
          }

          // /verify was called - allow escalation
          if (verifyWasCalled) {
            escalateWasCalled = true
            await client.app.log({
              service: "vibe-experimental",
              level: "info",
              message: "/escalate allowed after /verify",
            })
            return
          }

          // /do was called but /verify was not - block
          output.abort =
            "Cannot escalate - must call /verify first. " +
            "Run /verify to check acceptance criteria, then escalate if genuinely stuck."
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message: "Blocked /escalate - /verify not called yet",
          })
          return
        }
      }
    },

    /**
     * Session idle - log when session is stopping
     * Converted from: stop_do_hook.py (Stop hook)
     *
     * LIMITATION: OpenCode's session.idle CANNOT BLOCK stopping.
     * The Python version blocks stop when:
     * - /do was called but neither /done nor /escalate was called
     *
     * In OpenCode, we can only log a warning.
     *
     * Decision matrix (Python behavior we cannot enforce):
     * - No /do: ALLOW (not in flow)
     * - /do + /done: ALLOW (verified complete)
     * - /do + /escalate: ALLOW (properly escalated)
     * - /do only: BLOCK (must verify first) <- CANNOT BLOCK IN OPENCODE
     * - /do + /verify only: BLOCK (verify returned failures) <- CANNOT BLOCK
     */
    "session.idle": async () => {
      if (doWorkflowActive && !doneWasCalled && !escalateWasCalled) {
        await client.app.log({
          service: "vibe-experimental",
          level: "warn",
          message:
            "Session stopping with incomplete /do workflow! " +
            "Neither /done nor /escalate was called. " +
            "NOTE: OpenCode cannot block this stop - workflow may be incomplete.",
        })
      } else {
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session idle - vibe-experimental workflow state clean",
        })
      }
    },
  }
}

export default VibeExperimentalPlugin
