import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for manifest-dev plugin.
 * Converted from Python hooks in manifest-dev/hooks/.
 *
 * CONVERSION NOTES:
 *
 * 1. stop_do_hook.py → session.idle event + reactive resume
 *    - Original: Blocks stop if /do was called without /done or /escalate
 *    - OpenCode limitation: Cannot block stops synchronously
 *    - Implementation: Detect session.idle, check workflow state, call client.session.prompt
 *      to resume if /do is active without completion
 *    - TODO: Implement state tracking and reactive resume logic
 *
 * 2. pretool_verify_hook.py → tool.execute.before (limited)
 *    - Original: Injects reminder context when /verify is about to be called
 *    - OpenCode limitation: Cannot inject additionalContext from hooks
 *    - Implementation: Log warning only, or use system transform hooks
 *    - TODO: Consider if this can be handled differently
 *
 * 3. post_compact_hook.py → experimental.session.compacting
 *    - Original: Restores /do workflow context after compaction
 *    - OpenCode: Maps directly to experimental.session.compacting
 *    - Implementation: Push recovery reminder to output.context
 */

const ManifestDevPlugin: Plugin = async ({ client, $ }) => {
  // Per-session state for /do workflow tracking
  const doWorkflowState = new Map<string, {
    hasDoactive: boolean
    hasDone: boolean
    hasEscalate: boolean
    doArgs?: string
    idleCount: number
    lastIdleAt: number
  }>()

  const MAX_IDLE_RESUMES = 5
  const MIN_MS_BETWEEN_RESUMES = 5000

  return {
    /**
     * Session lifecycle events - implements reactive stop hook simulation
     */
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID
        const state = doWorkflowState.get(sessionID)

        // Not in /do workflow or already completed
        if (!state?.hasDoactive || state.hasDone || state.hasEscalate) {
          return
        }

        // Guardrails
        const now = Date.now()
        if (state.idleCount >= MAX_IDLE_RESUMES) return
        if (now - state.lastIdleAt < MIN_MS_BETWEEN_RESUMES) return

        state.idleCount++
        state.lastIdleAt = now
        doWorkflowState.set(sessionID, state)

        // Resume with reminder to complete workflow
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [{
              type: "text",
              text:
                "Stop blocked: /do workflow requires formal exit.\n\n" +
                "Options:\n" +
                "1. Run /verify to check criteria - if all pass, /verify calls /done\n" +
                "2. Call /escalate - for blocking issues OR user-requested pauses\n\n" +
                "Choose one to proceed.",
            }],
          },
        })
      }
    },

    /**
     * Session compacting - restore /do workflow context
     * Converted from: post_compact_hook.py
     */
    "experimental.session.compacting": async (input, output) => {
      const state = doWorkflowState.get(input.sessionID)

      // Not in /do workflow or already completed
      if (!state?.hasDoactive || state.hasDone || state.hasEscalate) {
        return
      }

      const reminder = state.doArgs
        ? `This session was compacted during an active /do workflow. Context may have been lost.

CRITICAL: Before continuing, read the manifest and execution log in FULL.

The /do was invoked with: ${state.doArgs}

1. Read the manifest file - contains deliverables, acceptance criteria, and approach
2. Check /tmp/ for your execution log (do-log-*.md) and read it to recover progress

Do not restart completed work. Resume from where you left off.`
        : `This session was compacted during an active /do workflow. Context may have been lost.

CRITICAL: Before continuing, recover your workflow context:

1. Check /tmp/ for execution logs matching do-log-*.md
2. The log references the manifest file path - read both in FULL

Do not restart completed work. Resume from where you left off.`

      output.context.push(`<system-reminder>${reminder}</system-reminder>`)
    },

    /**
     * Tool execution tracking - detect /do, /done, /escalate, /verify calls
     * Note: This only fires for primary agent, not subagents
     */
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "skill") return

      const args = output.metadata as { name?: string; arguments?: string } | undefined
      const skillName = args?.name

      if (!skillName) return

      let state = doWorkflowState.get(input.sessionID) ?? {
        hasDoactive: false,
        hasDone: false,
        hasEscalate: false,
        idleCount: 0,
        lastIdleAt: 0,
      }

      if (skillName === "do" || skillName.endsWith(":do")) {
        state.hasDoactive = true
        state.doArgs = args?.arguments
        state.hasDone = false
        state.hasEscalate = false
      } else if (skillName === "done" || skillName.endsWith(":done")) {
        state.hasDone = true
      } else if (skillName === "escalate" || skillName.endsWith(":escalate")) {
        state.hasEscalate = true
      }

      doWorkflowState.set(input.sessionID, state)
    },
  }
}

export default ManifestDevPlugin
