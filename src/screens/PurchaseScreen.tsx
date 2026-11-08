import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { PURCHASE_PRODUCTS } from '../data/purchases';
import { usePurchaseStore } from '../store/purchaseStore';
import { colors } from '../theme';

export function PurchaseScreen() {
  const initialized = usePurchaseStore((state) => state.initialized);
  const available = usePurchaseStore((state) => state.available);
  const loading = usePurchaseStore((state) => state.loading);
  const products = usePurchaseStore((state) => state.products);
  const removeAds = usePurchaseStore((state) => state.removeAds);
  const message = usePurchaseStore((state) => state.message);
  const initialize = usePurchaseStore((state) => state.initialize);
  const buy = usePurchaseStore((state) => state.buy);
  const restore = usePurchaseStore((state) => state.restore);

  useEffect(() => {
    if (!initialized) void initialize();
  }, [initialize, initialized]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>LILI GAMES STORE</Text>
        <Text style={styles.title}>Give your life a boost</Text>
        <Text style={styles.subtitle}>Purchases use Google Play. Cash is virtual game currency with no real-world value.</Text>

        {!available && initialized ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeTitle}>Store preview</Text>
            <Text style={styles.noticeText}>Real purchases are available in the Android internal-test or production build. Expo Go displays the catalog safely without opening checkout.</Text>
          </Card>
        ) : null}

        {PURCHASE_PRODUCTS.map((definition) => {
          const storeProduct = products.find((product) => product.id === definition.id);
          const owned = definition.id === 'remove_ads' && removeAds;
          return (
            <Card key={definition.id} style={styles.productCard}>
              <View style={styles.productRow}>
                <Text style={styles.icon}>{definition.icon}</Text>
                <View style={styles.productCopy}>
                  <Text style={styles.productTitle}>{definition.title}</Text>
                  <Text style={styles.productDescription}>{definition.description}</Text>
                </View>
              </View>
              <AppButton
                variant={owned ? 'green' : 'gold'}
                disabled={loading || owned || !available}
                onPress={() => { void buy(definition.id); }}
              >
                {owned ? 'OWNED' : storeProduct?.priceString ?? definition.fallbackPrice}
              </AppButton>
            </Card>
          );
        })}

        {loading ? <ActivityIndicator color={colors.greenDark} size="large" style={styles.spinner} /> : null}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

        <AppButton variant="ghost" disabled={loading} onPress={() => { void restore(); }}>SYNC & RESTORE PURCHASES</AppButton>
        <Text style={styles.legal}>Automatic ads may appear during normal play. Remove Ads disables automatic interstitial ads only; rewarded ads always remain optional.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  eyebrow: { color: colors.greenDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 14 },
  notice: { borderColor: colors.goldDark, marginBottom: 12 },
  noticeTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  noticeText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  productCard: { marginBottom: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 34, marginRight: 12 },
  productCopy: { flex: 1 },
  productTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  productDescription: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  spinner: { marginVertical: 12 },
  message: { color: colors.greenDark, backgroundColor: '#E5F6E6', borderColor: colors.green, borderWidth: 1, borderRadius: 12, padding: 12, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  legal: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 14 },
});
