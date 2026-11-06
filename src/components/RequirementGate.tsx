import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { calculateLifeNetWorth, monthlyBillsFor, totalIncomePerSecond, useLifeStore } from '../store/lifeStore';
import { FOOD_PLANS, housingById, vehicleById } from '../data/living';
import { evaluateRequirements, type Requirement, type RequirementSnapshot } from '../game/requirements';
import { colors } from '../theme';
import { AppButton } from './AppButton';

type Props = {
  requirements: Requirement[];
  label: string;
  onAllowed: () => void | boolean;
  onHow?: (shortcut: string) => void;
  disabled?: boolean;
  variant?: 'gold' | 'green' | 'ghost' | 'danger';
};

export function requirementSnapshot(state: ReturnType<typeof useLifeStore.getState>): RequirementSnapshot {
  const bills = monthlyBillsFor(state).total + state.lateFees;
  return {
    cash: state.money,
    monthlySurplus: totalIncomePerSecond(state) * state.monthLengthSeconds - bills,
    skills: state.skills,
    degrees: state.completedCourses,
    experienceMonths: state.jobExperienceMonths,
    age: state.age,
    health: state.health,
    energy: state.energy,
    ownedItems: [...state.ownedLifestyle, ...state.ownedGoods],
    housingStatus: housingById(state.housing.id).status,
    foodLevel: Math.max(0, FOOD_PLANS.findIndex((plan) => plan.id === state.foodPlanId)),
    vehicleStatus: vehicleById(state.vehicle.id).status,
    relationshipStage: state.partner?.stage ?? 'single',
    reputation: state.reputation,
    netWorth: calculateLifeNetWorth(state),
  };
}

export function RequirementGate({ requirements, label, onAllowed, onHow, disabled = false, variant = 'gold' }: Props) {
  const source = useLifeStore(useShallow((state) => ({
    cash: state.money,
    monthlySurplus: totalIncomePerSecond(state) * state.monthLengthSeconds - monthlyBillsFor(state).total - state.lateFees,
    skills: state.skills,
    degrees: state.completedCourses,
    experienceMonths: state.jobExperienceMonths,
    age: state.age,
    health: Math.round(state.health),
    energy: Math.round(state.energy),
    ownedLifestyle: state.ownedLifestyle,
    ownedGoods: state.ownedGoods,
    housingStatus: housingById(state.housing.id).status,
    foodLevel: Math.max(0, FOOD_PLANS.findIndex((plan) => plan.id === state.foodPlanId)),
    vehicleStatus: vehicleById(state.vehicle.id).status,
    relationshipStage: state.partner?.stage ?? 'single',
    reputation: state.reputation,
    netWorth: calculateLifeNetWorth(state),
  })));
  const [visible, setVisible] = useState(false);
  const [actionError, setActionError] = useState(false);
  const snapshot = useMemo<RequirementSnapshot>(() => ({
    cash: source.cash,
    monthlySurplus: source.monthlySurplus,
    skills: source.skills,
    degrees: source.degrees,
    experienceMonths: source.experienceMonths,
    age: source.age,
    health: source.health,
    energy: source.energy,
    ownedItems: [...source.ownedLifestyle, ...source.ownedGoods],
    housingStatus: source.housingStatus,
    foodLevel: source.foodLevel,
    vehicleStatus: source.vehicleStatus,
    relationshipStage: source.relationshipStage,
    reputation: source.reputation,
    netWorth: source.netWorth,
  }), [source]);
  const results = useMemo(() => evaluateRequirements(requirements, snapshot), [requirements, snapshot]);
  const allMet = results.every((result) => result.met);
  const continueAction = () => {
    if (!allMet) return;
    const accepted = onAllowed();
    if (accepted === false) {
      setActionError(true);
      return;
    }
    setActionError(false);
    setVisible(false);
  };
  return (
    <>
      <AppButton variant={variant} disabled={disabled} onPress={() => { setActionError(false); setVisible(true); }}>{label}</AppButton>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.headingRow}><View><Text style={styles.eyebrow}>ACTION CHECKLIST</Text><Text style={styles.title}>{label}</Text></View><Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
            {results.length === 0 ? <Text style={styles.ready}>You are ready to continue.</Text> : results.map((result, index) => (
              <View key={`${result.kind}-${result.key ?? index}`} style={styles.requirement}>
                <Text style={[styles.status, result.met ? styles.met : styles.unmet]}>{result.met ? '✓' : '!'}</Text>
                <View style={styles.flex}><Text style={styles.requirementLabel}>{result.displayLabel}</Text><Text style={styles.progress}>{result.current} / {result.target}</Text></View>
                {!result.met && onHow ? <Pressable accessibilityRole="button" onPress={() => { setVisible(false); onHow(result.shortcut); }} style={styles.how}><Text style={styles.howText}>{result.shortcut}</Text></Pressable> : null}
              </View>
            ))}
            {actionError ? <Text style={styles.actionError}>Your situation changed before the action started. Review the checklist and try again.</Text> : null}
            <AppButton disabled={!allMet} onPress={continueAction} style={styles.continue}>{allMet ? 'CONTINUE' : 'REQUIREMENTS NOT MET'}</AppButton>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,20,38,0.72)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: '#F8FBFF', borderRadius: 24, borderWidth: 4, borderColor: '#245A86', padding: 18, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, elevation: 12 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { color: '#3F7299', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#153450', fontSize: 23, fontWeight: '900' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#DDEAF4', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#245A86', fontSize: 27, fontWeight: '900', lineHeight: 30 },
  requirement: { flexDirection: 'row', alignItems: 'center', minHeight: 58, borderRadius: 14, backgroundColor: '#EAF3F9', marginBottom: 8, padding: 9 },
  status: { width: 30, height: 30, borderRadius: 15, textAlign: 'center', textAlignVertical: 'center', color: '#FFF', fontSize: 18, fontWeight: '900', overflow: 'hidden' },
  met: { backgroundColor: colors.greenDark },
  unmet: { backgroundColor: colors.danger },
  flex: { flex: 1, paddingHorizontal: 9 },
  requirementLabel: { color: '#153450', fontWeight: '900', fontSize: 12 },
  progress: { color: '#58748A', fontSize: 10, marginTop: 2 },
  how: { maxWidth: 86, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 9, backgroundColor: '#4E9EDE' },
  howText: { color: '#FFF', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  continue: { marginTop: 8 },
  ready: { color: '#153450', fontSize: 14, marginVertical: 12 },
  actionError: { color: colors.danger, fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
