import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MOCK_LEADERS, type LeaderboardEntry } from '../data/leaderboard';
import { add, big, formatBig, toNumber } from '../game/BigNumber';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';

export function LeaderboardScreen() {
  const state = useGameStore();
  const playerWorth = add(state.money, state.totalSpent);
  const rows: LeaderboardEntry[] = [
    ...MOCK_LEADERS,
    { id: 'local-player', name: 'You', worth: playerWorth, avatar: '🕶️' },
  ].sort((a, b) => toNumber(big(b.worth)) - toNumber(big(a.worth)));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>Global Moguls</Text>
        <Text style={styles.subtitle}>Demo leaderboard • mock data</Text>
        <Card style={styles.backendNote}>
          <Text style={styles.backendTitle}>Backend-ready</Text>
          <Text style={styles.backendText}>Rows use stable IDs and normalized player fields, so the mock array can be replaced by an API response without changing this screen.</Text>
        </Card>
        {rows.map((row, index) => {
          const isPlayer = row.id === 'local-player';
          return (
            <View key={row.id} style={[styles.row, isPlayer && styles.playerRow]}>
              <Text style={[styles.position, index < 3 && styles.podium]}>{index + 1}</Text>
              <Text style={styles.avatar}>{row.avatar}</Text>
              <View style={styles.flex}>
                <Text style={[styles.name, isPlayer && styles.playerName]}>{row.name}</Text>
                <Text style={styles.worth}>${formatBig(row.worth, 2)}</Text>
              </View>
              {isPlayer && <Text style={styles.you}>YOU</Text>}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 60, alignItems: 'center' },
  trophy: { fontSize: 57 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.gold, fontSize: 12, fontWeight: '800', marginTop: 3, marginBottom: 20 },
  backendNote: { width: '100%', marginBottom: 14, borderColor: colors.greenDark },
  backendTitle: { color: colors.green, fontSize: 12, fontWeight: '900' },
  backendText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 8 },
  playerRow: { borderColor: colors.gold, backgroundColor: '#211D11' },
  position: { width: 30, color: colors.muted, fontSize: 16, fontWeight: '900' },
  podium: { color: colors.gold, fontSize: 20 },
  avatar: { fontSize: 29, marginRight: 12 },
  flex: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '900' },
  playerName: { color: colors.gold },
  worth: { color: colors.green, fontSize: 12, fontWeight: '700', marginTop: 3 },
  you: { color: colors.black, fontSize: 9, fontWeight: '900', backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
});
