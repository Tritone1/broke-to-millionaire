import { verifyAdMobSignature } from '../_shared/crypto.ts';
import { jsonResponse, methodNotAllowed, safeErrorMessage } from '../_shared/http.ts';
import { createAdminClient, isUuid } from '../_shared/supabase.ts';

type AdMobKey = { keyId?: number; key_id?: number; pem: string };
type AdMobKeys = { keys: AdMobKey[] };

const KEY_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const SSV_VERIFICATION_USER_ID = '00000000-0000-4000-8000-000000000001';
const SSV_VERIFICATION_CUSTOM_DATA = 'admob_ssv_verification';

function expectedAdUnits(): Set<string> {
  return new Set((Deno.env.get('ADMOB_REWARDED_AD_UNIT_IDS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean));
}

Deno.serve(async (request) => {
  if (request.method !== 'GET') return methodNotAllowed('GET');

  try {
    const rawQuery = new URL(request.url).search.slice(1);
    const signatureBoundary = rawQuery.indexOf('&signature=');
    if (signatureBoundary < 0) return jsonResponse({ error: 'The callback signature is missing.' }, 400);
    const signedContent = rawQuery.slice(0, signatureBoundary);
    const params = new URLSearchParams(rawQuery);
    const signature = params.get('signature') ?? '';
    const keyId = params.get('key_id') ?? '';
    const userId = params.get('user_id') ?? '';
    const transactionId = params.get('transaction_id') ?? '';
    const adUnitId = params.get('ad_unit') ?? '';
    const customData = params.get('custom_data');
    const callbackAmount = Number(params.get('reward_amount'));
    const configuredAmount = Number(Deno.env.get('ADMOB_REWARD_AMOUNT') ?? '1000');

    if (!signature || !/^\d+$/.test(keyId) || !isUuid(userId) || transactionId.length < 3) {
      return jsonResponse({ error: 'The callback fields are invalid.' }, 400);
    }
    const keyResponse = await fetch(KEY_URL, { headers: { accept: 'application/json' } });
    if (!keyResponse.ok) throw new Error(`AdMob key server returned ${keyResponse.status}.`);
    const keySet = await keyResponse.json() as AdMobKeys;
    const key = keySet.keys.find((item) => String(item.keyId ?? item.key_id) === keyId);
    if (!key?.pem) return jsonResponse({ error: 'The AdMob signing key is unknown.' }, 401);
    if (!await verifyAdMobSignature({ content: signedContent, signature, keyPem: key.pem })) {
      return jsonResponse({ error: 'The AdMob signature is invalid.' }, 401);
    }

    // AdMob signs its callback-URL verification request. A dedicated UUID and
    // marker let the console confirm this endpoint without creating or
    // crediting a player account.
    if (userId === SSV_VERIFICATION_USER_ID && customData === SSV_VERIFICATION_CUSTOM_DATA) {
      return jsonResponse({ accepted: true, verification: true });
    }

    if (!Number.isSafeInteger(configuredAmount) || configuredAmount <= 0 || callbackAmount !== configuredAmount) {
      return jsonResponse({ error: 'The callback reward does not match the configured reward.' }, 422);
    }
    const allowedUnits = expectedAdUnits();
    if (allowedUnits.size === 0 || !allowedUnits.has(adUnitId)) {
      return jsonResponse({ error: 'The rewarded ad unit is not allowed.' }, 403);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_process_ad_reward', {
      p_transaction_id: transactionId,
      p_user_id: userId,
      p_ad_unit_id: adUnitId,
      p_reward_amount: configuredAmount,
      p_custom_data: customData,
    });
    if (error) throw error;
    return jsonResponse({ accepted: true, result: data });
  } catch (error) {
    console.error('admob_ssv_failed', { message: safeErrorMessage(error) });
    return jsonResponse({ error: 'The advertisement reward could not be processed.' }, 500);
  }
});
