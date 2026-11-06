import { corsHeaders, jsonResponse, methodNotAllowed, safeErrorMessage, withCors } from '../_shared/http.ts';
import { bearerToken, createAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return methodNotAllowed('POST');
  const token = bearerToken(request);
  if (!token) return withCors(jsonResponse({ error: 'Authentication is required.' }, 401));

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return withCors(jsonResponse({ error: 'The session is invalid or expired.' }, 401));

    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id, false);
    if (deleteError) throw deleteError;
    return withCors(jsonResponse({ deleted: true }));
  } catch (error) {
    console.error('account_delete_failed', { message: safeErrorMessage(error) });
    return withCors(jsonResponse({ error: 'The account could not be deleted.' }, 500));
  }
});
