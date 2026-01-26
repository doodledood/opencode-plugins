import type { Plugin } from "@opencode-ai/plugin"

/**
 * OpenCode hooks for vibe-workflow plugin.
 * Converted from Python hooks in claude-code-plugins.
 *
 * Original hooks:
 * - SessionStart: Inject reminders for codebase explorer and web researcher
 * - PostCompact: Re-anchor session after compaction with implement recovery
 * - PostToolUse (TaskUpdate): Remind to update log files after task completion
 * - Stop: Enforce task completion during implement workflows
 *
 * CONVERSION NOTES:
 * - Stop blocking: reactive simulation via session.idle + client.session.prompt
 * - additionalContext returns not supported - using system transform hooks instead
 * - API error detection: tracks session.error events to allow stops on API failures
 *   (prevents infinite blocking loops when API errors like 529 Overloaded occur)
 */

// Session reminder strings
const CODEBASE_EXPLORER_REMINDER = `When you need to find relevant files for a task - whether for answering questions, \
planning implementation, debugging, or onboarding - prefer using /explore-codebase \
instead of the built-in Explore agent. \
It returns a structural overview + prioritized file list with precise line ranges. For thorough+ \
queries, it automatically launches parallel agents to explore orthogonal angles (implementation, \
usage, tests, config) and synthesizes a comprehensive reading list.`

const WEB_RESEARCHER_REMINDER = `For non-trivial web research tasks - technology comparisons, best practices, API documentation, \
library evaluations, or any question requiring synthesis of multiple sources - prefer using \
/research-web instead of calling WebSearch directly. For thorough+ queries, it launches \
parallel investigators across orthogonal facets, continues waves until satisficed, and \
synthesizes findings with confidence levels and source citations.`

const IMPLEMENT_RECOVERY_REMINDER = `This session may have been in the middle of an implement workflow before compaction. \
If you were implementing a plan and haven't already read your working files in full, \
check for implementation log files in /tmp/ matching the implement-*.md pattern. If found, \
read the FULL log file to recover your progress - it typically contains a reference to \
the associated plan file (plan-*.md) which you should also read in full if not already \
loaded. Check your todo list for incomplete items, then resume from where you left off. \
Do not restart work that was already completed.`

const LOG_FILE_REMINDER = `If you're in an implement or implement-inplace workflow and just completed a task, \
consider updating your progress/log file in /tmp/ (implement-*.md or implement-progress.md) \
to reflect this completion. This helps maintain external memory for session recovery.`

function buildSystemReminder(content: string): string {
  return `<system-reminder>${content}</system-reminder>`
}

function buildSessionReminders(): string {
  return (
    buildSystemReminder(CODEBASE_EXPLORER_REMINDER) +
    "\n" +
    buildSystemReminder(WEB_RESEARCHER_REMINDER)
  )
}

export const VibeWorkflowPlugin: Plugin = async ({ client, $ }) => {
  // Per-session state for stop hook simulation
  const sessions = new Map<
    string,
    {
      resumeCount: number
      lastResumeAt: number
      lastErrorAt: number
    }
  >()

  const MAX_RESUMES = 3
  const MIN_MS_BETWEEN_RESUMES = 5_000

  async function shouldContinue(): Promise<{
    ok: boolean
    reason?: string
  }> {
    // Check for active implement workflow with incomplete work
    // Look for implement log files in /tmp that suggest an ongoing workflow
    try {
      const logFiles = await $`ls /tmp/implement-*.md 2>/dev/null`.text()
      if (logFiles.trim().length === 0) return { ok: false }

      // If implement log files exist, check if there are uncommitted changes
      // (suggesting work is still in progress)
      const diff = await $`git diff --name-only`.text()
      if (diff.trim().length > 0) {
        return {
          ok: true,
          reason:
            "Implement workflow appears active (log files in /tmp) and " +
            "working tree has uncommitted changes. Tasks may be incomplete.",
        }
      }
    } catch {
      // If checks fail, don't resume
    }

    return { ok: false }
  }

  return {
    /**
     * Event handler for session lifecycle events.
     *
     * Reactive stop hook simulation:
     * - On session.idle, checks for incomplete implement workflows
     * - If work appears incomplete, resumes session via client.session.prompt
     */
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          service: "vibe-workflow",
          level: "info",
          message: "Session started - vibe-workflow hooks active",
        })
      }

      // Track API errors to prevent infinite blocking loops
      if (event.type === "session.error") {
        const sessionID = event.properties.sessionID
        if (!sessions.has(sessionID)) {
          sessions.set(sessionID, {
            resumeCount: 0,
            lastResumeAt: 0,
            lastErrorAt: 0,
          })
        }
        sessions.get(sessionID)!.lastErrorAt = Date.now()
        await client.app.log({
          service: "vibe-workflow",
          level: "debug",
          message: "Session error detected - will allow stop if idle follows",
        })
      }

      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID
        const now = Date.now()

        if (!sessions.has(sessionID)) {
          sessions.set(sessionID, {
            resumeCount: 0,
            lastResumeAt: 0,
            lastErrorAt: 0,
          })
        }
        const state = sessions.get(sessionID)!

        // API errors (e.g., 529 Overloaded) are system failures, not voluntary stops.
        // Allow stop to prevent infinite blocking loops.
        if (state.lastErrorAt > 0 && now - state.lastErrorAt < 30_000) {
          await client.app.log({
            service: "vibe-workflow",
            level: "warn",
            message:
              "Recent API error detected - allowing stop to prevent infinite loop",
          })
          return
        }

        // Guardrails: cap total resumes and enforce debounce
        if (state.resumeCount >= MAX_RESUMES) return
        if (now - state.lastResumeAt < MIN_MS_BETWEEN_RESUMES) return

        const decision = await shouldContinue()
        if (!decision.ok) return

        state.resumeCount++
        state.lastResumeAt = now

        await client.app.log({
          service: "vibe-workflow",
          level: "warn",
          message: `Implement workflow incomplete - resuming session: ${decision.reason}`,
        })

        await client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [
              {
                type: "text",
                text:
                  "Do not stop yet. Continue until completion.\n" +
                  `Reason: ${decision.reason}\n\n` +
                  "Next steps:\n" +
                  "- Complete remaining tasks in your todo list.\n" +
                  "- Update your progress/log file in /tmp/.\n" +
                  "- Commit completed work.\n" +
                  "- Run /done when all tasks are complete.",
              },
            ],
          },
        })
      }
    },

    /**
     * System prompt transformation - inject context at session start.
     * Converted from: SessionStart hook (additionalContext)
     *
     * Injects reminders to prefer vibe-workflow agents over built-in alternatives.
     */
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(buildSessionReminders())
    },

    /**
     * Session compacting - preserve context during compaction.
     * Converted from: PostCompact / SessionStart with "compact" matcher
     *
     * Re-anchors session after compaction with:
     * 1. Standard session reminders (agent preferences)
     * 2. Implement workflow recovery reminder
     */
    "experimental.session.compacting": async (_input, output) => {
      // Add standard reminders
      output.context.push(buildSessionReminders())

      // Add implement recovery reminder
      // Note: We don't have transcript access to check if in implement workflow,
      // so we add the reminder unconditionally - it's harmless if not applicable
      output.context.push(buildSystemReminder(IMPLEMENT_RECOVERY_REMINDER))
    },

    /**
     * After tool execution - react to todo updates.
     * Converted from: PostToolUse hook with TaskUpdate matcher
     *
     * Reminds to update log files after task completion during implement workflows.
     *
     * NOTE: Cannot return additionalContext - just logging for now.
     * Consider using system transform hooks for persistent reminders.
     */
    "tool.execute.after": async (input, _output) => {
      // Only react to todowrite tool (OpenCode equivalent of TaskUpdate/TodoWrite)
      if (input.tool !== "todowrite") return

      // Log reminder about updating progress files
      // Note: We can't inject additionalContext like Claude Code, just log
      await client.app.log({
        service: "vibe-workflow",
        level: "debug",
        message: LOG_FILE_REMINDER,
      })
    },
  }
}

export default VibeWorkflowPlugin
