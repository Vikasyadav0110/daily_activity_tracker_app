import Link from 'next/link';

const TEAM = [
  { name: 'Vikas Yadav', role: 'Founder & CEO', emoji: '👨‍💻', bio: 'Built the first version of DAT in 2024 to track his own UPSC preparation. Former backend engineer at a fintech startup in Bangalore.' },
  { name: 'Priya Nair', role: 'Head of Product', emoji: '👩‍💼', bio: 'Ex-Swiggy PM obsessed with habit science and behavioral psychology. Brought the AI coaching vision to life.' },
  { name: 'Amit Sharma', role: 'Lead Engineer', emoji: '🛠️', bio: 'Full-stack engineer with 8 years of experience. Architected the offline-first sync engine and REST API layer.' },
];

const MILESTONES = [
  { year: '2024 Q1', event: 'Phase 1 MVP launched — 5 habits, streaks, local SQLite. 2,000 early users in 3 weeks.' },
  { year: '2024 Q3', event: 'Phase 2 Growth — cloud sync, social leaderboards, team challenges. Crossed 50K MAU.' },
  { year: '2025 Q1', event: 'Phase 3 Intelligence — AI weekly reviews, smart scheduling, ayurveda wellness. 200K MAU.' },
  { year: '2025 Q3', event: 'Phase 4 Ecosystem — REST API, Zapier, Google Calendar, Slack. Developer community grows to 3K.' },
  { year: '2026 Q1', event: 'Phase 5 AI Coaching — 5 coach personas, habit programs, voice TTS. 500K MAU.' },
  { year: '2026 Q2', event: 'Phase 6 Global Expansion — 8 regions, 11 languages, GDPR/CCPA, 600K+ MAU.' },
];

const VALUES = [
  { icon: '🎯', title: 'Habit-first, always', desc: 'Every feature we ship must make tracking a habit easier or more meaningful. We don\'t ship complexity for its own sake.' },
  { icon: '🔒', title: 'Privacy by design', desc: 'Your data belongs to you. We\'re GDPR and CCPA compliant, offer full data export, and will never sell your information.' },
  { icon: '🌍', title: 'Built for everyone', desc: 'From a student in Chennai to a manager in Tokyo — we localise deeply, not just translate words.' },
  { icon: '🤖', title: 'AI that respects you', desc: 'Our AI coach uses Claude on the server side. Your conversations never train third-party models.' },
];

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">We help humans build habits that stick</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Daily Activity Tracker started as one engineer's personal spreadsheet. Today it's a platform used by 600,000+ people in 8 countries — and we're just getting started.
        </p>
      </div>

      {/* Values */}
      <section className="mb-20">
        <h2 className="text-2xl font-extrabold mb-8">What we believe</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <span className="text-3xl">{v.icon}</span>
              <h3 className="font-bold text-lg mt-4 mb-2">{v.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-20">
        <h2 className="text-2xl font-extrabold mb-8">Our journey</h2>
        <div className="relative border-l-2 border-blue-100 dark:border-blue-900 ml-4 space-y-8">
          {MILESTONES.map((m) => (
            <div key={m.year} className="relative pl-8">
              <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-950" />
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">{m.year}</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{m.event}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mb-20">
        <h2 className="text-2xl font-extrabold mb-8">The team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TEAM.map((t) => (
            <div key={t.name} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-5xl">{t.emoji}</span>
              <h3 className="font-bold text-lg mt-4">{t.name}</h3>
              <p className="text-blue-600 text-xs font-semibold mb-3">{t.role}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 rounded-3xl p-10 text-white text-center mb-20">
        <h2 className="text-2xl font-extrabold mb-8">By the numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '600K+', label: 'Monthly Active Users' },
            { value: '11', label: 'Languages Supported' },
            { value: '8', label: 'Countries & Regions' },
            { value: '4.8★', label: 'App Store Rating' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="text-blue-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold mb-4">Want to join us?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">We're a small, remote-first team. If you're passionate about habit science and great software, reach out.</p>
        <a href="mailto:hello@dailyactivitytracker.app"
          className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-colors">
          Get in touch
        </a>
        <p className="mt-6 text-sm text-gray-400">Or <Link href="/sign-up" className="text-blue-600 hover:underline font-medium">start tracking for free →</Link></p>
      </div>
    </main>
  );
}
