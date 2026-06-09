import { useProStore } from '@store/proStore';
import type { PremiumPlusFeatureKey } from '@services/subscription/subscriptionService';

export function usePremiumPlusFeature(_feature: PremiumPlusFeatureKey): boolean {
  return useProStore((s) => s.isPremiumPlus);
}
