export const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) response.headers.set(key, value);
  return response;
}

export function methodNotAllowed(allowed: string): Response {
  return new Response(null, { status: 405, headers: { allow: allowed } });
}

export function safeErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unexpected server error.';
}
