import { create } from 'zustand';
import { supabase } from '@services/supabase/client';

export interface Region {
  code: string;
  name: string;
  currency: string;
  currency_symbol: string;
  tax_label: string;
  tax_rate: number;
}

export interface StripePriceRow {
  plan: string;
  amount: number;
  currency: string;
  interval: string | null;
}

interface RegionStore {
  region: Region;
  prices: StripePriceRow[];
  loaded: boolean;
  setRegion: (region: Region) => void;
  loadRegion: (regionCode?: string) => Promise<void>;
}

const DEFAULT_REGION: Region = {
  code: 'IN',
  name: 'India',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GST',
  tax_rate: 0.18,
};

export const useRegionStore = create<RegionStore>((set, get) => ({
  region: DEFAULT_REGION,
  prices: [],
  loaded: false,

  setRegion: (region) => {
    set({ region });
    get().loadRegion(region.code);
  },

  loadRegion: async (regionCode?: string) => {
    const code = regionCode ?? get().region.code;

    const [regionRes, pricesRes] = await Promise.all([
      supabase.from('regions').select('code, name, currency, currency_symbol, tax_label, tax_rate')
        .eq('code', code).maybeSingle(),
      supabase.from('stripe_prices').select('plan, amount, currency, interval')
        .eq('region_code', code).eq('is_active', true),
    ]);

    const region = regionRes.data ?? DEFAULT_REGION;
    const prices = pricesRes.data ?? [];
    set({ region: region as Region, prices: prices as StripePriceRow[], loaded: true });
  },
}));

/** Detect user's region from IP via a free geo API, fall back to 'IN' */
export async function detectRegionCode(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json() as { country_code?: string };
    const code = data.country_code?.toUpperCase();
    // Map to supported regions
    const supported = ['IN', 'US', 'GB', 'SG', 'AU', 'DE', 'FR', 'JP'];
    return supported.includes(code ?? '') ? code! : 'US';
  } catch {
    return 'IN';
  }
}

/** Format a price amount (in smallest unit) to display string */
export function formatPrice(amount: number, currency: string, symbol: string): string {
  const major = currency === 'JPY' ? amount : amount / 100;
  const formatted = currency === 'JPY'
    ? major.toLocaleString('en')
    : major.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${symbol}${formatted}`;
}
