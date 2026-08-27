import { z } from "zod";

const decimal = z.coerce.number().finite();

export const HoldingInstrumentSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  display_name: z.string(),
  asset_class: z.enum(["gold", "fund", "currency"]),
  price_currency: z.literal("EGP"),
  unit: z.string(),
  price_type: z.enum(["spot", "nav", "market_price", "customer_buy_rate"]),
  minimum_increment: decimal.positive(),
  fractional_units_supported: z.boolean(),
});

export const InvestmentHoldingSchema = z.object({
  id: z.string().uuid(),
  instrument: HoldingInstrumentSchema,
  quantity: decimal.positive(),
  average_purchase_price: decimal.positive(),
  fees: decimal.nonnegative(),
  purchased_at: z.string().nullable(),
  cost_basis: decimal.positive(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HoldingValuationItemSchema = z.object({
  holding: InvestmentHoldingSchema,
  quote_status: z.enum(["current", "needs_refresh", "unavailable", "disabled"]),
  current_price: decimal.positive().nullable(),
  current_value: decimal.nonnegative().nullable(),
  gain_loss: decimal.nullable(),
  gain_loss_percentage: decimal.nullable(),
  observed_at: z.string().nullable(),
  source: z.string().nullable(),
});

export const HoldingValuationSchema = z.object({
  feature_status: z.enum(["enabled", "disabled"]),
  refreshed_at: z.string(),
  is_complete: z.boolean(),
  priced_holding_count: z.number().int().nonnegative(),
  total_holding_count: z.number().int().nonnegative(),
  total_cost_basis: decimal.nonnegative(),
  total_current_value: decimal.nonnegative().nullable(),
  total_gain_loss: decimal.nullable(),
  total_gain_loss_percentage: decimal.nullable(),
  holdings: z.array(HoldingValuationItemSchema),
});

export const InvestmentHoldingInputSchema = z.object({
  instrument_id: z.string().uuid().optional(),
  quantity: z.number().positive(),
  average_purchase_price: z.number().positive(),
  fees: z.number().nonnegative().optional(),
  purchased_at: z.string().nullable().optional(),
});

export type HoldingInstrument = z.infer<typeof HoldingInstrumentSchema>;
export type InvestmentHolding = z.infer<typeof InvestmentHoldingSchema>;
export type HoldingValuationItem = z.infer<typeof HoldingValuationItemSchema>;
export type HoldingValuation = z.infer<typeof HoldingValuationSchema>;
export type InvestmentHoldingInput = z.infer<typeof InvestmentHoldingInputSchema>;
