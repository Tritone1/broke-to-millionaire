import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { RequirementGate } from '../components/RequirementGate';
import { ActionDock } from '../components/scene/ActionDock';
import { SceneStage } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';
import { COURSES, type SkillName } from '../data/courses';
import { FOOD_PLANS, housingById, vehicleById } from '../data/living';
import { formatBig, formatCurrency } from '../game/BigNumber';
import { courseProgress, STUDY_SESSION_ENERGY, STUDY_SESSION_HOURS } from '../game/courseProgress';
import type { Requirement } from '../game/requirements';
import { useRewardedAd } from '../services/ads';
import { monthlyBillsFor, totalIncomePerSecond, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

const SKILLS: Record<SkillName, string> = { intelligence: '🧠 INT', business: '💼 BIZ', finance: '📈 FIN', tech: '💻 TECH', charisma: '✨ CHAR' };
const HOUSING_NAMES: Record<number, string> = { 0: 'Homeless', 2: 'Shared room', 6: 'Studio', 14: 'Apartment', 24: 'House', 48: 'Villa', 80: 'Mansion', 100: 'Penthouse' };
const VEHICLE_NAMES: Record<number, string> = { 0: 'Walking', 2: 'Public transport', 5: 'Used car', 12: 'Economy car', 22: 'SUV', 48: 'Sports car', 68: 'Luxury car', 92: 'Supercar', 100: 'Private jet' };

export function StudyScreen() {
  const [studyFeedback, setStudyFeedback] = useState<string | null>(null);
  const state = useLifeStore();
  const navigation = useNavigation();
  const { showRewardedAd } = useRewardedAd();
  const active = COURSES.find((course) => course.id === state.activeCourse?.courseId);
  const progress = active && state.activeCourse ? courseProgress(state.activeCourse, active, state.gameMonth) : null;
  const estimatedSeconds = progress ? Math.max(0, progress.monthsRemaining * state.monthLengthSeconds - state.monthProgressSeconds) : 0;
  const projectedIncome = totalIncomePerSecond(state) * state.monthLengthSeconds;
  const projectedBills = monthlyBillsFor(state).total + state.lateFees;
  useEffect(() => {
    if (!studyFeedback) return undefined;
    const timer = setTimeout(() => setStudyFeedback(null), 1600);
    return () => clearTimeout(timer);
  }, [studyFeedback]);
  const study = () => {
    const previous = state.activeCourse?.activeProgress ?? 0;
    if (!state.studyActiveCourse()) return;
    const next = useLifeStore.getState().activeCourse?.activeProgress ?? previous;
    const gain = Math.max(0, next - previous);
    setStudyFeedback(`+${gain.toFixed(1)}% study progress · -8 energy`);
  };
  const exam = () => {
    const result = state.takeCourseExam();
    Alert.alert(result === 'passed' ? 'Exam passed!' : result === 'failed' ? 'Exam not passed' : 'Not ready', result === 'passed' ? 'Your qualification is unlocked.' : result === 'failed' ? 'Study more before your retake.' : 'Finish studying and keep at least 8 energy.');
  };
  const openLiving = () => navigation.dispatch(CommonActions.navigate('Living'));
  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="university" pose={active ? 'talk' : 'idle'} compact />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>EDUCATION CENTER</Text><Text style={styles.title}>Study</Text>
          <View style={styles.lifeRow}><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🏠</Text><Text style={styles.lifeValue}>{housingById(state.housing.id).name}</Text></View><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🍽️</Text><Text style={styles.lifeValue}>{FOOD_PLANS.find((plan) => plan.id === state.foodPlanId)?.name ?? 'Food'}</Text></View><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🚗</Text><Text style={styles.lifeValue}>{vehicleById(state.vehicle.id).name}</Text></View></View>
          <View style={styles.skills}>{(Object.keys(SKILLS) as SkillName[]).map((skill) => <View key={skill} style={styles.skill}><Text style={styles.skillName}>{SKILLS[skill]}</Text><Text style={styles.skillValue}>{state.skills[skill]}</Text></View>)}</View>
          {active && state.activeCourse && progress ? <Card style={styles.active}>
            <Text style={styles.activeLabel}>{progress.readyToGraduate ? 'EXAM READY' : 'STUDY IN PROGRESS'}</Text>
            <Text style={styles.courseTitle}>{active.emoji} {active.name}</Text>
            <ProgressBar progress={progress.totalProgress / 100} />
            <View style={styles.progressGrid}>
              <View style={styles.progressCell}><Text style={styles.progressValue}>{progress.totalProgress.toFixed(1)}%</Text><Text style={styles.progressLabel}>TOTAL</Text></View>
              <View style={styles.progressCell}><Text style={styles.progressValue}>{progress.passiveProgress.toFixed(1)}%</Text><Text style={styles.progressLabel}>MONTHLY</Text></View>
              <View style={styles.progressCell}><Text style={styles.progressValue}>{progress.activeProgress.toFixed(1)}%</Text><Text style={styles.progressLabel}>ACTIVE</Text></View>
            </View>
            <Text style={styles.meta}>{progress.monthsCompleted}/{active.durationMonths} months completed · {formatCurrency(active.monthlyTuition)}/month tuition</Text>
            <Text style={styles.meta}>{progress.monthsRemaining > 0 ? `About ${Math.ceil(estimatedSeconds)} seconds remain at 1x.` : progress.activeProgress < 50 ? `${(50 - progress.activeProgress).toFixed(1)}% active study still required.` : 'Course duration and study requirements are complete.'}</Text>
            <Text style={styles.meta}>Study session: {STUDY_SESSION_HOURS} in-game hours · {STUDY_SESSION_ENERGY} energy · active study capped at 50%</Text>
            <View style={styles.buttonRow}><AppButton variant="green" disabled={state.energy < STUDY_SESSION_ENERGY || progress.activeProgress >= 50} onPress={study} style={styles.flex}>STUDY SESSION</AppButton>{progress.readyToGraduate ? <AppButton onPress={exam} style={styles.flex}>TAKE EXAM</AppButton> : <AppButton disabled={progress.activeProgress >= 50} onPress={async () => { if (await showRewardedAd('Study focus boost')) state.fastForwardCourseMonth(); }} style={styles.flex}>FOCUS BOOST</AppButton>}</View>
            {studyFeedback ? <Text style={styles.studyFeedback}>{studyFeedback}</Text> : null}
          </Card> : null}
          <Text style={styles.section}>COURSES</Text>
          {COURSES.map((course) => {
            const completed = state.completedCourses.includes(course.id);
            const requirements: Requirement[] = [
              { kind: 'fee', amount: course.cost, label: 'Enrollment cash' }, { kind: 'energy', amount: 10 },
              { kind: 'housing', amount: course.living.housingStatus, label: `Housing: ${HOUSING_NAMES[course.living.housingStatus]} or better` },
              { kind: 'food', amount: course.living.foodLevel, label: `Food: ${FOOD_PLANS[course.living.foodLevel]?.name ?? 'Required plan'} or better` },
              { kind: 'vehicle', amount: course.living.vehicleStatus, label: `Transport: ${VEHICLE_NAMES[course.living.vehicleStatus]} or better` },
            ];
            if (course.prerequisite) requirements.push({ kind: 'degree', key: course.prerequisite, label: COURSES.find((item) => item.id === course.prerequisite)?.name });
            const projectedNet = projectedIncome - projectedBills - course.monthlyTuition;
            return <Card key={course.id} style={styles.course}><View style={styles.courseRow}><Text style={styles.courseEmoji}>{course.emoji}</Text><View style={styles.flex}><Text style={styles.courseName}>{course.name}</Text><Text style={styles.cost}>${formatBig(course.cost)} entry · ${formatBig(course.monthlyTuition)}/month</Text><Text style={styles.duration}>Difficulty {course.difficulty}/5 · {course.durationMonths} game months at 1x</Text><Text style={styles.needs}>🏠 {HOUSING_NAMES[course.living.housingStatus]} · 🍽️ {FOOD_PLANS[course.living.foodLevel]?.name ?? 'Food plan'} · 🚗 {VEHICLE_NAMES[course.living.vehicleStatus]}</Text>{course.monthlyTuition > 0 && projectedNet < 0 ? <Text style={styles.budgetWarning}>Warning: projected monthly net {formatCurrency(projectedNet)}. Enrollment is allowed, but unpaid bills still have consequences.</Text> : null}</View></View>{completed ? <AppButton disabled onPress={() => undefined}>✓ COMPLETED</AppButton> : <RequirementGate disabled={!!state.activeCourse} requirements={requirements} label={state.activeCourse ? 'FINISH CURRENT COURSE' : 'CHECK REQUIREMENTS'} onAllowed={() => state.startCourse(course.id)} onHow={openLiving} />}</Card>;
          })}
        </View>
      </ScrollView>
      <ActionDock active="career" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 10 }, body: { padding: 14 }, eyebrow: { color: '#2677AD', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, title: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 10 }, lifeRow: { flexDirection: 'row', gap: 6 }, lifeBadge: { flex: 1, minHeight: 65, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 5 }, lifeIcon: { fontSize: 20 }, lifeValue: { color: colors.text, fontSize: 8, fontWeight: '900', textAlign: 'center', marginTop: 3 }, skills: { flexDirection: 'row', gap: 5, marginTop: 8 }, skill: { flex: 1, alignItems: 'center', backgroundColor: '#DDEEF8', borderRadius: 10, paddingVertical: 7 }, skillName: { color: colors.muted, fontSize: 7, fontWeight: '900' }, skillValue: { color: colors.goldDark, fontSize: 16, fontWeight: '900' }, active: { marginTop: 10, borderColor: colors.goldDark }, activeLabel: { color: colors.goldDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, courseTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginVertical: 8 }, meta: { color: colors.muted, fontSize: 9, marginTop: 5 }, progressGrid: { flexDirection: 'row', gap: 6, marginTop: 9 }, progressCell: { flex: 1, alignItems: 'center', borderRadius: 9, backgroundColor: '#E6F1F5', paddingVertical: 7 }, progressValue: { color: colors.text, fontSize: 14, fontWeight: '900' }, progressLabel: { color: colors.muted, fontSize: 7, fontWeight: '900' }, buttonRow: { flexDirection: 'row', gap: 7, marginTop: 9 }, flex: { flex: 1 }, studyFeedback: { color: colors.greenDark, fontSize: 10, fontWeight: '800', marginTop: 8, textAlign: 'center' }, section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 21, marginBottom: 8 }, course: { marginBottom: 9 }, courseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, courseEmoji: { width: 48, fontSize: 34 }, courseName: { color: colors.text, fontSize: 16, fontWeight: '900' }, cost: { color: colors.goldDark, fontSize: 10, fontWeight: '900' }, duration: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 3 }, needs: { color: colors.muted, fontSize: 8, marginTop: 4 }, budgetWarning: { color: colors.danger, fontSize: 8, fontWeight: '800', lineHeight: 12, marginTop: 5 },
});
