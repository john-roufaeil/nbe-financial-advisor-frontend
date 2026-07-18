import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";
import { TransactionsListTool } from "@/components/chat/tools/TransactionsListTool";
import { SavingsSliderTool } from "@/components/chat/tools/SavingsSliderTool";
import { AllocationSliderTool } from "@/components/chat/tools/AllocationSliderTool";

/**
 * Map of tool name → renderer, passed to MessagePrimitive.Parts `tools.by_name`.
 * Keys must match the backend's `widget.type` string exactly (see
 * parseToolCall in app/api/chat.ts) — `allocation_slider` is confirmed
 * against a live response; the other three are speculative front-end-only
 * names pending backend confirmation (see CHATBOT_BACKEND_INTEGRATION.md).
 */
export const chatToolComponents = {
  showSpendingBreakdown: SpendingBreakdownTool,
  showTransactions: TransactionsListTool,
  showSavingsSlider: SavingsSliderTool,
  allocation_slider: AllocationSliderTool,
};
