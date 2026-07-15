export const featureFlags = {
  validateNisnAgainstDapodik: false,

  validateNpsnAgainstDapodik: false,
} as const;

export type FeatureFlags = typeof featureFlags;
