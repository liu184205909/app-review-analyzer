/**
 * Feature flags configuration
 * Controls which features are enabled in the application
 */

// Safe environment variable access with defaults
function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  if (typeof process === 'undefined') return defaultValue;
  const value = process.env[key];
  if (value === undefined || value === null) return defaultValue;
  return value === 'true';
}

export const FEATURES = {
  // Subscription/Payment features (default: false)
  SUBSCRIPTIONS_ENABLED: getEnvBool('NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS', false),
  
  // Add more feature flags as needed
  // ANALYTICS_ENABLED: getEnvBool('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
  // EXPERIMENTAL_FEATURES: getEnvBool('NEXT_PUBLIC_EXPERIMENTAL', false),
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

