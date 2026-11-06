import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatBig } from '../game/BigNumber';
import { legacyMultiplier, prestigePointsForLifetime } from '../game/formulas';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';

export function PrestigeScreen() {
  const state = useGameStore();
  const totalPotential = prestigePointsForLifetime(state.lifetimeEarnings);
  const gain = Math.max(0, totalPotential - state.legacyPoints);
  const nextRequirement = ((totalPotential + 1) ** 2) * 1_000_000;

  const confirmPrestige = () => {
    if (gain <= 0) return;
    Alert.alert(
      'Start a new legacy?',
      `Your cash, businesses, managers, and upgrades reset. You keep trophies, achievements, settings, and gain ${gain} Legacy Points.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Prestige', style: 'destructive', onPress: () => state.prestige() },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.symbol}>♛</Text>
        <Text style={styles.eyebrow}>PERMANENT POWER</Text>
        <Text style={styles.title}>Build a Legacy</Text>
        <Text style={styles.subtitle}>Reset this empire to make every future dollar easier.</Text>

        <Card style={styles.hero}>
          <Text style={styles.label}>LEGACY POINTS</Text>
          <Text style={styles.points}>{state.legacyPoints}</Text>
          <Text style={styles.multiplier}>{legacyMultiplier(state.legacyPoints).toFixed(2)}× all income</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>THIS PRESTIGE</Text>
              <Text style={styles.statValue}>+{gain} LP</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>BONUS GAIN</Text>
              <Text style={styles.statValue}>+{gain * 5}%</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.explainer}>
          <Text style={styles.explainerTitle}>How it works</Text>
          <Text style={styles.line}>• Earn lifetime cash to unlock Legacy Points.</Text>
          <Text style={styles.line}>• Every point adds +5% to taps and business income.</Text>
          <Text style={styles.line}>• Lifestyle trophies and achievements stay with you.</Text>
          <Text style={styles.line}>• Cash, businesses, managers, and upgrades reset.</Text>
        </Card>

        <AppButton disabled={gain <= 0} onPress={confirmPrestige} style={styles.button}>
          {gain > 0 ? `PRESTIGE FOR +${gain} LEGACY POINT${gain === 1 ? '' : 'S'}` : 'REACH $1M LIFETIME TO PRESTIGE'}
        </AppButton>
        <Text style={styles.next}>Next point at ${formatBig(nextRequirement)} lifetime earnings</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 32, paddingBottom: 120, alignItems: 'center' },
  symbol: { color: colors.gold, fontSize: 62 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 8, maxWidth: 320, lineHeight: 20 },
  hero: { width: '100%', marginTop: 26, alignItems: 'center', borderColor: colors.goldDark },
  label: { color: colors.muted, fontSize: 10, letterSpacing: 1.7, fontWeight: '900' },
  points: { color: colors.gold, fontSize: 54, fontWeight: '900', marginTop: 2 },
  multiplier: { color: colors.green, fontSize: 17, fontWeight: '900' },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 18 },
  row: { flexDirection: 'row', width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  statValue: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 4 },
  explainer: { width: '100%', marginTop: 14 },
  explainerTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  line: { color: colors.muted, lineHeight: 23, fontSize: 13 },
  button: { width: '100%', marginTop: 18, minHeight: 54 },
  next: { color: colors.muted, fontSize: 11, marginTop: 10 },
});
