import { Image, type ImageSourcePropType } from 'react-native';

const prefetched = new Set<string>();
const decoded = new Set<string>();
const inFlight = new Map<string, Promise<boolean>>();
const stats = { prefetchRequests: 0, cacheHits: 0, joinedRequests: 0, decodeMarks: 0, failures: 0 };

export function imageSourceKey(source: ImageSourcePropType): string {
  if (typeof source === 'object' && source !== null && !Array.isArray(source) && 'uri' in source && typeof source.uri === 'string') return source.uri;
  const resolver = (Image as typeof Image & { resolveAssetSource?: (value: ImageSourcePropType) => { uri?: string } | null }).resolveAssetSource;
  const resolved = typeof resolver === 'function' ? resolver(source) : null;
  return resolved?.uri ?? JSON.stringify(source);
}

export function markImageSourceDecoded(source: ImageSourcePropType): void {
  const key = imageSourceKey(source);
  if (!decoded.has(key)) stats.decodeMarks += 1;
  decoded.add(key);
  prefetched.add(key);
}

export function isImageSourceDecoded(source: ImageSourcePropType): boolean {
  return decoded.has(imageSourceKey(source));
}

export function preloadImageSource(source: ImageSourcePropType): Promise<boolean> {
  const key = imageSourceKey(source);
  if (prefetched.has(key)) {
    stats.cacheHits += 1;
    return Promise.resolve(true);
  }
  const pending = inFlight.get(key);
  if (pending) {
    stats.joinedRequests += 1;
    return pending;
  }
  stats.prefetchRequests += 1;
  const prefetch = (Image as typeof Image & { prefetch?: (uri: string) => Promise<boolean> }).prefetch;
  const origin = (globalThis as { location?: { origin?: string } }).location?.origin;
  const requestUri = key.startsWith('/') && origin ? `${origin}${key}` : key;
  const request = (typeof prefetch === 'function' ? prefetch(requestUri) : Promise.resolve(true))
    .then((loaded) => {
      // React Native resolves with a boolean; React Native Web resolves with void.
      // Only an explicit false is a failed preload.
      const succeeded = loaded !== false;
      if (succeeded) prefetched.add(key);
      else stats.failures += 1;
      return succeeded;
    })
    .catch(() => {
      stats.failures += 1;
      return false;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

export function preloadImageSources(sources: readonly ImageSourcePropType[]): Promise<boolean[]> {
  return Promise.all([...new Map(sources.map((source) => [imageSourceKey(source), source])).values()].map(preloadImageSource));
}

export function imageAssetCacheStats() {
  return { ...stats, prefetchedAssets: prefetched.size, decodedAssets: decoded.size, inFlightRequests: inFlight.size };
}

export function resetImageAssetCacheForTests(): void {
  prefetched.clear();
  decoded.clear();
  inFlight.clear();
  stats.prefetchRequests = 0;
  stats.cacheHits = 0;
  stats.joinedRequests = 0;
  stats.decodeMarks = 0;
  stats.failures = 0;
}
