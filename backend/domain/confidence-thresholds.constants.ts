export const ConfidenceThreshold = {
  DEFAULT: 0.85,
  HIGH: 0.90,
  MEDIUM: 0.75,
  LOW: 0.60,
} as const;

export type ConfidenceThresholdValue = typeof ConfidenceThreshold[keyof typeof ConfidenceThreshold];