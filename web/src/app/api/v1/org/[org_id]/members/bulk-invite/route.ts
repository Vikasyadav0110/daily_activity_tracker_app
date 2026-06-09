import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, apiError, apiOk } from '@/lib/api-auth';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Ctx = { params: Promise<{ org_id: string }> };

interface CsvRow {
  email: string;
  role?: string;
  department?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const emailIdx = headers.indexOf('email');
  const roleIdx = headers.indexOf('role');
  const deptIdx = headers.indexOf('department');

  if (emailIdx < 0) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const email = cols[emailIdx]?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return [];
    return [{
      email,
      role: roleIdx >= 0 ? (cols[roleIdx] || 'member') : 'member',
      department: deptIdx >= 0 ? cols[deptIdx] : undefined,
    }];
  });
}

// POST /api/v1/org/:org_id/members/bulk-invite
// Accepts: multipart/form-data with a 'file' field (CSV), or JSON body with 'rows' array
// CSV format: email,role,department  (role and department optional)
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;
  const { org_id } = await ctx.params;

  // Check admin
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, owner_id, seats_count, seats_used')
    .eq('id', org_id).maybeSingle();
  if (!orgData) return apiError('Organization not found', 404);

  const isOwner = orgData.owner_id === auth.userId;
  if (!isOwner) {
    const { data: m } = await supabase
      .from('org_members')
      .select('role').eq('org_id', org_id).eq('user_id', auth.userId).eq('status', 'active').maybeSingle();
    if (m?.role !== 'admin') return apiError('Forbidden', 403);
  }

  // Parse input — CSV file or JSON rows
  let rows: CsvRow[] = [];
  const ct = req.headers.get('content-type') ?? '';

  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return apiError('No file field in form data', 400);
    if (file.size > 5 * 1024 * 1024) return apiError('CSV file too large (max 5 MB)', 413);
    const text = await file.text();
    rows = parseCsv(text);
  } else {
    const body = await req.json() as { rows?: CsvRow[]; csv?: string };
    if (body.csv) {
      rows = parseCsv(body.csv);
    } else if (Array.isArray(body.rows)) {
      rows = body.rows.filter((r) => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    } else {
      return apiError('Provide multipart CSV file, JSON rows array, or csv string', 400);
    }
  }

  if (rows.length === 0) return apiError('No valid email rows found', 400);
  if (rows.length > 2000) return apiError('Maximum 2,000 rows per batch', 400);

  // Check seats capacity
  const availableSeats = orgData.seats_count - orgData.seats_used;
  if (rows.length > availableSeats) {
    return apiError(
      `Not enough seats. Available: ${availableSeats}, requested: ${rows.length}. Upgrade your plan.`,
      402
    );
  }

  // Resolve department names → IDs
  const deptNames = [...new Set(rows.map((r) => r.department).filter(Boolean))] as string[];
  const deptMap: Record<string, string> = {};
  if (deptNames.length > 0) {
    const { data: depts } = await supabase
      .from('org_departments')
      .select('id, name').eq('org_id', org_id).in('name', deptNames);
    for (const d of depts ?? []) deptMap[d.name.toLowerCase()] = d.id;
  }

  // Build upsert rows
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const inviteRows = rows.map((r) => ({
    org_id,
    email: r.email.toLowerCase(),
    role: ['admin', 'manager', 'member'].includes(r.role ?? '') ? r.role! : 'member',
    department_id: r.department ? (deptMap[r.department.toLowerCase()] ?? null) : null,
    invited_by: auth.userId,
    token: randomBytes(24).toString('hex'),
    status: 'pending',
    expires_at: expiresAt,
    created_at: now,
  }));

  // Batch upsert in chunks of 200
  const chunkSize = 200;
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < inviteRows.length; i += chunkSize) {
    const chunk = inviteRows.slice(i, i + chunkSize);
    const { data, error: upsertErr } = await supabase
      .from('org_invites')
      .upsert(chunk, { onConflict: 'org_id,email', ignoreDuplicates: false })
      .select('id');
    if (upsertErr) {
      errors.push(`Chunk ${i / chunkSize + 1}: ${upsertErr.message}`);
    } else {
      inserted += data?.length ?? 0;
    }
  }

  skipped = rows.length - inserted;

  await supabase.from('org_audit_logs').insert({
    org_id,
    actor_user_id: auth.userId,
    action: 'member.bulk_invite',
    resource_type: 'member',
    metadata: { total: rows.length, inserted, skipped, errors },
  });

  return apiOk({
    total: rows.length,
    invited: inserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  }, undefined, 201);
}
