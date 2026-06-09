import Link from 'next/link';

const FEATURES = [
  { icon: '✅', title: 'Habit Tracking', desc: 'Build and track unlimited daily habits with streaks, XP, and rich analytics.' },
  { icon: '🤖', title: 'AI Coach', desc: '5 coach personas powered by Claude — motivate, guide, and personalise your journey.' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Daily, weekly, and 30-day views. Mood correlation. Completion heatmaps.' },
  { icon: '🧘', title: 'Wellness Suite', desc: 'Ayurveda tips, dosha quiz, mantra counter, vrat calendar, and mood check-in.' },
  { icon: '🏆', title: 'Social & Teams', desc: 'Friends leaderboard, team challenges, and group accountability.' },
  { icon: '🔗', title: 'Integrations', desc: 'Sync with Google Calendar, Slack, and Zapier. REST API for developers.' },
];

const STATS = [
  { value: '600K+', label: 'Monthly Users' },
  { value: '11', label: 'Languages' },
  { value: '8', label: 'Regions' },
  { value: '4.8★', label: 'App Store Rating' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'UPSC aspirant, Bangalore', text: 'The AI coach helped me build a 90-day study streak. The schedule planner is incredible.', emoji: '👩‍💼' },
  { name: 'Marcus T.', role: 'Fitness coach, London', text: 'Best habit tracker I\'ve used. The analytics tell you exactly what\'s working and what\'s not.', emoji: '🏋️' },
  { name: 'Yuki M.', role: 'Product Manager, Tokyo', text: 'Switched from Notion to this. The AI weekly review alone is worth the subscription.', emoji: '⚡' },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-8">
          <span>🌍</span> Now available in 8 countries · 11 languages
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
          Build better habits.
          <br />
          <span className="text-blue-600">With AI at your side.</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Daily Activity Tracker combines habit tracking, AI coaching, wellness insights, and social accountability in one beautifully designed app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
            Start Free — No credit card
          </Link>
          <Link href="/pricing"
            className="px-8 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-lg font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            See Pricing →
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">Available on iOS, Android, and Web</p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-extrabold text-blue-600">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">Everything you need to build lasting habits</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">From day one to year one — track, analyse, and grow.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-bold text-lg mt-4 mb-2">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Coach highlight */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-sm font-semibold mb-4">
              🤖 AI Coaching Scale
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Meet your personal AI coach</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
              Choose from 5 coach personas — Motivator Arjun, Mindfulness Guide Priya, Fitness Coach Vikram, Productivity Mentor Ananya, or Spiritual Guide Swami Dev.
            </p>
            <ul className="space-y-3">
              {['Contextual coaching based on your 7-day data', '30/60/90-day habit programs with daily tasks', 'Voice coaching via ElevenLabs TTS', 'Streak risk predictions before you miss a day'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
            {[
              { role: 'user', text: 'I missed my morning run for 3 days in a row.' },
              { role: 'coach', name: 'Arjun 💪', text: "Yaar, 3 days is nothing! You've built a 45-day streak — that's who you are now. Skip the guilt, lace up tomorrow at 6am. One run resets everything. You've got this, bhai." },
            ].map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                  {m.role === 'coach' && <p className="font-bold text-purple-600 dark:text-purple-400 text-xs mb-1">{m.name}</p>}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold text-center mb-12">Loved by habit builders worldwide</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to build habits that stick?</h2>
        <p className="text-blue-100 mb-8 text-lg">Join 600K+ users across 8 countries. Free forever, upgrade when ready.</p>
        <Link href="/sign-up"
          className="inline-block px-10 py-4 bg-white text-blue-600 text-lg font-bold rounded-2xl hover:bg-blue-50 transition-colors">
          Get Started Free
        </Link>
      </section>
    </main>
  );
}
