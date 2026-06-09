// Sentry is activated when NEXT_PUBLIC_SENTRY_DSN is set in .env
// Install first: npm install @sentry/nextjs
// Then replace this stub with the real Sentry init from @sentry/nextjs

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  // Uncomment after: npm install @sentry/nextjs
  /*
  import * as Sentry from '@sentry/nextjs';
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'production',
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({ maskAllText: true }),
    ],
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
  });
  */
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('[Sentry stub]', err, context);
    return;
  }
  // Uncomment after npm install @sentry/nextjs:
  // import('@sentry/nextjs').then(({ captureException: cap }) => cap(err, { extra: context }));
  console.error('[Sentry]', err, context);
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  // import('@sentry/nextjs').then(({ captureMessage: cap }) => cap(msg, level));
  console.log(`[Sentry ${level}]`, msg);
}
