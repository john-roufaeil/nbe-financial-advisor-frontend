export const GOAL_TARGET_MIN = 1_000;
export const GOAL_TARGET_MAX = 10_000_000;
export const GOAL_TARGET_STEP = 1_000;

export const GOAL_MONTHS_MIN = 1;
export const GOAL_MONTHS_MAX = 120;

export const MONTHLY_INCOME_MIN = 0;
export const MONTHLY_INCOME_MAX = 100_000;
export const MONTHLY_INCOME_STEP = 500;

export const DEPENDENTS_MIN = 0;
export const DEPENDENTS_MAX = 10;

// Upper bound for the transactions amount-filter sliders' thumb travel —
// the paired number inputs still accept any value up to MAX_MONEY_VALUE;
// this just caps where dragging the slider stays useful.
export const TRANSACTION_AMOUNT_FILTER_MAX = 10_000;

export const QUERY_RETRY_COUNT = 2;
export const MUTATION_RETRY_COUNT = 0;
export const BYTES_PER_KB = 1024;

// Must match the backend's CHAT_MESSAGE_MAX_LENGTH (core/constants.py) —
// the backend is the source of truth (a 422 rejects anything over this),
// this just stops the user from typing past it in the first place.
export const CHAT_MESSAGE_MAX_LENGTH = 4000;
