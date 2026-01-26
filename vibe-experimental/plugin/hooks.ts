import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-experimental plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Original hooks:
 * - PreToolUse (Skill/escalate): Gate escalate calls - require verify before escalation
 * - Stop: Enforce /done or /escalate before stopping during /do workflow
 *
 * CONVERSION NOTES:
 * - PreToolUse blocking: uses `throw` in tool.execute.before (primary agent only)
 * - Stop blocking: reactive simulation via session.idle + client.session.prompt
 * - API error detection: tracks session.error events to allow stops on API failures
 *   (prevents infinite blocking loops when API errors like 529 Overloaded occur)
 */

export const VibeExperimentalPlugin: Plugin = async ({ client }) => {
  // Per-session workflow state tracking
  const sessions = new Map<
    string,
    {
      doInvoked: boolean
      verifyInvoked: boolean
      doneOrEscalateInvoked: boolean
      resumeCount: number
      lastResumeAt: number
      lastErrorAt: number
    }
  >()

  const MAX_RESUMES = 3
  const MIN_MS_BETWEEN_RESUMES = 5_000

  // Track the active session for tool hooks (which don't receive session ID)
  let activeSessionID: string | undefined

  function getSession(id: string) {
    if (!sessions.has(id)) {
      sessions.set(id, {
        doInvoked: false,
        verifyInvoked: false,
        doneOrEscalateInvoked: false,
        resumeCount: 0,
        lastResumeAt: 0,
        lastErrorAt: 0,
      })
    }
    return sessions.get(id)!
  }

  return {
    /**
     * Event handler for session lifecycle events.
     *
     * Reactive stop hook simulation:
     * - Tracks session creation for state management
     * - On session.idle, checks if /do workflow is incomplete
     * - If /do was called but neither /done nor /escalate invoked, resumes session
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const sessionID = event.properties.sessionID
        activeSessionID = sessionID
        getSession(sessionID)
        await client.app.log({
          service: "vibe-experimental",
          level: "info",
          message: "Session started - vibe-experimental hooks active",
        })
      }

      // Track API errors to prevent infinite blocking loops
      if (event.type === "session.error") {
        const sessionID = event.properties.sessionID
        const state = getSession(sessionID)
        state.lastErrorAt = Date.now()
        await client.app.log({
          service: "vibe-experimental",
          level: "debug",
          message: "Session error detected - will allow stop if idle follows",
        })
      }

      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID
        const state = getSession(sessionID)

        // Reactive stop hook simulation:
        // If /do was invoked but neither /done nor /escalate was called, resume session
        if (!state.doInvoked || state.doneOrEscalateInvoked) return

        const now = Date.now()

        // API errors (e.g., 529 Overloaded) are system failures, not voluntary stops.
        // Allow stop to prevent infinite blocking loops.
        if (state.lastErrorAt > 0 && now - state.lastErrorAt < 30_000) {
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message:
              "Recent API error detected - allowing stop to prevent infinite loop",
          })
          return
        }
        if (state.resumeCount >= MAX_RESUMES) {
          await client.app.log({
            service: "vibe-experimental",
            level: "warn",
            message:
              "Max resume attempts reached for /do workflow enforcement",
          })
          return
        }
        if (now - state.lastResumeAt < MIN_MS_BETWEEN_RESUMES) return

        state.resumeCount++
        state.lastResumeAt = now

        await client.app.log({
          service: "vibe-experimental",
          level: "warn",
          message: "/do workflow incomplete - resuming session",
        })

        await client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [
              {
                type: "text",
                text:
                  "Do not stop yet. The /do workflow is not complete.\n" +
                  "You must either:\n" +
                  "- Run /verify to check acceptance criteria, then /done or /escalate\n" +
                  "- Run /escalate if you are blocked\n\n" +
                  "Continue working on the current task.",
              },
            ],
          },
        })
      }
    },

    /**
     * Before tool execution - block escalate without verify, track workflow state.
     * Converted from: PreToolUse hook with Skill/escalate matcher
     *
     * Uses `throw` to block execution when escalate is called without prior verify.
     * NOTE: Only fires for primary agent -- not subagent or MCP tool calls.
     */
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "skill") return

      const args = output.args as { name?: string } | undefined
      const skillName = args?.name ?? ""

      if (!activeSessionID) return
      const state = getSession(activeSessionID)

      // Track workflow skill invocations
      if (skillName === "do" || skillName.endsWith("-do")) {
        state.doInvoked = true
      }
      if (skillName === "verify" || skillName.endsWith("-verify")) {
        state.verifyInvoked = true
      }
      if (
        skillName === "done" ||
        skillName.endsWith("-done") ||
        skillName === "escalate" ||
        skillName.endsWith("-escalate")
      ) {
        state.doneOrEscalateInvoked = true
      }

      // Block escalate if verify wasn't called first
      if (skillName === "escalate" || skillName.endsWith("-escalate")) {
        if (!state.verifyInvoked) {
          throw new Error(
            "Blocked: /escalate requires /verify to be called first. " +
              "Run /verify to check acceptance criteria before escalating.",
          )
        }
      }
    },
  }
}

export default VibeExperimentalPlugin
