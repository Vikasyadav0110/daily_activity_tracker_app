import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    price: { IN: '₹0', US: '$0', GB: '£0', EU: '€0' },
    period: 'forever',
    color: 'border-gray-200',
    badge: null,
    features: [
      'Unlimited habits & daily tracking',
      'Streaks, XP & levels',
      'Basic progress calendar',
      '5 original languages',
      'Offline-first — works without internet',
    ],
    cta: 'Start Free',
    ctaHref: '/sign-up',
    ctaStyle: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
  },
  {
    name: 'Pro',
    price: { IN: '₹199', US: '$4.99', GB: '£3.99', EU: '€4.49' },
    period: '/month',
    color: 'border-orange-500',
    badge: 'Most Popular',
    badgeColor: 'bg-orange-500',
    features: [
      'Everything in Free',
      'Cloud sync across devices',
      'Advanced analytics & CSV export',
      'Social leaderboard & friends',
      'Team workspace & challenges',
      'Google Calendar & Slack integration',
      'Zapier webhooks',
      'REST API access (10K calls/mo)',
    ],
    cta: 'Start Pro Trial',
    ctaHref: '/sign-up?plan=pro_monthly',
    ctaStyle: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  {
    name: 'Premium+',
    price: { IN: '₹399', US: '$9.99', GB: '£7.99', EU: '€8.99' },
    period: '/month',
    color: 'border-purple-600',
    badge: '14-day trial',
    badgeColor: 'bg-purple-600',
    features: [
      'Everything in Pro',
      'AI weekly review (Claude)',
      'AI Coach — all 5 personas',
      '30/60/90-day habit programs',
      'Voice coaching (TTS)',
      'Mood & energy tracking',
      'Ayurveda tips + dosha profile',
      'Smart Schedule Planner',
      'Streak risk predictions',
      'REST API (100K calls/mo)',
    ],
    cta: 'Start Premium+ Trial',
    ctaHref: '/sign-up?plan=premium_plus_monthly',
    ctaStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

const FAQ = [
  { q: 'Can I use the app offline?', a: 'Yes — all habit tracking works offline. Data syncs automatically when you reconnect (Pro/Premium+).' },
  { q: 'What payment methods are supported?', a: 'Credit/debit cards via Stripe (global) or Razorpay UPI/net banking/cards for Indian users.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans cancel immediately, annual plans run to the end of the billing period.' },
  { q: 'Is my data private?', a: 'Your data is encrypted in transit and at rest. You can export or delete it at any time under GDPR/CCPA.' },
  { q: 'What is the REST API?', a: 'A developer-grade REST API to read/write your activities, logs, and analytics from external tools like Zapier, Notion, or custom scripts.' },
];

export default function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          Start free. Upgrade when your habits are ready to level up. Prices shown in your local currency.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {PLANS.map((plan) => (
          <div key={plan.name}
            className={`relative rounded-3xl p-8 border-2 ${plan.color} bg-white dark:bg-gray-900 flex flex-col`}>
            {plan.badge && (
              <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${plan.badgeColor}`}>
                {plan.badge}
              </div>
            )}
            <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold">{plan.price.IN}</span>
              <span className="text-gray-400 mb-1">{plan.period}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">~{plan.price.US} USD / {plan.price.GB} GBP / {plan.price.EU} EUR</p>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{f}</span>
                </li>
              ))}
            </ul>

            <Link href={plan.ctaHref}
              className={`block text-center py-3.5 rounded-xl font-bold text-sm transition-colors ${plan.ctaStyle}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Annual savings note */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-700 rounded-2xl p-6 text-center mb-16">
        <p className="font-semibold text-green-800 dark:text-green-300 text-lg mb-1">💰 Save up to 40% with annual plans</p>
        <p className="text-green-700 dark:text-green-400 text-sm">Pro Annual: ₹1,499/year · Premium+ Annual: ₹2,999/year · Lifetime Pro: ₹4,999 one-time</p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <p className="font-semibold mb-2 text-sm">{item.q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
