import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";

/** Map of tool name → renderer, passed to MessagePrimitive.Parts `tools.by_name`. */
export const chatToolComponents = {
  showSpendingBreakdown: SpendingBreakdownTool,
};
