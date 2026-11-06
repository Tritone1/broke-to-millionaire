import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LIFESTYLE_ITEMS } from '../data/shop';
import { formatBig } from '../game/BigNumber';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { MoneyHeader } from '../components/MoneyHeader';
import { Screen } from '../components/Screen';

export function ShopScreen() {
  const state = useGameStore();
  const totalBonus = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.bonus, 0);

  return (
    <Screen>
      <MoneyHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>LIFESTYLE SHOP</Text>
          <Text style={styles.title}>Proof you made it.</Text>
          <Text style={styles.subtitle}>Every trophy is permanent and boosts all income—even after prestige.</Text>
          <View style={styles.bonusPill}><Text style={styles.bonus}>Permanent bonus +{Math.round(totalBonus * 100)}%</Text></View>
        </View>
        {LIFESTYLE_ITEMS.map((item) => {
          const owned = state.ownedLifestyle.includes(item.id);
          return (
            <Card key={item.id} style={[styles.item, owned && styles.itemOwned]}>
              <View style={styles.row}>
                <View style={styles.iconBox}><Text style={styles.icon}>{item.emoji}</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
                {owned && <Text style={styles.trophy}>🏆</Text>}
              </View>
              <AppButton disabled={owned} onPress={() => state.buyLifestyle(item.id)} style={styles.button} variant={owned ? 'ghost' : 'gold'}>
                {owned ? 'OWNED • PERMANENT' : `BUY • $${formatBig(item.cost)}`}
              </AppButton>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  header: { padding: 8, marginBottom: 12 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: 6 },
  bonusPill: { alignSelf: 'flex-start', backgroundColor: colors.greenDark, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, marginTop: 12 },
  bonus: { color: colors.green, fontSize: 12, fontWeight: '900' },
  item: { marginBottom: 12 },
  itemOwned: { borderColor: colors.goldDark, backgroundColor: '#19170F' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 62, height: 62, borderRadius: 19, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  icon: { fontSize: 36 },
  flex: { flex: 1 },
  category: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  name: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  description: { color: colors.green, fontWeight: '700', marginTop: 4 },
  trophy: { fontSize: 23 },
  button: { marginTop: 14 },
});
