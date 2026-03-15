/**
 * Analytics wrapper around PostHog.
 * All calls are no-ops when NEXT_PUBLIC_POSTHOG_KEY is not set,
 * so the app works locally and in CI without any account.
 *
 * To enable: set NEXT_PUBLIC_POSTHOG_KEY in your deployment env vars.
 * Free tier: https://posthog.com — 1M events/month.
 */
import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === 'undefined' || initialized) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage',
  });

  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized || typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!initialized || typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}
