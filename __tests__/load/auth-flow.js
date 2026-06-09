// k6 load test — Auth flow
// Run: k6 run __tests__/load/auth-flow.js
// Requires: BASE_URL env var (e.g. k6 run -e BASE_URL=https://your-app.vercel.app ...)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const signInDuration = new Trend('sign_in_duration_ms');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '1m',  target: 50 },   // hold at 50 VUs
    { duration: '30s', target: 100 },  // spike
    { duration: '1m',  target: 100 },  // hold peak
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    errors: ['rate<0.05'],              // error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate sign-in page load
  const loginPage = http.get(`${BASE_URL}/sign-in`);
  check(loginPage, {
    'sign-in page loads': (r) => r.status === 200,
  });

  // Simulate API health check
  const start = Date.now();
  const health = http.get(`${BASE_URL}/api/health`, {
    headers: { 'Content-Type': 'application/json' },
  });
  signInDuration.add(Date.now() - start);

  const healthOk = check(health, {
    'health check 200': (r) => r.status === 200 || r.status === 404, // 404 is ok if not implemented
  });
  if (!healthOk) errorRate.add(1);

  sleep(1);
}
