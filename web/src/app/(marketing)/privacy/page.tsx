export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold mb-3">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-12">Effective date: 1 June 2026 · Last updated: 9 June 2026</p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-bold mb-3">1. Who we are</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Daily Activity Tracker ("DAT", "we", "us", "our") is operated by Vikas Yadav, Bangalore, India. Contact: <a href="mailto:privacy@dailyactivitytracker.app" className="text-blue-600 hover:underline">privacy@dailyactivitytracker.app</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. What data we collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Account data:</strong> email address, display name (collected at sign-up).</li>
            <li><strong>Activity data:</strong> habits, daily logs, mood check-ins, XP/streak records you create.</li>
            <li><strong>Coaching data:</strong> messages you send to AI coach personas and the AI responses.</li>
            <li><strong>Technical data:</strong> device type, OS, app version, crash logs (anonymised).</li>
            <li><strong>Payment data:</strong> billing name, last 4 card digits, subscription status. Full card details are handled by Stripe or Razorpay and never reach our servers.</li>
            <li><strong>Cookies:</strong> essential authentication cookies and, with your consent, analytics cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li>Provide and improve the Daily Activity Tracker service.</li>
            <li>Generate your personalised analytics, insights, and AI coaching responses.</li>
            <li>Process payments and manage subscriptions.</li>
            <li>Send transactional emails (receipt, streak alerts, weekly review).</li>
            <li>With your explicit consent: product improvement analytics; promotional emails.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. AI coaching & third-party AI</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Coaching messages are processed by Anthropic's Claude API (server-side only — your API key is never in the mobile app bundle). Anthropic's data processing addendum applies. Your conversations are <strong>not used to train third-party AI models</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Data sharing</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">We do not sell your personal data. We share data only with:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Supabase</strong> — database and authentication hosting (EU/US data centres).</li>
            <li><strong>Anthropic</strong> — AI inference for coaching and insights.</li>
            <li><strong>Stripe / Razorpay</strong> — payment processing.</li>
            <li><strong>ElevenLabs</strong> — text-to-speech for voice coaching (Premium+ only).</li>
            <li>Law enforcement when legally required.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Your rights (GDPR / CCPA)</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Access:</strong> request a copy of all data we hold about you.</li>
            <li><strong>Portability (Article 20):</strong> export your full data as JSON from Dashboard → Settings → Privacy.</li>
            <li><strong>Erasure (Article 17):</strong> request account deletion. A 30-day cooling-off period applies; deletion is permanent and irreversible.</li>
            <li><strong>CCPA Opt-Out:</strong> California residents can opt out of any sale of personal information (we do not sell data, but the toggle is available in Settings).</li>
            <li><strong>Complaints:</strong> EU residents may lodge a complaint with their local Data Protection Authority.</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-3">Exercise rights at: <a href="mailto:privacy@dailyactivitytracker.app" className="text-blue-600 hover:underline">privacy@dailyactivitytracker.app</a></p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Data retention</h2>
          <p className="text-gray-600 dark:text-gray-400">We retain your data for as long as your account is active. After deletion: all personal data is removed within 30 days. Anonymised aggregate analytics may be retained indefinitely.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. Security</h2>
          <p className="text-gray-600 dark:text-gray-400">Data is encrypted in transit (TLS 1.3) and at rest (AES-256). API keys are stored as SHA-256 hashes and never in plain text. We conduct regular security reviews.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">9. Changes to this policy</h2>
          <p className="text-gray-600 dark:text-gray-400">We will notify you by email and in-app notice at least 14 days before material changes take effect.</p>
        </section>

      </div>
    </main>
  );
}
