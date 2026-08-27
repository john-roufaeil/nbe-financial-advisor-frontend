import { z } from "zod";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import {
  HoldingInstrumentSchema,
  HoldingValuationSchema,
  InvestmentHoldingSchema,
  type HoldingInstrument,
  type HoldingValuation,
  type InvestmentHolding,
  type InvestmentHoldingInput,
} from "@/types/investment-holding";

export async function getInvestmentInstruments(): Promise<HoldingInstrument[]> {
  const response = await apiClient.get(API_ENDPOINTS.investmentInstruments);
  return z.array(HoldingInstrumentSchema).parse(response.data);
}

export async function getInvestmentHoldings(): Promise<InvestmentHolding[]> {
  const response = await apiClient.get(API_ENDPOINTS.investmentHoldings);
  return z.array(InvestmentHoldingSchema).parse(response.data);
}

export async function getHoldingValuation(): Promise<HoldingValuation> {
  const response = await apiClient.get(API_ENDPOINTS.investmentHoldingValuation);
  return HoldingValuationSchema.parse(response.data);
}

export async function createInvestmentHolding(
  input: InvestmentHoldingInput,
): Promise<InvestmentHolding> {
  const response = await apiClient.post(API_ENDPOINTS.investmentHoldings, input);
  return InvestmentHoldingSchema.parse(response.data);
}

export async function updateInvestmentHolding(
  id: string,
  input: Omit<InvestmentHoldingInput, "instrument_id">,
): Promise<InvestmentHolding> {
  const response = await apiClient.patch(API_ENDPOINTS.investmentHolding(id), input);
  return InvestmentHoldingSchema.parse(response.data);
}

export async function deleteInvestmentHolding(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.investmentHolding(id));
}
