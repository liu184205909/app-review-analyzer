/**
 * Feature flags configuration
 * Controls which features are enabled in the application
 */

export const FEATURES = {
  // Subscription/Payment features
  SUBSCRIPTIONS_ENABLED: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true',
  
  // Add more feature flags as needed
  // ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  // EXPERIMENTAL_FEATURES: process.env.NEXT_PUBLIC_EXPERIMENTAL === 'true',
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

