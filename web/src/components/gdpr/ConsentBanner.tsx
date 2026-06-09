'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'dat_consent_v1';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function saveConsent(analytics: boolean, marketing: boolean) {
    const consent = { essential: true, analytics, marketing, savedAt: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Fire-and-forget: log consent to server
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consent),
    }).catch(() => {});

    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl shrink-0">🍪</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Your privacy matters</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              We use essential cookies to keep you logged in. With your permission, we also use analytics cookies to improve the product and marketing cookies to show relevant promotions.
              {' '}<button onClick={() => setShowDetails(!showDetails)} className="text-blue-600 hover:underline text-sm font-medium">
                {showDetails ? 'Hide details' : 'Manage preferences'}
              </button>
            </p>

            {showDetails && (
              <div className="mb-4 space-y-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <label className="flex items-center justify-between gap-3 cursor-not-allowed">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Essential</p>
                    <p className="text-xs text-gray-400">Authentication, security, core app function. Always on.</p>
                  </div>
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-blue-600" />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Analytics</p>
                    <p className="text-xs text-gray-400">Page views and feature usage to improve the product.</p>
                  </div>
                  <input type="checkbox" checked={analyticsChecked} onChange={(e) => setAnalyticsChecked(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Marketing</p>
                    <p className="text-xs text-gray-400">Personalised promotions and product updates.</p>
                  </div>
                  <input type="checkbox" checked={marketingChecked} onChange={(e) => setMarketingChecked(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => saveConsent(analyticsChecked, marketingChecked)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                {showDetails ? 'Save Preferences' : 'Accept All'}
              </button>
              <button
                onClick={() => saveConsent(false, false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
