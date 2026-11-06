import { Image } from 'react-native';

import { imageAssetCacheStats, markImageSourceDecoded, preloadImageSource, resetImageAssetCacheForTests } from '../imageAssetCache';

describe('image asset cache', () => {
  beforeEach(() => {
    resetImageAssetCacheForTests();
    jest.restoreAllMocks();
  });

  it('coalesces concurrent preload requests for the same asset', async () => {
    const prefetch = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
    const source = { uri: 'https://assets.invalid/avatar-head.png' };
    await Promise.all([preloadImageSource(source), preloadImageSource(source)]);

    expect(prefetch).toHaveBeenCalledTimes(1);
    expect(imageAssetCacheStats()).toMatchObject({ prefetchRequests: 1, joinedRequests: 1, prefetchedAssets: 1, failures: 0 });
  });

  it('uses a decoded image immediately on the next request', async () => {
    const prefetch = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
    const source = { uri: 'https://assets.invalid/avatar-body.png' };
    markImageSourceDecoded(source);

    await expect(preloadImageSource(source)).resolves.toBe(true);
    expect(prefetch).not.toHaveBeenCalled();
    expect(imageAssetCacheStats()).toMatchObject({ cacheHits: 1, decodeMarks: 1, decodedAssets: 1 });
  });

  it('accepts React Native Web prefetch completion, which resolves without a boolean', async () => {
    jest.spyOn(Image, 'prefetch').mockImplementation(async () => undefined as unknown as boolean);
    await expect(preloadImageSource({ uri: '/assets/avatar.png' })).resolves.toBe(true);
    expect(imageAssetCacheStats()).toMatchObject({ prefetchedAssets: 1, failures: 0 });
  });

  it('settles failed requests so loading cannot remain pending forever', async () => {
    jest.spyOn(Image, 'prefetch').mockRejectedValue(new Error('decode failed'));
    await expect(preloadImageSource({ uri: 'https://assets.invalid/missing.png' })).resolves.toBe(false);
    expect(imageAssetCacheStats()).toMatchObject({ failures: 1, inFlightRequests: 0 });
  });
});
