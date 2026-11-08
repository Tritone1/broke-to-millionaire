import { constantTimeEqual, hmacSha256Hex } from '../_shared/crypto.ts';
import { jsonResponse, methodNotAllowed, safeErrorMessage } from '../_shared/http.ts';
import { createAdminClient, isUuid } from '../_shared/supabase.ts';

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  store?: string;
  environment?: string;
};

type RevenueCatPayload = { api_version?: string; event?: RevenueCatEvent };

function parseSignature(header: string | null): { timestamp: string; signature: string } | null {
  const parts = Object.fromEntries((header ?? '').split(',').map((part) => part.trim().split('=', 2)));
  return parts.t && parts.v1 ? { timestamp: parts.t, signature: parts.v1 } : null;
}

function productGrants(): Record<string, number> {
  const raw = Deno.env.get('REVENUECAT_PRODUCT_GRANTS') ?? '{}';
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const grants: Record<string, number> = {};
  for (const [product, amount] of Object.entries(parsed)) {
    if (typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0) grants[product] = amount;
  }
  return grants;
}

function normalizedStore(store: string): 'app_store' | 'play_store' | 'revenuecat' {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'app_store';
  if (store === 'PLAY_STORE') return 'play_store';
  return 'revenuecat';
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  const rawBody = await request.text();

  try {
    const signingSecret = Deno.env.get('REVENUECAT_WEBHOOK_SIGNING_SECRET')?.trim();
    if (signingSecret) {
      const signature = parseSignature(request.headers.get('x-revenuecat-webhook-signature'));
      if (!signature || !/^\d+$/.test(signature.timestamp) || !/^[a-f0-9]{64}$/i.test(signature.signature)) {
        return jsonResponse({ error: 'Invalid webhook signature header.' }, 401);
      }
      const ageSeconds = Math.abs(Date.now() / 1000 - Number(signature.timestamp));
      if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
        return jsonResponse({ error: 'Expired webhook signature.' }, 401);
      }
      const expected = await hmacSha256Hex(signingSecret, `${signature.timestamp}.${rawBody}`);
      if (!constantTimeEqual(expected, signature.signature.toLowerCase())) {
        return jsonResponse({ error: 'Webhook signature verification failed.' }, 401);
      }
    }

    const webhookToken = Deno.env.get('REVENUECAT_WEBHOOK_TOKEN')?.trim();
    if (!webhookToken) throw new Error('RevenueCat webhook token is not configured.');
    const suppliedToken = new URL(request.url).searchParams.get('token') ?? '';
    const suppliedAuthorization = request.headers.get('authorization') ?? '';
    if (!constantTimeEqual(suppliedToken, webhookToken)
      || !constantTimeEqual(suppliedAuthorization, `Bearer ${webhookToken}`)) {
      return jsonResponse({ error: 'Webhook authorization failed.' }, 401);
    }

    const payload = JSON.parse(rawBody) as RevenueCatPayload;
    const event = payload.event;
    if (!event?.id || !event.app_user_id || !event.product_id || !event.type) {
      return jsonResponse({ error: 'Required purchase fields are missing.' }, 400);
    }
    if (!isUuid(event.app_user_id)) return jsonResponse({ error: 'The purchase player ID is invalid.' }, 400);

    const purchaseEvents = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']);
    const revokeEvents = new Set(['CANCELLATION', 'EXPIRATION']);
    if (event.product_id === 'remove_ads' && (purchaseEvents.has(event.type) || revokeEvents.has(event.type))) {
      const admin = createAdminClient();
      const { error } = await admin.rpc('admin_set_player_entitlement', {
        p_user_id: event.app_user_id,
        p_entitlement_id: 'remove_ads',
        p_active: purchaseEvents.has(event.type),
        p_product_id: event.product_id,
        p_source_event_id: event.id,
      });
      if (error) throw error;
      return jsonResponse({ accepted: true, processed: true, entitlement: 'remove_ads' });
    }

    const amount = productGrants()[event.product_id];
    const isCashPurchase = purchaseEvents.has(event.type);
    const isCashRefund = event.type === 'CANCELLATION';
    if (!isCashPurchase && !isCashRefund) return jsonResponse({ accepted: true, processed: false });
    if (!amount) return jsonResponse({ error: 'The product is not mapped to a currency adjustment.' }, 422);

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_process_purchase_event', {
      p_event_id: event.id,
      p_user_id: event.app_user_id,
      p_store: normalizedStore(event.store ?? ''),
      p_product_id: event.product_id,
      p_event_type: event.type,
      p_currency_delta: isCashRefund ? -amount : amount,
      p_environment: event.environment === 'PRODUCTION' ? 'production' : 'sandbox',
      p_metadata: { api_version: payload.api_version ?? 'unknown' },
    });
    if (error) throw error;
    return jsonResponse({ accepted: true, processed: true, result: data });
  } catch (error) {
    console.error('revenuecat_webhook_failed', { message: safeErrorMessage(error) });
    return jsonResponse({ error: 'The purchase event could not be processed.' }, 500);
  }
});
