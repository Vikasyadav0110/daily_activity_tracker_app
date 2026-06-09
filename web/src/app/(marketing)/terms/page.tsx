export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold mb-3">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-12">Effective date: 1 June 2026 · Last updated: 9 June 2026</p>

      <div className="space-y-10 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-bold mb-3">1. Acceptance</h2>
          <p className="text-gray-600 dark:text-gray-400">
            By creating an account or using Daily Activity Tracker ("DAT", "the Service"), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. The Service</h2>
          <p className="text-gray-600 dark:text-gray-400">
            DAT provides habit tracking, AI coaching, analytics, and related features via mobile apps (iOS/Android) and a web dashboard. Features vary by subscription plan (Free, Pro, Premium+).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Accounts</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li>You must be 13 years or older (16 in the EU) to create an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>One account per person. Sharing accounts is not permitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Subscriptions & billing</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Free plan:</strong> available indefinitely at no cost.</li>
            <li><strong>Pro / Premium+:</strong> billed monthly or annually via Stripe (global) or Razorpay (India). Prices are displayed in your local currency at checkout.</li>
            <li><strong>Annual plans</strong> auto-renew after 12 months. You may cancel before the renewal date.</li>
            <li><strong>Lifetime Pro</strong> is a one-time payment and does not auto-renew.</li>
            <li>Refunds are subject to the refund policy of the applicable app store or our direct refund policy (contact support within 14 days of payment).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Acceptable use</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to access other users' accounts or data.</li>
            <li>Abuse the REST API or webhooks in ways that harm service stability (rate limits apply).</li>
            <li>Use the AI coach to generate harmful, illegal, or deceptive content.</li>
            <li>Resell or sublicense the Service without written permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. AI coaching disclaimer</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The AI coach personas are for motivational and productivity support only. They are not a substitute for professional medical, psychological, or financial advice. Always consult a qualified professional for health concerns.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Intellectual property</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The DAT name, logo, and app design are our intellectual property. You retain ownership of the habit and activity data you create. You grant us a limited licence to process that data solely to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. Service availability</h2>
          <p className="text-gray-600 dark:text-gray-400">
            We aim for 99.5% uptime on cloud-synced features. The offline-first core (habit tracking, local SQLite) remains functional without internet. We are not liable for temporary outages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">9. Termination</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You may delete your account at any time from Settings → Privacy. We may suspend accounts that violate these Terms with notice where reasonably practicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">10. Limitation of liability</h2>
          <p className="text-gray-600 dark:text-gray-400">
            To the maximum extent permitted by law, DAT is not liable for indirect, incidental, or consequential damages. Our aggregate liability is limited to the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">11. Governing law</h2>
          <p className="text-gray-600 dark:text-gray-400">
            These Terms are governed by the laws of India. Disputes shall be resolved in the courts of Bangalore, Karnataka, except where applicable consumer protection law provides otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">12. Changes to these Terms</h2>
          <p className="text-gray-600 dark:text-gray-400">
            We will notify you by email and in-app notice at least 14 days before material changes take effect. Continued use after that date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">13. Contact</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Questions? Email <a href="mailto:legal@dailyactivitytracker.app" className="text-blue-600 hover:underline">legal@dailyactivitytracker.app</a>
          </p>
        </section>

      </div>
    </main>
  );
}
