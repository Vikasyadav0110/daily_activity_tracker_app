import { useProStore } from '@store/proStore';
import type { ProFeatureKey } from '@services/subscription/subscriptionService';

/**
 * Returns whether the given Pro feature is accessible.
 * All features are free while isPro=false (gate logic in UI, not here).
 * Use this hook to read gating status and conditionally show paywalls.
 */
export function useProFeature(_feature: ProFeatureKey): {
  isUnlocked: boolean;
  isPro: boolean;
} {
  const isPro = useProStore((s) => s.isPro);
  // In the future, some features may be gated differently (e.g. free tier with limits).
  // For now: all listed Pro features require isPro === true.
  return { isUnlocked: isPro, isPro };
}
