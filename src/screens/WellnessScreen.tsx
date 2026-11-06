import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { SceneStage } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';
import { WELLNESS_ACTIONS } from '../data/wellness';
import { formatBig, toNumber } from '../game/BigNumber';
import { BASE_LIFESPAN_YEARS, estimatedLifespanYears, vitalityLabel } from '../game/wellness';
import { useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function WellnessScreen() {
  const state = useLifeStore();
  const [feedback, setFeedback] = useState('Choose activities to care for your character this month.');
  const lifespan = estimatedLifespanYears(state);
  const remainingYears = Math.max(0, lifespan - state.age);

  return (
    <Screen>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="hospital" pose={state.health < 35 ? 'hurt' : 'idle'} compact />
        <Text style={styles.eyebrow}>BODY & MIND</Text>
        <Text style={styles.title}>Wellness</Text>

        <Card style={styles.lifespanCard}>
          <View style={styles.lifespanRow}>
            <View style={styles.flex}><Text style={styles.smallLabel}>ESTIMATED LIFESPAN</Text><Text style={styles.lifespan}>{lifespan} years</Text></View>
            <View style={styles.remaining}><Text style={styles.smallLabel}>YEARS LEFT</Text><Text style={styles.remainingValue}>{remainingYears}</Text></View>
          </View>
          <ProgressBar progress={remainingYears / Math.max(1, lifespan)} color={colors.greenDark} />
          <Text style={styles.explainer}>Every life begins with a {BASE_LIFESPAN_YEARS}-year estimate. Health and happiness can raise or lower it, while high stress reduces it.</Text>
        </Card>

        <View style={styles.vitalsGrid}>
          <Card style={styles.vital}><Text style={styles.vitalIcon}>⚡</Text><Text style={styles.vitalName}>ENERGY</Text><Text style={styles.vitalValue}>{Math.round(state.energy)}</Text><Text style={styles.vitalState}>{vitalityLabel(state.energy)}</Text><ProgressBar progress={state.energy / 100} color="#EAB52E" /></Card>
          <Card style={styles.vital}><Text style={styles.vitalIcon}>♥</Text><Text style={styles.vitalName}>HEALTH</Text><Text style={styles.vitalValue}>{Math.round(state.health)}</Text><Text style={styles.vitalState}>{vitalityLabel(state.health)}</Text><ProgressBar progress={state.health / 100} color="#D85361" /></Card>
          <Card style={styles.vital}><Text style={styles.vitalIcon}>●</Text><Text style={styles.vitalName}>HAPPINESS</Text><Text style={styles.vitalValue}>{Math.round(state.happiness)}</Text><Text style={styles.vitalState}>{vitalityLabel(state.happiness)}</Text><ProgressBar progress={state.happiness / 100} color="#4BAF65" /></Card>
          <Card style={styles.vital}><Text style={styles.vitalIcon}>☁</Text><Text style={styles.vitalName}>STRESS</Text><Text style={styles.vitalValue}>{Math.round(state.stress)}</Text><Text style={styles.vitalState}>{state.stress <= 20 ? 'Calm' : state.stress <= 55 ? 'Manageable' : state.stress <= 79 ? 'High' : 'Dangerous'}</Text><ProgressBar progress={state.stress / 100} color="#8E62B6" /></Card>
        </View>

        <Card style={styles.rules}>
          <Text style={styles.rulesTitle}>ENERGY RULES</Text>
          <Text style={styles.ruleText}>Work shift: 5 energy · Course enrollment: 10 energy · Study session: 8 energy · Interview: 15 energy.</Text>
          <Text style={styles.ruleText}>Very low energy and high stress also reduce monthly health. Better food and healthcare improve health every payday.</Text>
        </Card>

        <Text style={styles.section}>ACTIVITIES · ONCE PER GAME MONTH</Text>
        <Text style={styles.feedback}>{feedback}</Text>
        {WELLNESS_ACTIONS.map((action) => {
          const used = state.wellnessActionMonths[action.id] === state.gameMonth;
          const cannotAfford = toNumber(state.money) < action.cost;
          const tooTired = state.energy + action.effects.energy < 0;
          const disabled = used || cannotAfford || tooTired;
          const effectText = `Energy ${signed(action.effects.energy)} · Health ${signed(action.effects.health)} · Happiness ${signed(action.effects.happiness)} · Stress ${signed(action.effects.stress)}`;
          const disabledReason = used ? 'USED THIS MONTH' : cannotAfford ? 'NOT ENOUGH CASH' : tooTired ? 'NOT ENOUGH ENERGY' : action.cost === 0 ? 'FREE' : `$${formatBig(action.cost)}`;
          return (
            <Card key={action.id} style={[styles.actionCard, used && styles.used]}>
              <View style={styles.actionRow}><Text style={styles.actionIcon}>{action.emoji}</Text><View style={styles.flex}><Text style={styles.actionTitle}>{action.name}</Text><Text style={styles.actionDescription}>{action.description}</Text></View></View>
              <Text style={styles.effects}>{effectText}</Text>
              <AppButton disabled={disabled} variant={action.cost === 0 ? 'green' : 'gold'} onPress={() => {
                const completed = state.performWellnessAction(action.id);
                setFeedback(completed ? `${action.name} completed. Your vitals have been updated.` : `${action.name} is not available right now.`);
              }}>{disabledReason}</AppButton>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  eyebrow: { color: colors.greenDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginTop: 14 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', marginBottom: 10 },
  lifespanCard: { borderColor: colors.greenDark, backgroundColor: '#EAF7ED' },
  lifespanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flex: { flex: 1 },
  smallLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  lifespan: { color: colors.greenDark, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  remaining: { alignItems: 'flex-end' },
  remainingValue: { color: colors.text, fontSize: 25, fontWeight: '900' },
  explainer: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  vital: { width: '48.7%', padding: 11 },
  vitalIcon: { fontSize: 20 },
  vitalName: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 3 },
  vitalValue: { color: colors.text, fontSize: 24, fontWeight: '900' },
  vitalState: { color: colors.greenDark, fontSize: 9, fontWeight: '800', marginBottom: 6 },
  rules: { marginTop: 10, borderColor: '#D8B44A' },
  rulesTitle: { color: colors.goldDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  ruleText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 22, marginBottom: 4 },
  feedback: { color: colors.greenDark, fontSize: 10, lineHeight: 15, marginBottom: 9 },
  actionCard: { marginBottom: 9 },
  used: { opacity: 0.68 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 47, fontSize: 31 },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  actionDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  effects: { color: colors.greenDark, fontSize: 9, fontWeight: '800', marginVertical: 9 },
});
