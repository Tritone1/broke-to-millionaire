import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

function serviceKey(): string {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    const key = parsed.default ?? Object.values(parsed)[0];
    if (key) return key;
  }

  // Backward-compatible local development fallback. Hosted production uses
  // the revocable sb_secret key injected through SUPABASE_SECRET_KEYS.
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (legacy) return legacy;

  throw new Error('The Supabase server secret key is unavailable.');
}

export function createAdminClient(): SupabaseClient {
  return createClient(requiredEnvironment('SUPABASE_URL'), serviceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')?.trim() ?? '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
