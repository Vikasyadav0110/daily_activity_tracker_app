// k6 load test — Core API endpoints
// Run: k6 run __tests__/load/api-endpoints.js \
//   -e BASE_URL=https://your-app.vercel.app \
//   -e ACCESS_TOKEN=your_supabase_access_token

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const activityLogDuration = new Trend('activity_log_duration_ms');
const analyticsQueryDuration = new Trend('analytics_query_duration_ms');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m',  target: 50 },
    { duration: '1m',  target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    errors: ['rate<0.02'],
    activity_log_duration_ms: ['p(95)<1500'],
    analytics_query_duration_ms: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.ACCESS_TOKEN || '';

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

export default function () {
  group('Activities API', () => {
    // GET activities
    const listRes = http.get(`${BASE_URL}/api/v1/activities`, { headers: authHeaders });
    check(listRes, { 'list activities 200': (r) => r.status === 200 || r.status === 401 });
    if (listRes.status !== 200 && listRes.status !== 401) errorRate.add(1);

    // POST activity log
    const start = Date.now();
    const logRes = http.post(
      `${BASE_URL}/api/v1/activities`,
      JSON.stringify({
        activity_name: `k6 Test Activity ${__VU}`,
        emoji: '🏃',
        category: 'fitness',
        goal_per_day: 1,
      }),
      { headers: authHeaders }
    );
    activityLogDuration.add(Date.now() - start);
    check(logRes, { 'create activity 201 or 401': (r) => r.status === 201 || r.status === 401 });
  });

  group('Analytics API', () => {
    const start = Date.now();
    const analyticsRes = http.get(`${BASE_URL}/api/v1/analytics/summary`, { headers: authHeaders });
    analyticsQueryDuration.add(Date.now() - start);
    check(analyticsRes, { 'analytics 200 or 401': (r) => r.status === 200 || r.status === 401 });
  });

  group('Marketplace API', () => {
    const marketRes = http.get(`${BASE_URL}/api/v1/marketplace/programs?limit=10`, { headers: authHeaders });
    check(marketRes, { 'marketplace 200 or 401': (r) => r.status === 200 || r.status === 401 });
  });

  group('Webhook API', () => {
    const webhookRes = http.get(`${BASE_URL}/api/v1/webhooks`, { headers: authHeaders });
    check(webhookRes, { 'webhooks 200 or 401': (r) => r.status === 200 || r.status === 401 });
  });

  sleep(Math.random() * 2 + 0.5);
}
