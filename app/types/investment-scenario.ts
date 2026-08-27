import { z } from "zod";

export const InvestmentAllocationSchema = z.object({
  instrument_id: z.string().uuid(),
  instrument_code: z.string(),
  display_name: z.string(),
  asset_class: z.enum(["gold", "fund", "currency"]),
  percentage: z.number().min(0).max(100),
  target_amount: z.number().min(0),
  unit_price: z.number().positive(),
  price_currency: z.literal("EGP"),
  unit: z.string(),
  price_type: z.enum(["spot", "nav", "market_price", "customer_buy_rate"]),
  minimum_increment: z.number().positive(),
  quantity: z.number().min(0),
  actual_allocated_amount: z.number().min(0),
  unallocated_remainder: z.number().min(0),
  observed_at: z.string(),
  source: z.string(),
  mode: z.enum(["live", "mock", "user_supplied"]),
  priority: z.number().int().min(1).max(3).optional(),
  match_factors: z
    .array(z.enum(["objective", "risk", "horizon", "liquidity", "closest_available"]))
    .max(5)
    .optional(),
});

export const InvestmentPlanPayloadSchema = z.object({
  confirmed_amount: z.number().positive(),
  currency: z.literal("EGP"),
  allocations: z.array(InvestmentAllocationSchema).min(1).max(3),
  total_allocated: z.number().min(0),
  total_remainder: z.number().min(0),
  disclaimer: z.string(),
  saved: z.boolean().optional(),
  /** Legacy chat cards used this label before saved plans existed. */
  confirmed: z.boolean().optional(),
});

export const InvestmentAllocationStateSchema = z.object({
  instrument_id: z.string().uuid(),
  state: z.enum(["planned", "purchased"]),
  holding_id: z.string().uuid().nullable(),
  recorded_at: z.string().nullable(),
});

export const SavedInvestmentScenarioSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(["saved", "archived"]),
  payload: InvestmentPlanPayloadSchema,
  source_message_id: z.string().uuid().nullable(),
  source_conversation_id: z.string().uuid().nullable(),
  quote_status: z.enum([
    "current",
    "needs_refresh",
    "unavailable",
    "mock",
    "user_supplied",
  ]),
  oldest_observed_at: z.string().nullable(),
  allocation_states: z.array(InvestmentAllocationStateSchema),
  saved_at: z.string(),
  updated_at: z.string(),
});

export type InvestmentPlanPayload = z.infer<typeof InvestmentPlanPayloadSchema>;
export type InvestmentAllocation = z.infer<typeof InvestmentAllocationSchema>;
export type SavedInvestmentScenario = z.infer<typeof SavedInvestmentScenarioSchema>;
export type SavedInvestmentScenarioStatus = SavedInvestmentScenario["status"];
export type PlannedPurchaseInput = {
  quantity: number;
  unit_price: number;
  fees: number;
  purchased_at: string;
};
export type PlannedAllocationInput = {
  target_amount?: number;
  unit_price?: number;
  quantity?: number;
};
