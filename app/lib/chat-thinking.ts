import type { ChatThinkingStep } from "@/types/chat";

/**
 * Collapses a turn's tool-call steps to one row per distinct tool, for
 * display only — the underlying data (persisted Message.thinking_json,
 * the live use-chat-tool-status-store) stays call_id-keyed and untouched,
 * since correctness there depends on tracking every individual call.
 *
 * The analysis agent's tool loop can legitimately call the same tool more
 * than once in one turn (e.g. retrying compute_aggregate with a different
 * filter after an empty result) — each call is a real, distinct action
 * with its own call_id, but they render with the identical label, which
 * reads as a bug ("the phrase repeats") rather than the agent trying
 * again. Showing one row per tool avoids that, at the cost of not
 * distinguishing "called once" from "called N times" in the UI — a
 * deliberate simplification given this is a lightweight thinking
 * indicator, not a detailed execution log.
 *
 * A tool's merged row is "started" (still spinning) if any of its
 * occurrences hasn't completed yet, and "completed" only once every
 * occurrence has. Row order follows first occurrence.
 *
 * The `agent` step (at most one per turn, already unique by construction —
 * see AgentSelectedEvent) passes through untouched; only `kind: "tool"`
 * steps go through the per-tool merge above.
 */
export function dedupeThinkingStepsForDisplay(
  steps: ChatThinkingStep[],
): ChatThinkingStep[] {
  const order: string[] = [];
  const byTool = new Map<string, Extract<ChatThinkingStep, { kind: "tool" }>>();
  const agentSteps: ChatThinkingStep[] = [];

  for (const step of steps) {
    if (step.kind === "agent") {
      agentSteps.push(step);
      continue;
    }
    const existing = byTool.get(step.tool);
    if (!existing) {
      order.push(step.tool);
      byTool.set(step.tool, step);
      continue;
    }
    if (existing.status === "completed" && step.status === "started") {
      // A later occurrence of this tool started again after an earlier one
      // finished — the row must go back to "started" until this one also
      // completes, not stay stuck showing the earlier, unrelated checkmark.
      byTool.set(step.tool, step);
    } else if (existing.status === "started" && step.status === "completed") {
      byTool.set(step.tool, { ...existing, status: "completed" });
    }
  }

  return [...agentSteps, ...order.map((tool) => byTool.get(tool)!)];
}
