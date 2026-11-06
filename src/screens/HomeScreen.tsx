import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { BUSINESSES } from '../data/businesses';
import { RANKS } from '../data/ranks';
import { add, toNumber } from '../game/BigNumber';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { BusinessCard } from '../components/BusinessCard';
import { MoneyHeader } from '../components/MoneyHeader';
import { Screen } from '../components/Screen';
import { TapButton } from '../components/TapButton';

export function HomeScreen() {
  const state = useGameStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const netWorth = add(state.money, state.totalSpent);
  const rank = [...RANKS].reverse().find((item) => toNumber(netWorth) >= item.threshold) ?? RANKS[0];
  const tierGroups = useMemo(() => Array.from(new Set(BUSINESSES.map((item) => item.tier))), []);

  return (
    <Screen>
      <MoneyHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLinks}>
          <Pressable onPress={() => navigation.navigate('NetWorth')} style={styles.rankCard}>
            <Text style={styles.rankAvatar}>{rank?.avatar}</Text>
            <View style={styles.flex}>
              <Text style={styles.label}>CURRENT RANK</Text>
              <Text style={styles.rankTitle}>{rank?.title}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Leaderboard')} style={styles.leaderboard}>
            <Text style={styles.leaderboardIcon}>🏆</Text>
            <Text style={styles.leaderboardText}>Leaders</Text>
          </Pressable>
        </View>

        <TapButton />

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>BUILD YOUR EMPIRE</Text>
            <Text style={styles.sectionTitle}>Businesses</Text>
          </View>
          <View style={styles.purchaseModes}>
            {([1, 10, 'max'] as const).map((mode) => (
              <Pressable
                key={String(mode)}
                onPress={() => state.setPurchaseMode(mode)}
                style={[styles.mode, state.purchaseMode === mode && styles.modeActive]}
              >
                <Text style={[styles.modeText, state.purchaseMode === mode && styles.modeTextActive]}>{mode === 'max' ? 'MAX' : `×${mode}`}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {tierGroups.map((tier) => {
          const entries = BUSINESSES.filter((item) => item.tier === tier);
          return (
            <View key={tier}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierNumber}>TIER {tier}</Text>
                <Text style={styles.tierName}>{entries[0]?.tierName}</Text>
              </View>
              {entries.map((definition) => {
                const index = BUSINESSES.findIndex((item) => item.id === definition.id);
                const previous = BUSINESSES[index - 1];
                const unlocked = !previous || (state.businessOwned[previous.id] ?? 0) >= 10;
                return <BusinessCard key={definition.id} definition={definition} unlocked={unlocked} />;
              })}
            </View>
          );
        })}
        <Text style={styles.end}>Every empire started with one tap.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  topLinks: { flexDirection: 'row', marginHorizontal: 16, gap: 10 },
  rankCard: { flex: 1, minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 12 },
  rankAvatar: { fontSize: 31, marginRight: 10 },
  flex: { flex: 1 },
  label: { color: colors.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  rankTitle: { color: colors.gold, fontSize: 16, fontWeight: '900', marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 28 },
  leaderboard: { width: 76, minHeight: 70, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  leaderboardIcon: { fontSize: 25 },
  leaderboardText: { color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 18, marginTop: 18, marginBottom: 12 },
  sectionEyebrow: { color: colors.green, fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 27, fontWeight: '900' },
  purchaseModes: { flexDirection: 'row', gap: 3, padding: 3, backgroundColor: colors.surface, borderRadius: 10 },
  mode: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8 },
  modeActive: { backgroundColor: colors.gold },
  modeText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  modeTextActive: { color: colors.black },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 12, marginBottom: 8 },
  tierNumber: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginRight: 8 },
  tierName: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  end: { color: colors.muted, textAlign: 'center', marginTop: 20, fontSize: 12 },
});
