/**
 * Small E.164-shaped format check shared by onboarding and profile editing.
 * It validates syntax only; no SMS/phone ownership verification is performed.
 */
export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
