describe('Expo Go ad service', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('does not load the native Google Mobile Ads module', () => {
    const nativeAdsFactory = jest.fn(() => {
      throw new Error('The native AdMob module must not load inside Expo Go.');
    });

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: 'storeClient' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));
    jest.doMock('react-native-google-mobile-ads', nativeAdsFactory);
    jest.doMock('../src/services/backend/authService', () => ({
      ensureGuestSession: jest.fn(),
    }));

    expect(() => {
      jest.isolateModules(() => {
        require('../src/services/ads.native');
      });
    }).not.toThrow();
    expect(nativeAdsFactory).not.toHaveBeenCalled();
  });

  it('loads the native Google Mobile Ads module in a standalone store build', () => {
    const nativeAdsFactory = jest.fn(() => ({
      __esModule: true,
      default: jest.fn(),
    }));

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: 'standalone' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));
    jest.doMock('react-native-google-mobile-ads', nativeAdsFactory);
    jest.doMock('../src/services/backend/authService', () => ({
      ensureGuestSession: jest.fn(),
    }));

    jest.isolateModules(() => {
      require('../src/services/ads.native');
    });

    expect(nativeAdsFactory).toHaveBeenCalledTimes(1);
  });
});
