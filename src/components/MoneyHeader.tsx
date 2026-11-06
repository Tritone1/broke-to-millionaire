import { StyleSheet, Text, View } from 'react-native';

import { formatBig } from '../game/BigNumber';
import { totalIncomePerSecond } from '../game/economy';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';

export function MoneyHeader() {
  const state = useGameStore();
  const income = totalIncomePerSecond(state);
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>AVAILABLE CASH</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.money}>${formatBig(state.money, 2)}</Text>
      <View style={styles.incomePill}>
        <Text style={styles.income}>+${formatBig(income, 2)} / sec</Text>
        {state.runtimeNow < state.boostUntil && <Text style={styles.boost}>  •  2× VIRAL</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, alignItems: 'center', backgroundColor: colors.background },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  money: { color: colors.gold, fontSize: 38, fontWeight: '900', marginTop: 2, maxWidth: '95%' },
  incomePill: { flexDirection: 'row', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginTop: 5 },
  income: { color: colors.green, fontSize: 13, fontWeight: '800' },
  boost: { color: colors.gold, fontSize: 12, fontWeight: '900' },
});
