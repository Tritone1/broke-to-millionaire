import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ACHIEVEMENTS } from '../data/achievements';
import { DAILY_MISSIONS } from '../data/missions';
import { add, formatBig, toNumber } from '../game/BigNumber';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';

export function MissionsScreen() {
  const state = useGameStore();
  const netWorth = add(state.money, state.totalSpent);
  const businessCount = Object.values(state.businessOwned).reduce((sum, value) => sum + value, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>TODAY’S PLAN</Text>
        <Text style={styles.title}>Missions</Text>
        <Text style={styles.subtitle}>Three fresh goals every local calendar day.</Text>
        {DAILY_MISSIONS.map((mission) => {
          const progress = mission.kind === 'taps' ? state.dailyStats.taps : mission.kind === 'businesses' ? state.dailyStats.businesses : toNumber(state.dailyStats.earned);
          const claimed = state.claimedMissions.includes(mission.id);
          const complete = progress >= mission.target;
          return (
            <Card key={mission.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{mission.title}</Text>
                  <Text style={styles.reward}>Reward ${formatBig(mission.reward)}</Text>
                </View>
                <Text style={styles.progressText}>{formatBig(Math.min(progress, mission.target))}/{formatBig(mission.target)}</Text>
              </View>
              <ProgressBar progress={progress / mission.target} />
              <AppButton disabled={!complete || claimed} onPress={() => state.claimMission(mission.id)} style={styles.claim} variant={complete && !claimed ? 'gold' : 'ghost'}>
                {claimed ? '✓ CLAIMED' : complete ? 'CLAIM REWARD' : 'IN PROGRESS'}
              </AppButton>
            </Card>
          );
        })}

        <Text style={styles.sectionTitle}>Achievements</Text>
        <Text style={styles.subtitle}>Permanent milestones across every run.</Text>
        {ACHIEVEMENTS.map((achievement) => {
          const progress = achievement.kind === 'netWorth' ? toNumber(netWorth) : achievement.kind === 'businesses' ? businessCount : toNumber(state.lifetimeEarnings);
          const complete = progress >= achievement.target;
          const claimed = state.claimedAchievements.includes(achievement.id);
          return (
            <Card key={achievement.id} style={styles.achievement}>
              <View style={styles.row}>
                <Text style={styles.medal}>{claimed ? '✅' : complete ? '🏆' : '🏅'}</Text>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{achievement.title}</Text>
                  <Text style={styles.description}>{achievement.description}</Text>
                </View>
                <Text style={styles.reward}>${formatBig(achievement.reward)}</Text>
              </View>
              <View style={styles.bar}><ProgressBar progress={progress / achievement.target} color={colors.gold} /></View>
              {complete && !claimed && <AppButton onPress={() => state.claimAchievement(achievement.id)} style={styles.claim}>CLAIM</AppButton>}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingTop: 24, paddingBottom: 120 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 24 },
  card: { marginBottom: 11 },
  achievement: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 12, marginTop: 3 },
  reward: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  progressText: { color: colors.muted, fontSize: 11, fontWeight: '700', marginLeft: 8 },
  claim: { marginTop: 11, minHeight: 40 },
  medal: { fontSize: 28, marginRight: 12 },
  bar: { marginTop: 12 },
});
