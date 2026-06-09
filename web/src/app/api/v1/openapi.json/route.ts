import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.dailyactivitytracker.com';

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Daily Activity Tracker API',
    version: '1.0.0',
    description:
      'REST API for the Daily Activity Tracker platform. Authenticate with a Bearer API key (`dat_...`) or a Supabase JWT.\n\nGet your API key at [app.dailyactivitytracker.com/dashboard/api-keys](https://app.dailyactivitytracker.com/dashboard/api-keys).\n\n**Rate limits:** Free 1,000 req/month · Pro 10,000 req/month · Enterprise 100,000 req/month.',
    contact: { name: 'DAT Developer Support', email: 'api@dailyactivitytracker.com' },
    license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
  },
  servers: [{ url: `${BASE_URL}/api/v1`, description: 'Production' }],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API key (dat_...) or Supabase JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
            required: ['message'],
          },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Morning Run' },
          icon: { type: 'string', example: '🏃' },
          color: { type: 'string', example: '#1565C0' },
          frequency: { type: 'string', enum: ['daily', 'weekly', 'custom'], example: 'daily' },
          target_count: { type: 'integer', example: 1 },
          unit: { type: 'string', example: 'times' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          activity_id: { type: 'string', format: 'uuid' },
          log_date: { type: 'string', format: 'date', example: '2026-06-09' },
          status: { type: 'string', enum: ['completed', 'skipped', 'missed'] },
          duration_minutes: { type: 'integer', nullable: true },
          notes: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
            },
          },
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_in: { type: 'integer', example: 3600 },
        },
      },
      Friend: {
        type: 'object',
        properties: {
          friend_id: { type: 'string', format: 'uuid' },
          display_name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
          current_streak: { type: 'integer' },
          activities_today: { type: 'integer' },
        },
      },
      LeaderboardEntry: {
        type: 'object',
        properties: {
          rank: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          display_name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
          score: { type: 'number' },
          is_self: { type: 'boolean' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          key_prefix: { type: 'string', example: 'dat_abc1...' },
          tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
          rate_limit: { type: 'integer' },
          requests_this_month: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'revoked'] },
          last_used_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    // ── AUTH ──
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
              examples: {
                basic: { value: { email: 'jane@example.com', password: 'securePass1!', name: 'Jane' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Account created', content: { 'application/json': { schema: { properties: { data: { '$ref': '#/components/schemas/AuthTokens' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
          409: { description: 'Email already in use', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
        security: [],
      },
    },
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens returned', content: { 'application/json': { schema: { properties: { data: { '$ref': '#/components/schemas/AuthTokens' } } } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
        security: [],
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: { refresh_token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'New tokens', content: { 'application/json': { schema: { properties: { data: { type: 'object', properties: { access_token: { type: 'string' }, refresh_token: { type: 'string' }, expires_in: { type: 'integer' } } } } } } } },
          401: { description: 'Refresh token invalid or expired', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
        security: [],
      },
    },
    // ── ACTIVITIES ──
    '/activities': {
      get: {
        tags: ['Activities'],
        summary: 'List all activities',
        parameters: [
          { name: 'active', in: 'query', schema: { type: 'boolean' }, description: 'Filter to active-only (default true)' },
        ],
        responses: {
          200: { description: 'Activity list', content: { 'application/json': { schema: { properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Activity' } } } } } } },
        },
      },
      post: {
        tags: ['Activities'],
        summary: 'Create an activity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Morning Run' },
                  icon: { type: 'string', example: '🏃' },
                  color: { type: 'string', example: '#1565C0' },
                  frequency: { type: 'string', enum: ['daily', 'weekly', 'custom'], default: 'daily' },
                  target_count: { type: 'integer', default: 1 },
                  unit: { type: 'string', default: 'times' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Created activity', content: { 'application/json': { schema: { properties: { data: { '$ref': '#/components/schemas/Activity' } } } } } },
        },
      },
    },
    '/activities/{id}': {
      get: {
        tags: ['Activities'],
        summary: 'Get a single activity',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Activity', content: { 'application/json': { schema: { properties: { data: { '$ref': '#/components/schemas/Activity' } } } } } },
          404: { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Activities'],
        summary: 'Update an activity',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  icon: { type: 'string' },
                  color: { type: 'string' },
                  frequency: { type: 'string' },
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated activity' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Activities'],
        summary: 'Delete (archive) an activity',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/activities/{id}/logs': {
      get: {
        tags: ['Logs'],
        summary: 'Get logs for an activity',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-06-01' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-06-30' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 30, maximum: 90 } },
        ],
        responses: { 200: { description: 'Log list', content: { 'application/json': { schema: { properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/ActivityLog' } } } } } } } },
      },
      post: {
        tags: ['Logs'],
        summary: 'Log an activity',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  log_date: { type: 'string', format: 'date', description: 'Defaults to today (IST)' },
                  status: { type: 'string', enum: ['completed', 'skipped'], default: 'completed' },
                  duration_minutes: { type: 'integer', nullable: true },
                  notes: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Log entry created/updated', content: { 'application/json': { schema: { properties: { data: { '$ref': '#/components/schemas/ActivityLog' } } } } } } },
      },
    },
    '/logs/{log_id}': {
      patch: {
        tags: ['Logs'],
        summary: 'Update a log entry',
        parameters: [{ name: 'log_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, duration_minutes: { type: 'integer' }, notes: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated log' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Logs'],
        summary: 'Delete a log entry',
        parameters: [{ name: 'log_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    // ── ANALYTICS ──
    '/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics summary',
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30, maximum: 90 }, description: 'Lookback window' },
        ],
        responses: {
          200: {
            description: 'Analytics summary with completion rates, streak data, daily breakdown, and mood trend',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    // ── INSIGHTS ──
    '/insights': {
      get: {
        tags: ['Insights'],
        summary: 'Get AI-generated weekly insights',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['weekly_summary', 'streak_milestone', 'consistency_tip'] } },
        ],
        responses: { 200: { description: 'Insights list' } },
      },
    },
    // ── SOCIAL ──
    '/friends': {
      get: {
        tags: ['Social'],
        summary: 'List friends with streak data',
        responses: { 200: { description: 'Friends list', content: { 'application/json': { schema: { properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Friend' } } } } } } } },
      },
      post: {
        tags: ['Social'],
        summary: 'Send a friend request',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['friend_email'], properties: { friend_email: { type: 'string', format: 'email' } } } } },
        },
        responses: { 200: { description: 'Request sent or accepted' }, 404: { description: 'User not found' }, 409: { description: 'Already friends' } },
      },
      delete: {
        tags: ['Social'],
        summary: 'Remove a friend',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['friend_id'], properties: { friend_id: { type: 'string', format: 'uuid' } } } } },
        },
        responses: { 200: { description: 'Removed' } },
      },
    },
    '/friends/{friend_id}/challenge': {
      post: {
        tags: ['Social'],
        summary: 'Challenge a friend to a habit streak competition',
        parameters: [{ name: 'friend_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['activity_id', 'duration_days'],
                properties: {
                  activity_id: { type: 'string', format: 'uuid' },
                  duration_days: { type: 'integer', enum: [7, 14, 30] },
                  message: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Challenge created' }, 403: { description: 'Not friends' }, 404: { description: 'Activity not found' } },
      },
      get: {
        tags: ['Social'],
        summary: 'Get challenges between you and a friend',
        parameters: [{ name: 'friend_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Challenge list' } },
      },
    },
    '/leaderboard': {
      get: {
        tags: ['Social'],
        summary: 'Get ranked leaderboard',
        parameters: [
          { name: 'metric', in: 'query', schema: { type: 'string', enum: ['streak', 'xp', 'activities_today'], default: 'streak' } },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['friends', 'global'], default: 'friends' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
        ],
        responses: { 200: { description: 'Ranked leaderboard', content: { 'application/json': { schema: { properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/LeaderboardEntry' } } } } } } } },
      },
    },
    // ── API KEYS ──
    '/api-keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List your API keys',
        responses: { 200: { description: 'Key list', content: { 'application/json': { schema: { properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/ApiKey' } } } } } } } },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Create an API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'My Zapier Key' },
                  tier: { type: 'string', enum: ['free', 'pro', 'enterprise'], default: 'pro' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Created key (shown only once)', content: { 'application/json': { schema: { properties: { data: { type: 'object', properties: { key: { type: 'string', example: 'dat_abc123...' }, id: { type: 'string' }, name: { type: 'string' } } } } } } } } },
      },
    },
    '/api-keys/{id}': {
      delete: {
        tags: ['API Keys'],
        summary: 'Revoke an API key',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Revoked' } },
      },
    },
    // ── WEBHOOKS ──
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List registered webhooks',
        responses: { 200: { description: 'Webhook list' } },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Register a webhook endpoint',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: { type: 'string', format: 'uri' },
                  events: { type: 'array', items: { type: 'string', enum: ['activity.logged', 'activity.deleted', 'mood.logged', 'streak.achieved', 'streak.broken', 'insight.generated', 'challenge.accepted', 'challenge.completed', 'friend.added'] } },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Webhook created. `secret` is returned only once — store it securely to verify `X-DAT-Signature` headers.' },
          400: { description: 'Invalid URL or events' },
          409: { description: 'Max 10 webhooks per user' },
        },
      },
    },
    '/webhooks/{id}': {
      patch: {
        tags: ['Webhooks'],
        summary: 'Update webhook URL, events, or status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string', format: 'uri' }, events: { type: 'array', items: { type: 'string' } }, status: { type: 'string', enum: ['active', 'paused'] } } } } },
        },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete a webhook',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/webhooks/{id}/test': {
      post: {
        tags: ['Webhooks'],
        summary: 'Send a test ping to a webhook endpoint',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Test result with status_code, latency_ms, response_body' },
        },
      },
    },
    // ── MARKETPLACE ──
    '/marketplace/programs': {
      get: {
        tags: ['Marketplace'],
        summary: 'Browse published programs',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition'] } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['rating', 'sales', 'newest', 'price_asc', 'price_desc'], default: 'rating' } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { 200: { description: 'Paginated program list' } },
        security: [],
      },
      post: {
        tags: ['Marketplace'],
        summary: 'Create a new program (creator)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['program_name', 'category'],
                properties: {
                  program_name: { type: 'string' },
                  program_desc: { type: 'string' },
                  category: { type: 'string', enum: ['fitness', 'study', 'wellness', 'spiritual', 'productivity', 'nutrition'] },
                  duration_days: { type: 'integer', minimum: 7, maximum: 365, default: 30 },
                  price: { type: 'number', minimum: 0, default: 0 },
                  activities: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, emoji: { type: 'string' }, goal_per_day: { type: 'integer' } } } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Program created as draft' } },
      },
    },
    '/marketplace/programs/{id}': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get program details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Program object' }, 404: { description: 'Not found' } },
        security: [],
      },
      patch: {
        tags: ['Marketplace'],
        summary: 'Update program (creator only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { program_name: { type: 'string' }, program_desc: { type: 'string' }, status: { type: 'string', enum: ['under_review', 'archived'] }, price: { type: 'number' } } } } },
        },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Not creator' } },
      },
      delete: {
        tags: ['Marketplace'],
        summary: 'Delete draft program (creator only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 403: { description: 'Not creator or already published' } },
      },
    },
    '/marketplace/programs/{id}/enroll': {
      post: {
        tags: ['Marketplace'],
        summary: 'Enroll in a program (free) or verify payment and enroll (paid)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Required for paid programs only',
                properties: {
                  razorpay_payment_id: { type: 'string' },
                  razorpay_order_id: { type: 'string' },
                  razorpay_signature: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Enrolled. Program activities auto-added to tracker.' },
          400: { description: 'Payment required or signature invalid' },
          409: { description: 'Already enrolled' },
        },
      },
      delete: {
        tags: ['Marketplace'],
        summary: 'Abandon enrollment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Enrollment status set to abandoned' } },
      },
    },
    '/marketplace/my-programs': {
      get: {
        tags: ['Marketplace'],
        summary: 'List enrolled or created programs',
        parameters: [{ name: 'role', in: 'query', schema: { type: 'string', enum: ['enrolled', 'created'], default: 'enrolled' } }],
        responses: { 200: { description: 'Programs list' } },
      },
    },
    // ── ENTERPRISE / ORG ──
    '/org': {
      get: {
        tags: ['Enterprise'],
        summary: 'List organizations (member + owned)',
        responses: { 200: { description: 'Org list' } },
      },
      post: {
        tags: ['Enterprise'],
        summary: 'Create an organization',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
                  plan: { type: 'string', enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
                  seats_count: { type: 'integer', default: 10 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Org created' }, 409: { description: 'Slug taken' } },
      },
    },
    '/org/{org_id}': {
      get: { tags: ['Enterprise'], summary: 'Get org details', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Org object' } } },
      patch: { tags: ['Enterprise'], summary: 'Update org settings', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, seats_count: { type: 'integer' } } } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Enterprise'], summary: 'Delete org (owner only)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deleted' } } },
    },
    '/org/{org_id}/members': {
      get: { tags: ['Enterprise'], summary: 'List members (filterable by status, dept)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'invited', 'deprovisioned'] } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }], responses: { 200: { description: 'Member list with pagination' } } },
      post: { tags: ['Enterprise'], summary: 'Invite a member', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['admin', 'manager', 'member'], default: 'member' }, department_id: { type: 'string', format: 'uuid' } } } } } }, responses: { 200: { description: 'Invite sent with token' }, 409: { description: 'Seat capacity full' } } },
    },
    '/org/{org_id}/members/bulk-invite': {
      post: { tags: ['Enterprise'], summary: 'Bulk invite members (CSV or JSON)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { members: { type: 'array', items: { type: 'object', properties: { email: { type: 'string' }, role: { type: 'string' }, department: { type: 'string' } } }, maxItems: 2000 } } } }, 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'CSV with email,role,department columns' } } } } } }, responses: { 200: { description: 'Bulk invite result with invited/skipped/error counts' } } },
    },
    '/org/{org_id}/departments': {
      get: { tags: ['Enterprise'], summary: 'Get department tree', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Hierarchical department tree' } } },
      post: { tags: ['Enterprise'], summary: 'Create a department', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, parent_id: { type: 'string', format: 'uuid', nullable: true }, manager_id: { type: 'string', format: 'uuid', nullable: true } } } } } }, responses: { 201: { description: 'Department created' } } },
    },
    '/org/{org_id}/audit-logs': {
      get: { tags: ['Enterprise'], summary: 'Query audit logs', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }], responses: { 200: { description: 'Audit log entries' } } },
    },
    '/org/{org_id}/export': {
      get: { tags: ['Enterprise'], summary: 'Export org data (members + audit logs)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } }], responses: { 200: { description: 'Downloadable export file' } } },
    },
    '/org/{org_id}/sso': {
      get: { tags: ['Enterprise'], summary: 'Get SSO config or SAML SP metadata XML', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'metadata'] }, description: 'Use `metadata` to download SAML SP XML for your IdP' }], responses: { 200: { description: 'SSO config or SAML SP metadata XML' } } },
      post: { tags: ['Enterprise'], summary: 'Configure SSO (SAML 2.0)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['provider', 'entity_id', 'sso_url', 'x509_cert'], properties: { provider: { type: 'string', enum: ['okta', 'azure_ad', 'google', 'onelogin', 'custom'] }, entity_id: { type: 'string' }, sso_url: { type: 'string', format: 'uri' }, x509_cert: { type: 'string' } } } } } }, responses: { 200: { description: 'SSO config saved with sp_metadata_url and acs_url' } } },
    },
    '/org/{org_id}/sso/acs': {
      post: { tags: ['Enterprise'], summary: 'SAML Assertion Consumer Service (ACS) — IdP posts SAMLResponse here', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', required: ['SAMLResponse'], properties: { SAMLResponse: { type: 'string', description: 'Base64-encoded SAML assertion from IdP' }, RelayState: { type: 'string' } } } } } }, responses: { 302: { description: 'Redirect to dashboard after successful SSO login' }, 400: { description: 'Invalid SAML response' } }, security: [] },
    },
    '/org/{org_id}/analytics': {
      get: { tags: ['Manager Analytics'], summary: 'Org-level engagement analytics (privacy-preserving — min 5 members)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'days', in: 'query', schema: { type: 'integer', enum: [7, 14, 30, 90], default: 30 } }], responses: { 200: { description: 'Engagement rate, completion rate, mood averages, streak distribution, department breakdown. No individual user IDs returned.' }, 403: { description: 'Org has fewer than 5 members (minimum cohort size)' } } },
    },
    '/org/{org_id}/analytics/wellness': {
      get: { tags: ['Manager Analytics'], summary: 'Org-level weekly wellness trends', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'weeks', in: 'query', schema: { type: 'integer', default: 12 } }], responses: { 200: { description: 'Weekly trends with wellness_score, trend_change_4w, participation_rate_pct' } } },
    },
    '/org/{org_id}/analytics/insights': {
      get: { tags: ['Manager Analytics'], summary: 'Behavioral cohort insights (top performers, at-risk, newly active)', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Cohort counts + recommendations. No user IDs returned.' } } },
    },
    '/org/{org_id}/reports': {
      post: { tags: ['Manager Analytics'], summary: 'Generate a custom analytics report', parameters: [{ name: 'org_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['metrics', 'group_by', 'from', 'to'], properties: { metrics: { type: 'array', items: { type: 'string', enum: ['engagement_rate', 'completion_rate', 'avg_mood', 'avg_energy', 'active_members', 'streak_rate'] } }, group_by: { type: 'string', enum: ['day', 'week', 'department'] }, from: { type: 'string', format: 'date' }, to: { type: 'string', format: 'date', description: 'Max 365-day window' }, format: { type: 'string', enum: ['json', 'csv'], default: 'json' } } } } } }, responses: { 200: { description: 'Report data or CSV download' } } },
    },
    // ── COACHING ──
    '/coaching/sessions': {
      get: {
        tags: ['Coaching'],
        summary: 'List AI coaching sessions',
        responses: { 200: { description: 'Session list' } },
      },
      post: {
        tags: ['Coaching'],
        summary: 'Start a new AI coaching session',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { persona: { type: 'string', enum: ['drill_sergeant', 'calm_mentor', 'cheerleader', 'scientist'] }, context: { type: 'object' } } } } },
        },
        responses: { 200: { description: 'Session created with initial AI message' } },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints — sign up, sign in, token refresh' },
    { name: 'Activities', description: 'Create, read, update, delete habits and activities' },
    { name: 'Logs', description: 'Log completions and manage log entries' },
    { name: 'Analytics', description: 'Summary statistics, trends, and correlations' },
    { name: 'Insights', description: 'AI-generated weekly reviews and coaching insights' },
    { name: 'Social', description: 'Friends, challenges, and leaderboards' },
    { name: 'API Keys', description: 'Manage programmatic access keys' },
    { name: 'Coaching', description: 'AI coach conversation sessions' },
    { name: 'Webhooks', description: 'Register and manage webhook endpoints. Payloads are signed with HMAC-SHA256 in the `X-DAT-Signature` header.' },
    { name: 'Marketplace', description: 'Browse, enroll, and sell habit programs. Paid programs require Razorpay payment verification.' },
    { name: 'Enterprise', description: 'Multi-tenant organization management: members, departments, SSO, audit logs, and data export.' },
    { name: 'Manager Analytics', description: 'Privacy-preserving aggregate analytics for org admins and managers. Minimum cohort size: 5 members. No individual user IDs returned.' },
  ],
};

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
