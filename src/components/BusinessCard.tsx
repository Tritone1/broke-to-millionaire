import { StyleSheet, Text, View } from 'react-native';

import type { BusinessDefinition } from '../data/businesses';
import { formatBig } from '../game/BigNumber';
import {
  affordableQuantity,
  bulkBusinessCost,
  businessCost,
  businessIncomePerSecond,
  managerCost,
  upgradeCost,
} from '../game/formulas';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

export function BusinessCard({ definition, unlocked }: { definition: BusinessDefinition; unlocked: boolean }) {
  const state = useGameStore();
  const owned = state.businessOwned[definition.id] ?? 0;
  const hasManager = state.managers[definition.id] ?? false;
  const upgradeLevel = state.businessUpgrades[definition.id] ?? 0;
  const quantity = state.purchaseMode === 'max'
    ? affordableQuantity(definition, owned, state.money)
    : state.purchaseMode;
  const displayQuantity = Math.max(1, quantity);
  const cost = state.purchaseMode === 1
    ? businessCost(definition, owned)
    : bulkBusinessCost(definition, owned, displayQuantity);
  const income = businessIncomePerSecond(definition, owned, hasManager, upgradeLevel);
  const cycleProgress = owned > 0 ? (state.runtimeNow % (definition.cycleSeconds * 1_000)) / (definition.cycleSeconds * 1_000) : 0;

  if (!unlocked) {
    return (
      <Card style={styles.locked}>
        <Text style={styles.lockIcon}>🔒</Text>
        <View style={styles.flex}>
          <Text style={styles.lockedTitle}>Next opportunity locked</Text>
          <Text style={styles.muted}>Own 10 of the previous business to unlock</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.emojiBox}><Text style={styles.emoji}>{definition.emoji}</Text></View>
        <View style={styles.flex}>
          <Text style={styles.name}>{definition.name}</Text>
          <Text style={styles.meta}>{owned} owned  •  ${formatBig(income, 2)}/s</Text>
        </View>
        <View style={styles.ownedBadge}><Text style={styles.ownedText}>{owned}</Text></View>
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar progress={cycleProgress} height={5} />
        <Text style={styles.cycle}>{definition.cycleSeconds}s cycle</Text>
      </View>
      <AppButton disabled={quantity === 0} onPress={() => state.buyBusiness(definition.id)} style={styles.buy}>
        {`BUY ${state.purchaseMode === 'max' ? `MAX (${quantity})` : `×${state.purchaseMode}`}  •  $${formatBig(cost)}`}
      </AppButton>
      {owned > 0 && (
        <View style={styles.actions}>
          <AppButton
            variant="ghost"
            disabled={hasManager}
            onPress={() => state.buyManager(definition.id)}
            style={styles.smallButton}
          >
            {hasManager ? '✓ Manager • 2×' : `Hire manager • $${formatBig(managerCost(definition))}`}
          </AppButton>
          <AppButton
            variant="ghost"
            onPress={() => state.buyBusinessUpgrade(definition.id)}
            style={styles.smallButton}
          >
            {`2× Upgrade Lv ${upgradeLevel} • $${formatBig(upgradeCost(definition, upgradeLevel))}`}
          </AppButton>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  flex: { flex: 1 },
  name: { color: colors.text, fontWeight: '900', fontSize: 16 },
  meta: { color: colors.green, fontWeight: '700', fontSize: 12, marginTop: 3 },
  ownedBadge: { minWidth: 38, height: 34, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  ownedText: { color: colors.black, fontWeight: '900', fontSize: 14 },
  progressWrap: { marginTop: 12 },
  cycle: { color: colors.muted, fontSize: 9, marginTop: 3, textAlign: 'right' },
  buy: { marginTop: 9 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallButton: { flex: 1, paddingHorizontal: 7, minHeight: 42 },
  locked: { marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', opacity: 0.65 },
  lockIcon: { fontSize: 27, marginRight: 12 },
  lockedTitle: { color: colors.text, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
