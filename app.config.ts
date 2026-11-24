import type { ConfigContext, ExpoConfig } from 'expo/config';

const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

function pluginName(plugin: NonNullable<ExpoConfig['plugins']>[number]): string {
  return Array.isArray(plugin) ? plugin[0] ?? '' : plugin ?? '';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const productionAds = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'false';
  const configuredAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim();
  const androidAdMobAppId = configuredAndroidAppId || TEST_ADMOB_ANDROID_APP_ID;
  const iosAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim() || TEST_ADMOB_IOS_APP_ID;
  if (productionAds && !configuredAndroidAppId) {
    throw new Error('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID is required when production ads are enabled.');
  }
  const plugins = (config.plugins ?? []).filter((plugin) => ![
    'expo-build-properties',
    'expo-splash-screen',
    'react-native-google-mobile-ads',
  ].includes(pluginName(plugin)));

  return {
    ...config,
    name: 'Broke to Millionaire',
    slug: config.slug ?? 'rich-simulator',
    icon: './assets/release/app-icon.png',
    ios: {
      ...config.ios,
      icon: './assets/release/app-icon.png',
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        backgroundColor: '#F2E5CA',
        foregroundImage: './assets/release/adaptive-foreground.png',
      },
    },
    plugins: [
      ...plugins,
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F2E5CA',
          image: './assets/release/splash-icon.png',
          imageWidth: 230,
          resizeMode: 'contain',
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: androidAdMobAppId,
          iosAppId: iosAdMobAppId,
          delayAppMeasurementInit: true,
          userTrackingUsageDescription: 'This identifier may be used to deliver and measure advertisements with your permission.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            newArchEnabled: false,
            extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
          },
        },
      ],
    ],
    extra: {
      ...config.extra,
      monetization: {
        usingTestAdMobAppIds:
          androidAdMobAppId === TEST_ADMOB_ANDROID_APP_ID || iosAdMobAppId === TEST_ADMOB_IOS_APP_ID,
      },
    },
  };
};
