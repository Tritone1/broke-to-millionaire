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
import { formatBig } from '../game/BigNumber';
import type { Requirement } from '../game/requirements';
import { useRewardedAd } from '../services/ads';
import { useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';

const SKILLS: Record<SkillName, string> = { intelligence: '🧠 INT', business: '💼 BIZ', finance: '📈 FIN', tech: '💻 TECH', charisma: '✨ CHAR' };
const HOUSING_NAMES: Record<number, string> = { 0: 'Homeless', 2: 'Shared room', 6: 'Studio', 14: 'Apartment', 24: 'House', 48: 'Villa', 80: 'Mansion', 100: 'Penthouse' };
const VEHICLE_NAMES: Record<number, string> = { 0: 'Walking', 2: 'Public transport', 5: 'Used car', 12: 'Economy car', 22: 'SUV', 48: 'Sports car', 68: 'Luxury car', 92: 'Supercar', 100: 'Private jet' };

export function StudyScreen() {
  const state = useLifeStore();
  const navigation = useNavigation();
  const { showRewardedAd } = useRewardedAd();
  const active = COURSES.find((course) => course.id === state.activeCourse?.courseId);
  const remaining = state.activeCourse ? Math.max(0, Math.ceil((state.activeCourse.endsAt - state.runtimeNow) / 1_000)) : 0;
  const exam = () => {
    const result = state.takeCourseExam();
    Alert.alert(result === 'passed' ? 'Exam passed!' : result === 'failed' ? 'Exam not passed' : 'Not ready', result === 'passed' ? 'Your qualification is unlocked.' : result === 'failed' ? 'Study more before your retake.' : 'Finish studying and keep at least 8 energy.');
  };
  const openLiving = () => navigation.dispatch(CommonActions.navigate('Living'));
  return (
    <Screen>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="university" pose={active ? 'talk' : 'idle'} compact />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>EDUCATION CENTER</Text><Text style={styles.title}>Study</Text>
          <View style={styles.lifeRow}><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🏠</Text><Text style={styles.lifeValue}>{housingById(state.housing.id).name}</Text></View><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🍽️</Text><Text style={styles.lifeValue}>{FOOD_PLANS.find((plan) => plan.id === state.foodPlanId)?.name ?? 'Food'}</Text></View><View style={styles.lifeBadge}><Text style={styles.lifeIcon}>🚗</Text><Text style={styles.lifeValue}>{vehicleById(state.vehicle.id).name}</Text></View></View>
          <View style={styles.skills}>{(Object.keys(SKILLS) as SkillName[]).map((skill) => <View key={skill} style={styles.skill}><Text style={styles.skillName}>{SKILLS[skill]}</Text><Text style={styles.skillValue}>{state.skills[skill]}</Text></View>)}</View>
          {active && state.activeCourse ? <Card style={styles.active}><Text style={styles.activeLabel}>{state.activeCourse.examReady ? 'EXAM READY' : 'STUDY IN PROGRESS'}</Text><Text style={styles.courseTitle}>{active.emoji} {active.name}</Text><ProgressBar progress={state.activeCourse.examReady ? state.activeCourse.studyProgress / 100 : 1 - remaining / active.durationSeconds} /><Text style={styles.meta}>{state.activeCourse.examReady ? `${Math.round(state.activeCourse.studyProgress)}% prepared` : `${remaining} seconds remaining`} · ${active.monthlyTuition}/month tuition</Text><View style={styles.buttonRow}><AppButton variant="green" disabled={state.energy < 8} onPress={() => state.studyActiveCourse()} style={styles.flex}>STUDY</AppButton>{state.activeCourse.examReady ? <AppButton onPress={exam} style={styles.flex}>TAKE EXAM</AppButton> : <AppButton onPress={async () => { if (await showRewardedAd('Finish study stage')) state.finishCourseNow(); }} style={styles.flex}>FINISH TIMER</AppButton>}</View></Card> : null}
          <Text style={styles.section}>COURSES</Text>
          {COURSES.map((course) => {
            const completed = state.completedCourses.includes(course.id);
            const requirements: Requirement[] = [
              { kind: 'fee', amount: course.cost, label: 'Enrollment cash' }, { kind: 'monthlyFee', amount: course.monthlyTuition, label: 'Monthly surplus for tuition' }, { kind: 'energy', amount: 10 },
              { kind: 'housing', amount: course.living.housingStatus, label: `Housing: ${HOUSING_NAMES[course.living.housingStatus]} or better` },
              { kind: 'food', amount: course.living.foodLevel, label: `Food: ${FOOD_PLANS[course.living.foodLevel]?.name ?? 'Required plan'} or better` },
              { kind: 'vehicle', amount: course.living.vehicleStatus, label: `Transport: ${VEHICLE_NAMES[course.living.vehicleStatus]} or better` },
            ];
            if (course.prerequisite) requirements.push({ kind: 'degree', key: course.prerequisite, label: COURSES.find((item) => item.id === course.prerequisite)?.name });
            return <Card key={course.id} style={styles.course}><View style={styles.courseRow}><Text style={styles.courseEmoji}>{course.emoji}</Text><View style={styles.flex}><Text style={styles.courseName}>{course.name}</Text><Text style={styles.cost}>${formatBig(course.cost)} entry · ${formatBig(course.monthlyTuition)}/month</Text><Text style={styles.duration}>Difficulty {course.difficulty}/5 · {course.durationMonths} game months at 1x</Text><Text style={styles.needs}>🏠 {HOUSING_NAMES[course.living.housingStatus]} · 🍽️ {FOOD_PLANS[course.living.foodLevel]?.name ?? 'Food plan'} · 🚗 {VEHICLE_NAMES[course.living.vehicleStatus]}</Text></View></View>{completed ? <AppButton disabled onPress={() => undefined}>✓ COMPLETED</AppButton> : <RequirementGate disabled={!!state.activeCourse} requirements={requirements} label={state.activeCourse ? 'FINISH CURRENT COURSE' : 'CHECK REQUIREMENTS'} onAllowed={() => state.startCourse(course.id)} onHow={openLiving} />}</Card>;
          })}
        </View>
      </ScrollView>
      <ActionDock active="career" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 10 }, body: { padding: 14 }, eyebrow: { color: '#2677AD', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, title: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 10 }, lifeRow: { flexDirection: 'row', gap: 6 }, lifeBadge: { flex: 1, minHeight: 65, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 5 }, lifeIcon: { fontSize: 20 }, lifeValue: { color: colors.text, fontSize: 8, fontWeight: '900', textAlign: 'center', marginTop: 3 }, skills: { flexDirection: 'row', gap: 5, marginTop: 8 }, skill: { flex: 1, alignItems: 'center', backgroundColor: '#DDEEF8', borderRadius: 10, paddingVertical: 7 }, skillName: { color: colors.muted, fontSize: 7, fontWeight: '900' }, skillValue: { color: colors.goldDark, fontSize: 16, fontWeight: '900' }, active: { marginTop: 10, borderColor: colors.goldDark }, activeLabel: { color: colors.goldDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, courseTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginVertical: 8 }, meta: { color: colors.muted, fontSize: 9, marginTop: 5 }, buttonRow: { flexDirection: 'row', gap: 7, marginTop: 9 }, flex: { flex: 1 }, section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 21, marginBottom: 8 }, course: { marginBottom: 9 }, courseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, courseEmoji: { width: 48, fontSize: 34 }, courseName: { color: colors.text, fontSize: 16, fontWeight: '900' }, cost: { color: colors.goldDark, fontSize: 10, fontWeight: '900' }, duration: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 3 }, needs: { color: colors.muted, fontSize: 8, marginTop: 4 },
});
