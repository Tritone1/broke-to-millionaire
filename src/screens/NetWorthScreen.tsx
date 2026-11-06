import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RANKS } from '../data/ranks';
import { add, formatBig, toNumber } from '../game/BigNumber';
import { totalIncomePerSecond } from '../game/economy';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';

export function NetWorthScreen() {
  const state = useGameStore();
  const netWorth = add(state.money, state.totalSpent);
  const numericWorth = toNumber(netWorth);
  const currentIndex = Math.max(0, RANKS.findLastIndex((item) => numericWorth >= item.threshold));
  const current = RANKS[currentIndex] ?? RANKS[0];
  const next = RANKS[currentIndex + 1];
  const progress = next ? (numericWorth - (current?.threshold ?? 0)) / (next.threshold - (current?.threshold ?? 0)) : 1;
  const totalBusinesses = Object.values(state.businessOwned).reduce((sum, value) => sum + value, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.rankHero, { backgroundColor: current?.colors[1] ?? colors.surface }]}>
          <Text style={styles.avatar}>{current?.avatar}</Text>
          <Text style={styles.rankLabel}>YOUR RANK</Text>
          <Text style={styles.rankTitle}>{current?.title}</Text>
          <Text style={styles.netWorth}>${formatBig(netWorth, 2)} net worth</Text>
        </View>

        {!!next && (
          <Card style={styles.nextCard}>
            <View style={styles.row}>
              <Text style={styles.nextLabel}>Next: {next.title}</Text>
              <Text style={styles.nextAmount}>${formatBig(next.threshold)}</Text>
            </View>
            <ProgressBar progress={progress} color={colors.gold} height={10} />
          </Card>
        )}

        <View style={styles.grid}>
          <Card style={styles.statCard}><Text style={styles.statIcon}>💵</Text><Text style={styles.statValue}>${formatBig(state.money)}</Text><Text style={styles.statLabel}>Cash</Text></Card>
          <Card style={styles.statCard}><Text style={styles.statIcon}>🏢</Text><Text style={styles.statValue}>{formatBig(totalBusinesses)}</Text><Text style={styles.statLabel}>Businesses</Text></Card>
          <Card style={styles.statCard}><Text style={styles.statIcon}>📈</Text><Text style={styles.statValue}>${formatBig(totalIncomePerSecond(state))}</Text><Text style={styles.statLabel}>Per second</Text></Card>
          <Card style={styles.statCard}><Text style={styles.statIcon}>♛</Text><Text style={styles.statValue}>{state.legacyPoints}</Text><Text style={styles.statLabel}>Legacy Points</Text></Card>
        </View>

        <Text style={styles.section}>RANK LADDER</Text>
        {RANKS.map((rank, index) => {
          const achieved = index <= currentIndex;
          return (
            <View key={rank.title} style={[styles.rankRow, achieved && styles.achievedRow]}>
              <Text style={styles.rowAvatar}>{rank.avatar}</Text>
              <View style={styles.flex}><Text style={[styles.rowTitle, achieved && styles.achievedTitle]}>{rank.title}</Text><Text style={styles.threshold}>${formatBig(rank.threshold)}</Text></View>
              <Text style={styles.status}>{index === currentIndex ? 'YOU' : achieved ? '✓' : '🔒'}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 60 },
  rankHero: { borderRadius: 26, minHeight: 250, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.goldDark },
  avatar: { fontSize: 72 },
  rankLabel: { color: '#FFFFFFB8', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  rankTitle: { color: colors.text, fontSize: 31, fontWeight: '900' },
  netWorth: { color: colors.gold, fontSize: 17, fontWeight: '900', marginTop: 6 },
  nextCard: { marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  nextLabel: { color: colors.text, fontWeight: '800' },
  nextAmount: { color: colors.gold, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  statCard: { width: '48.5%', alignItems: 'center' },
  statIcon: { fontSize: 27 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 5 },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 27, marginBottom: 9 },
  rankRow: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 15, backgroundColor: colors.surface, marginBottom: 7, opacity: 0.58 },
  achievedRow: { opacity: 1, borderWidth: 1, borderColor: colors.border },
  rowAvatar: { fontSize: 28, width: 46 },
  flex: { flex: 1 },
  rowTitle: { color: colors.muted, fontWeight: '900', fontSize: 15 },
  achievedTitle: { color: colors.text },
  threshold: { color: colors.muted, fontSize: 11, marginTop: 2 },
  status: { color: colors.green, fontWeight: '900', fontSize: 11 },
});
