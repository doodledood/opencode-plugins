import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Original hooks:
 * - Stop hook: Blocked stopping during /do workflow if verification incomplete
 * - PreToolUse hook: Gated /escalate calls - required /verify before escalation
 *
 * LIMITATIONS:
 * - Stop blocking is NOT supported in OpenCode - using warning logs instead
 * - PreToolUse blocking uses permission.ask hook for deny behavior
 * - Transcript parsing not available - using session state tracking instead
 */

// Session state tracking (per-session workflow state)
interface DoFlowState {
  hasDo: boolean
  hasVerify: boolean
  hasDone: boolean
  hasEscalate: boolean
}

const sessionStates = new Map<string, DoFlowState>()

function getSessionState(sessionID: string): DoFlowState {
  if (!sessionStates.has(sessionID)) {
    sessionStates.set(sessionID, {
      hasDo: false,
      hasVerify: false,
      hasDone: false,
      hasEscalate: false,
    })
  }
  return sessionStates.get(sessionID)!
}

function resetDoFlow(sessionID: string): void {
  sessionStates.set(sessionID, {
    hasDo: true,
    hasVerify: false,
    hasDone: false,
    hasEscalate: false,
  })
}

export const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  return {
    /**
     * Event handler for session lifecycle events.
     * Cleans up session state when sessions end.
     */
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const sessionID = (event as { sessionID?: string }).sessionID
        if (sessionID) {
          sessionStates.delete(sessionID)
        }
      }

      // LIMITATION: session.idle cannot block stopping
      // Log warning if stopping with incomplete /do flow
      if (event.type === "session.idle") {
        const sessionID = (event as { sessionID?: string }).sessionID
        if (sessionID) {
          const state = getSessionState(sessionID)
          if (state.hasDo && !state.hasDone && !state.hasEscalate) {
            await client.app.log({
              service: "vibe-experimental",
              level: "warn",
              message:
                "Session stopping with incomplete /do workflow. " +
                "Run skill({ name: \"verify\" }) to check acceptance criteria. " +
                "If all criteria pass, it will call skill({ name: \"done\" }). " +
                "If genuinely stuck, call skill({ name: \"escalate\" }).",
            })
          }
        }
      }
    },

    /**
     * Track skill invocations to maintain workflow state.
     * Monitors: do, verify, done, escalate skill calls.
     */
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "skill") return

      const args = output.metadata?.args as { name?: string } | undefined
      const skillName = args?.name

      if (!skillName) return

      const state = getSessionState(input.sessionID)

      // Normalize skill name (remove plugin prefix if present)
      const normalizedName = skillName.includes("-")
        ? skillName.split("-").pop()
        : skillName

      switch (normalizedName) {
        case "do":
          // New /do resets the flow
          resetDoFlow(input.sessionID)
          await client.app.log({
            service: "vibe-experimental",
            level: "info",
            message: "/do workflow started",
          })
          break

        case "verify":
          if (state.hasDo) {
            state.hasVerify = true
            await client.app.log({
              service: "vibe-experimental",
              level: "debug",
              message: "/verify called in /do workflow",
            })
          }
          break

        case "done":
          if (state.hasDo) {
            state.hasDone = true
            await client.app.log({
              service: "vibe-experimental",
              level: "info",
              message: "/do workflow completed via /done",
            })
          }
          break

        case "escalate":
          if (state.hasDo) {
            state.hasEscalate = true
            await client.app.log({
              service: "vibe-experimental",
              level: "info",
              message: "/do workflow escalated",
            })
          }
          break
      }
    },

    /**
     * Gate /escalate calls - require /verify before escalation.
     * Converted from PreToolUse blocking hook.
     *
     * Decision matrix:
     * - No /do: DENY (no flow to escalate from)
     * - /do + /verify: ALLOW (genuinely tried)
     * - /do only: DENY (must verify first)
     */
    "permission.ask": async (input, output) => {
      // Only gate skill tool calls
      if (input.tool !== "skill") return

      const args = input.args as { name?: string } | undefined
      const skillName = args?.name

      if (!skillName) return

      // Only gate escalate skill
      const normalizedName = skillName.includes("-")
        ? skillName.split("-").pop()
        : skillName

      if (normalizedName !== "escalate") return

      const state = getSessionState(input.sessionID)

      // No /do in progress - can't escalate from nothing
      if (!state.hasDo) {
        output.status = "deny"
        await client.app.log({
          service: "vibe-experimental",
          level: "warn",
          message:
            "Cannot escalate - no /do workflow is active. " +
            "/escalate is only valid during a /do workflow.",
        })
        return
      }

      // /verify was called - allow escalation
      if (state.hasVerify) {
        output.status = "allow"
        return
      }

      // /do was called but /verify was not - block
      output.status = "deny"
      await client.app.log({
        service: "vibe-experimental",
        level: "warn",
        message:
          "Cannot escalate - must call skill({ name: \"verify\" }) first. " +
          "Run verification to check acceptance criteria, then escalate if genuinely stuck.",
      })
    },

    /**
     * System prompt additions for /do workflow context.
     */
    "experimental.chat.system.transform": async (input, output) => {
      const state = getSessionState(input.sessionID)

      if (state.hasDo && !state.hasDone && !state.hasEscalate) {
        output.system.push(
          `<system-reminder>` +
            `You are in an active /do workflow. ` +
            `Before stopping or claiming completion, you MUST call skill({ name: "verify" }) ` +
            `to check acceptance criteria. If verification passes, it calls skill({ name: "done" }). ` +
            `If genuinely stuck after verification, call skill({ name: "escalate" }) with evidence.` +
            `</system-reminder>`
        )
      }
    },

    /**
     * Preserve workflow state during session compaction.
     */
    "experimental.session.compacting": async (input, output) => {
      const state = getSessionState(input.sessionID)

      if (state.hasDo) {
        output.context.push(
          `<preserved-state type="vibe-experimental-workflow">` +
            `Active /do workflow. ` +
            `Verified: ${state.hasVerify ? "yes" : "no"}. ` +
            `Completed: ${state.hasDone ? "yes" : "no"}. ` +
            `Escalated: ${state.hasEscalate ? "yes" : "no"}.` +
            `</preserved-state>`
        )
      }
    },
  }
}

export default VibeExperimentalPlugin
