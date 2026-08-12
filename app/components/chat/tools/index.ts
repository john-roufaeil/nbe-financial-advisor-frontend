import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";
import { TransactionsListTool } from "@/components/chat/tools/TransactionsListTool";
import { SavingsSliderTool } from "@/components/chat/tools/SavingsSliderTool";
import { AllocationSliderTool } from "@/components/chat/tools/AllocationSliderTool";
import { ProductCardTool } from "@/components/chat/tools/ProductCardTool";

// Map of tool name -> renderer, passed to MessagePrimitive.Parts `tools.by_name`.
// Keys must match the backend's `widget.type` exactly. Only `allocation_slider` and
// `product_card` exist on the backend today; the other three are speculative names
// with no matching widget type yet (see CHATBOT_BACKEND_INTEGRATION.md).
export const chatToolComponents = {
  showSpendingBreakdown: SpendingBreakdownTool,
  showTransactions: TransactionsListTool,
  showSavingsSlider: SavingsSliderTool,
  allocation_slider: AllocationSliderTool,
  product_card: ProductCardTool,
};
