import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";
import { TransactionsListTool } from "@/components/chat/tools/TransactionsListTool";
import { SavingsSliderTool } from "@/components/chat/tools/SavingsSliderTool";
import { AllocationSliderTool } from "@/components/chat/tools/AllocationSliderTool";
import { ProductCardTool } from "@/components/chat/tools/ProductCardTool";

// Map of tool name -> renderer, passed to MessagePrimitive.Parts `tools.by_name`.
// Keys must match the backend's `widget.type` exactly. All five widget types now
// exist on the backend; the three former placeholder names (showSpendingBreakdown,
// showTransactions, showSavingsSlider) never matched anything the backend could
// send, which is why those renderers never fired.
export const chatToolComponents = {
  spending_breakdown: SpendingBreakdownTool,
  transactions_list: TransactionsListTool,
  savings_slider: SavingsSliderTool,
  allocation_slider: AllocationSliderTool,
  product_card: ProductCardTool,
};
