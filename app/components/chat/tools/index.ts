import { SpendingBreakdownTool } from "@/components/chat/tools/SpendingBreakdownTool";
import { TransactionsListTool } from "@/components/chat/tools/TransactionsListTool";
import { SavingsSliderTool } from "@/components/chat/tools/SavingsSliderTool";

/** Map of tool name → renderer, passed to MessagePrimitive.Parts `tools.by_name`. */
export const chatToolComponents = {
  showSpendingBreakdown: SpendingBreakdownTool,
  showTransactions: TransactionsListTool,
  showSavingsSlider: SavingsSliderTool,
};
