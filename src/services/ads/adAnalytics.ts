export type AdAnalyticsEvent =
  | 'ad_requested'
  | 'ad_loaded'
  | 'ad_failed'
  | 'ad_displayed'
  | 'ad_dismissed'
  | 'reward_earned'
  | 'reward_applied'
  | 'interstitial_shown';

export type AdAnalyticsPayload = { format: 'rewarded' | 'interstitial'; placement?: string; code?: string };
type AdAnalyticsSink = (event: AdAnalyticsEvent, payload: AdAnalyticsPayload) => void;

let sink: AdAnalyticsSink | null = null;

export function setAdAnalyticsSink(nextSink: AdAnalyticsSink | null): void {
  sink = nextSink;
}

export function trackAdEvent(event: AdAnalyticsEvent, payload: AdAnalyticsPayload): void {
  sink?.(event, payload);
}

