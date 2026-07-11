export interface FinancialGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  duration: number;
  percentageComplete?: number;
  projectedCompletionDate?: string;
  onTrack?: boolean;
}
