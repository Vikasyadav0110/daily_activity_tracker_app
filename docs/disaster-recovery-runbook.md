# Disaster Recovery Runbook — Daily Activity Tracker

**Last Updated:** 2026-06-08  
**Owner:** Platform Engineering  
**RTO:** 30 minutes | **RPO:** 5 minutes

---

## 1. Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P0 | Complete outage — all users affected | 5 min | On-call + CTO |
| P1 | Partial outage — >20% users affected | 15 min | On-call |
| P2 | Degraded performance | 30 min | Engineering team |
| P3 | Minor issue | 4 hours | Ticket |

---

## 2. Key Services & Dependencies

| Service | Provider | Failover |
|---------|----------|----------|
| Web App | Vercel (`bom1` region) | Automatic multi-region |
| Database | Supabase PostgreSQL | Supabase managed read replicas |
| Auth | Supabase Auth | Supabase managed HA |
| Edge Functions | Supabase | Supabase managed |
| Email | Resend | Switch to SendGrid (env var swap) |
| Payments | Razorpay | Manual fallback to bank transfer |

---

## 3. Runbooks by Failure Mode

### 3.1 Database Outage (Supabase PostgreSQL)

**Symptoms:** API returning 500s, Supabase dashboard shows DB errors

**Steps:**
1. Check Supabase status page: https://status.supabase.com
2. Check Supabase dashboard → Database → Health
3. If Supabase-side: wait for automated recovery, monitor status page
4. If data corruption:
   ```bash
   # List recent automated backups in Supabase dashboard
   # Supabase → Database → Backups
   # Select a point-in-time restore (PITR) — available on Pro plan
   ```
5. Apply emergency read-only mode by setting env var:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE=true
   ```
6. Verify recovery: run integration test suite against prod
   ```bash
   BASE_URL=https://app.dailyactivitytracker.in npm run test:integration
   ```

### 3.2 Vercel Deployment Failure

**Symptoms:** Deployment shows failed status, new build won't rollback automatically

**Steps:**
1. Go to Vercel dashboard → Deployments
2. Identify the last good deployment
3. Click "..." → "Promote to Production"
4. Verify `bom1` region is serving traffic:
   ```bash
   curl -I https://app.dailyactivitytracker.in/api/health
   ```
5. If Vercel is down entirely, activate backup CDN:
   - Update DNS CNAME from `cname.vercel-dns.com` to Cloudflare Pages backup URL
   - Cloudflare Pages deployment auto-builds from the same GitHub repo (`main` branch)

### 3.3 Supabase Auth Outage

**Symptoms:** Users cannot sign in, JWT validation fails across all APIs

**Steps:**
1. Check Supabase Auth status
2. If extended outage (>15 min):
   - Post status update on https://status.dailyactivitytracker.in
   - Activate maintenance banner by setting `NEXT_PUBLIC_AUTH_MAINTENANCE=true` in Vercel env
3. When service restores: clear banner, verify sign-in flow with test account

### 3.4 Edge Function Failure

**Symptoms:** Specific features broken (AI coaching, email digest, Notion sync)

**Steps:**
1. Check Supabase dashboard → Edge Functions → Logs
2. Identify failing function and error message
3. Hot redeploy without downtime:
   ```bash
   supabase functions deploy <function-name> --project-ref <ref>
   ```
4. If environment secret missing:
   ```bash
   supabase secrets set KEY=value --project-ref <ref>
   supabase functions deploy <function-name> --project-ref <ref>
   ```

### 3.5 Payment Processing Failure (Razorpay)

**Symptoms:** Marketplace paid enrollments failing, Razorpay dashboard shows errors

**Steps:**
1. Check Razorpay status: https://status.razorpay.com
2. Temporarily disable paid program enrollments (UI feature flag):
   ```
   NEXT_PUBLIC_PAYMENTS_ENABLED=false
   ```
3. Free programs remain fully functional
4. Collect affected order IDs from `program_enrollments` table where `razorpay_payment_id IS NOT NULL AND status = 'pending'`
5. Process manually via Razorpay dashboard once service restores
6. Run SQL to fix enrollment status after manual confirmation:
   ```sql
   UPDATE program_enrollments
   SET status = 'active', enrolled_at = NOW()
   WHERE razorpay_order_id = '<order_id>';
   ```

### 3.6 Email Digest Failure (Resend)

**Symptoms:** Manager weekly digests not sent, `digest.sent` audit logs missing

**Steps:**
1. Check Resend dashboard for delivery errors
2. If Resend is down, switch to SendGrid fallback:
   ```bash
   supabase secrets set RESEND_API_KEY=DISABLED --project-ref <ref>
   supabase secrets set SENDGRID_API_KEY=<your_key> --project-ref <ref>
   ```
3. Update `send-manager-digest` edge function to use SendGrid client
4. Manually trigger missed digests:
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/send-manager-digest \
     -H "Authorization: Bearer <service_role_key>" \
     -d '{"org_id": "all"}'
   ```

---

## 4. Data Recovery Procedures

### 4.1 Accidental Data Deletion

```sql
-- Supabase PITR restore for specific table (requires Pro plan)
-- Contact Supabase support with timestamp and table name

-- For soft-deletes (where applicable):
UPDATE activities SET deleted_at = NULL WHERE deleted_at > NOW() - INTERVAL '1 hour';
```

### 4.2 API Key Compromise

```sql
-- Immediately revoke compromised key
UPDATE api_keys SET revoked_at = NOW() WHERE key_hash = '<sha256_hash>';

-- Audit which endpoints were hit with this key
SELECT endpoint, method, created_at
FROM api_request_logs
WHERE api_key_id = '<key_id>'
ORDER BY created_at DESC;
```

### 4.3 SSO / SAML Misconfiguration (Enterprise)

```sql
-- Temporarily disable SSO for an org to allow password-based login
UPDATE org_sso_configs SET active = false WHERE org_id = '<org_id>';
```

---

## 5. Communication Templates

### Status Page Update (P0)
```
[INCIDENT] We are currently experiencing issues with [COMPONENT].
Users may be unable to [IMPACT].
Our team is investigating. Next update in 15 minutes.
Started: [TIME] IST
```

### Resolution Notice
```
[RESOLVED] The issue with [COMPONENT] has been resolved.
Root cause: [BRIEF DESCRIPTION]
Duration: [X] minutes
We are implementing measures to prevent recurrence.
```

---

## 6. Post-Incident Checklist

- [ ] Incident timeline documented
- [ ] Root cause identified
- [ ] Fix deployed and verified
- [ ] Status page updated to resolved
- [ ] Customer communication sent (if P0/P1)
- [ ] Post-mortem scheduled (within 48h for P0)
- [ ] Action items filed as GitHub issues with `incident` label
- [ ] Runbook updated if procedures need changes

---

## 7. Key Contacts & Access

| Role | Responsibility |
|------|---------------|
| On-call engineer | First responder, first 30 min |
| Supabase support | Database/auth issues — dashboard ticket |
| Vercel support | Deployment/CDN issues — vercel.com/support |
| Razorpay support | Payment issues — razorpay.com/support |

**Environment variables location:** Vercel Dashboard → Project → Settings → Environment Variables  
**Supabase secrets:** `supabase secrets list --project-ref <ref>`  
**GitHub repo:** github.com/[org]/daily-activity-tracker
