import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";
import { TransactionsListTool } from "@/components/chat/tools/TransactionsListTool";
import { SavingsSliderTool } from "@/components/chat/tools/SavingsSliderTool";
import { AllocationSliderTool } from "@/components/chat/tools/AllocationSliderTool";
import { ProductCardTool } from "@/components/chat/tools/ProductCardTool";

/**
 * Map of tool name → renderer, passed to MessagePrimitive.Parts `tools.by_name`.
 * Keys must match the backend's `widget.type` string exactly (see
 * parseToolCall in app/api/chat.ts). Checked directly against
 * ai-service/app/features/chat/schemas/widgets.py (the `Widget` discriminated
 * union): `allocation_slider` (agents/planner.py) and `product_card`
 * (agents/recommendation.py) are the only two widget types that exist on the
 * backend today. `showSpendingBreakdown`, `showTransactions`, and
 * `showSavingsSlider` don't correspond to anything the backend can send —
 * they're speculative front-end-only names with no matching widget type —
 * see CHATBOT_BACKEND_INTEGRATION.md (repo root) for the handoff to get
 * matching widgets built; once shipped, rekey these three to whatever
 * `type` string the backend actually sends.
 */
export const chatToolComponents = {
  showSpendingBreakdown: SpendingBreakdownTool,
  showTransactions: TransactionsListTool,
  showSavingsSlider: SavingsSliderTool,
  allocation_slider: AllocationSliderTool,
  product_card: ProductCardTool,
};
