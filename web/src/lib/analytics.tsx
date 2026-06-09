'use client';

// PostHog analytics provider — activated when NEXT_PUBLIC_POSTHOG_KEY is set in .env
// Install first: npm install posthog-js
// Then uncomment the real PostHog init below.

import { createContext, useContext, useEffect, ReactNode } from 'react';

interface AnalyticsContextType {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  capture: () => undefined,
  identify: () => undefined,
  reset: () => undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let posthog: any = null;

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Uncomment after: npm install posthog-js
    /*
    import('posthog-js').then(({ default: ph }) => {
      ph.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
        capture_pageview: false,
        persistence: 'localStorage',
        autocapture: false,
      });
      posthog = ph;
    });
    */

    console.log('[PostHog stub] key configured — uncomment posthog-js import to activate');
  }, []);

  function capture(event: string, properties?: Record<string, unknown>) {
    if (posthog) posthog.capture(event, properties);
  }

  function identify(userId: string, traits?: Record<string, unknown>) {
    if (posthog) posthog.identify(userId, traits);
  }

  function reset() {
    if (posthog) posthog.reset();
  }

  return (
    <AnalyticsContext.Provider value={{ capture, identify, reset }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

// Pre-defined event constants for consistency across the codebase
export const EVENTS = {
  // Auth
  SIGN_UP: 'user.signed_up',
  SIGN_IN: 'user.signed_in',
  SIGN_OUT: 'user.signed_out',

  // Activities
  ACTIVITY_LOGGED: 'activity.logged',
  ACTIVITY_CREATED: 'activity.created',
  ACTIVITY_DELETED: 'activity.deleted',

  // Wellness
  MOOD_LOGGED: 'mood.logged',

  // Marketplace
  PROGRAM_VIEWED: 'marketplace.program_viewed',
  PROGRAM_ENROLLED: 'marketplace.program_enrolled',
  PROGRAM_CREATED: 'marketplace.program_created',

  // Enterprise
  ORG_CREATED: 'enterprise.org_created',
  MEMBER_INVITED: 'enterprise.member_invited',
  SSO_CONFIGURED: 'enterprise.sso_configured',

  // Social
  FRIEND_ADDED: 'social.friend_added',
  CHALLENGE_SENT: 'social.challenge_sent',
  CHALLENGE_ACCEPTED: 'social.challenge_accepted',

  // AI
  COACHING_MESSAGE_SENT: 'coaching.message_sent',
  INSIGHT_GENERATED: 'insight.generated',
} as const;
