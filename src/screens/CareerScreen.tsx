import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { COURSES, type SkillName } from '../data/courses';
import { JOBS, JOB_SKILL_GROWTH, jobSkillGrowthLabel } from '../data/jobs';
import { FOOD_PLANS, housingById, vehicleById } from '../data/living';
import { formatBig } from '../game/BigNumber';
import { courseProgress, STUDY_SESSION_ENERGY, STUDY_SESSION_HOURS } from '../game/courseProgress';
import type { Requirement } from '../game/requirements';
import { useRewardedAd } from '../services/ads';
import { useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { ActionDock } from '../components/scene/ActionDock';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { RequirementGate } from '../components/RequirementGate';
import { SceneStage } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';

const SKILL_LABELS: Record<SkillName, string> = { intelligence: '🧠 Intelligence', business: '💼 Business', finance: '📈 Finance', tech: '💻 Tech', charisma: '✨ Charisma' };
const formatDuration = (seconds: number) => seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;

export function CareerScreen() {
  const [section, setSection] = useState<'work' | 'education'>('work');
  const [studyFeedback, setStudyFeedback] = useState<string | null>(null);
  const state = useLifeStore(useShallow((current) => ({
    activeCourse: current.activeCourse,
    completedCourses: current.completedCourses,
    energy: Math.round(current.energy),
    housing: current.housing,
    vehicle: current.vehicle,
    jobId: current.jobId,
    jobExperienceMonths: current.jobExperienceMonths,
    monthLengthSeconds: current.monthLengthSeconds,
    skills: current.skills,
    gameMonth: current.gameMonth,
    monthProgressSeconds: current.monthProgressSeconds,
    fastForwardCourseMonth: current.fastForwardCourseMonth,
    takeCourseExam: current.takeCourseExam,
    takeJob: current.takeJob,
    studyActiveCourse: current.studyActiveCourse,
    startCourse: current.startCourse,
    quitJob: current.quitJob,
  })));
  const { showRewardedAd } = useRewardedAd();
  const active = COURSES.find((course) => course.id === state.activeCourse?.courseId);
  const progress = active && state.activeCourse ? courseProgress(state.activeCourse, active, state.gameMonth) : null;
  const remaining = progress ? Math.max(0, progress.monthsRemaining * state.monthLengthSeconds - state.monthProgressSeconds) : 0;
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
  const speedCourse = async () => {
    const completed = await showRewardedAd('Focused study boost');
    if (completed) state.fastForwardCourseMonth();
  };
  const takeExam = () => {
    const result = state.takeCourseExam();
    Alert.alert(result === 'passed' ? 'Exam passed!' : result === 'failed' ? 'Exam not passed' : 'Not ready', result === 'passed' ? 'Your qualification and skill rewards are now unlocked.' : result === 'failed' ? 'Study again to improve your next attempt.' : 'Complete every required month, reach 100% preparation, and keep at least 8 energy.');
  };
  const interview = (jobId: string) => {
    const hired = state.takeJob(jobId);
    Alert.alert(hired ? 'You got the job!' : 'Interview complete', hired ? 'Your new salary starts immediately.' : 'They chose another candidate. Improve your skills and try again.');
  };
  return (
    <Screen>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location={state.jobId ? 'office' : 'university'} pose={state.activeCourse ? 'talk' : 'idle'} compact />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>BUILD YOUR FUTURE</Text><Text style={styles.title}>{section === 'work' ? 'Work' : 'Education'}</Text>
          <View style={styles.sectionSwitch}>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: section === 'work' }} onPress={() => setSection('work')} style={[styles.sectionSwitchButton, section === 'work' && styles.sectionSwitchActive]}><Text style={[styles.sectionSwitchText, section === 'work' && styles.sectionSwitchTextActive]}>WORK</Text></Pressable>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: section === 'education' }} onPress={() => setSection('education')} style={[styles.sectionSwitchButton, section === 'education' && styles.sectionSwitchActive]}><Text style={[styles.sectionSwitchText, section === 'education' && styles.sectionSwitchTextActive]}>EDUCATION</Text></Pressable>
          </View>
          <View style={styles.skills}>{(Object.keys(SKILL_LABELS) as SkillName[]).map((skill) => <View key={skill} style={styles.skill}><Text style={styles.skillName}>{SKILL_LABELS[skill]}</Text><Text style={styles.skillValue}>{state.skills[skill]}</Text></View>)}</View>
          {section === 'education' && active && state.activeCourse && progress ? <Card style={styles.activeCourse}>
            <Text style={styles.activeLabel}>{progress.readyToGraduate ? 'EXAM READY' : 'STUDYING NOW'}</Text>
            <Text style={styles.courseTitle}>{active.emoji} {active.name}</Text>
            <Text style={styles.tuition}>Tuition: ${formatBig(active.monthlyTuition)}/month · Retake: ${formatBig(active.retakeFee)}</Text>
            <ProgressBar progress={progress.totalProgress / 100} color={progress.readyToGraduate ? colors.green : colors.gold} />
            <Text style={styles.remaining}>{progress.monthsCompleted}/{active.durationMonths} months · {progress.totalProgress.toFixed(1)}% total · {progress.passiveProgress.toFixed(1)}% passive · {progress.activeProgress.toFixed(1)}% active</Text>
            <Text style={styles.remaining}>{progress.monthsRemaining > 0 ? `${formatDuration(remaining)} estimated at 1x` : 'Required duration complete'}</Text>
            <Text style={styles.remaining}>{STUDY_SESSION_HOURS}-hour session · {STUDY_SESSION_ENERGY} energy</Text>
            <View style={styles.buttonRow}><AppButton variant="green" disabled={state.energy < STUDY_SESSION_ENERGY || progress.activeProgress >= 50} onPress={study} style={styles.flexButton}>STUDY · 8 ENERGY</AppButton>{progress.readyToGraduate ? <AppButton onPress={takeExam} style={styles.flexButton}>TAKE EXAM</AppButton> : <AppButton disabled={progress.activeProgress >= 50} onPress={() => void speedCourse()} style={styles.flexButton}>FOCUS BOOST</AppButton>}</View>
            {studyFeedback ? <Text style={styles.studyFeedback}>{studyFeedback}</Text> : null}
          </Card> : null}
          {section === 'education' ? <Text style={styles.section}>COURSES</Text> : null}
          {section === 'education' ? COURSES.map((course) => {
            const completed = state.completedCourses.includes(course.id);
            const requirements: Requirement[] = [
              { kind: 'fee', amount: course.cost, label: 'Enrollment fee' },
              { kind: 'energy', amount: 10 },
              { kind: 'housing', amount: course.living.housingStatus, label: `Housing: ${housingById(state.housing.id).name} now` },
              { kind: 'food', amount: course.living.foodLevel, label: `Food plan: ${FOOD_PLANS[course.living.foodLevel]?.name ?? 'required plan'}` },
              { kind: 'vehicle', amount: course.living.vehicleStatus, label: `Transport status ${course.living.vehicleStatus}+` },
            ];
            if (course.prerequisite) requirements.push({ kind: 'degree', key: course.prerequisite, label: COURSES.find((item) => item.id === course.prerequisite)?.name });
            return <Card key={course.id} style={styles.card}><View style={styles.row}><Text style={styles.emoji}>{course.emoji}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{course.name}</Text><Text style={styles.meta}>${formatBig(course.cost)} enrollment · ${formatBig(course.monthlyTuition)}/mo</Text><Text style={styles.duration}>Difficulty {course.difficulty}/5 · {course.durationMonths} game months · {formatDuration(course.durationSeconds)} at 1x</Text><Text style={styles.rewards}>{Object.entries(course.rewards).map(([key, value]) => `+${value} ${key}`).join(' · ')}</Text></View></View>{completed ? <AppButton disabled onPress={() => undefined} style={styles.button}>✓ COMPLETED</AppButton> : <RequirementGate disabled={!!state.activeCourse} requirements={requirements} label={state.activeCourse ? 'FINISH CURRENT COURSE' : 'CHECK & ENROLL'} onAllowed={() => state.startCourse(course.id)} />}</Card>;
          }) : null}
          {section === 'work' ? <Text style={styles.section}>JOB INTERVIEWS</Text> : null}
          {section === 'work' ? JOBS.map((job) => {
            const current = state.jobId === job.id;
            const monthsInRole = state.jobExperienceMonths[job.id] ?? 0;
            const growth = JOB_SKILL_GROWTH[job.id];
            const cycleProgress = growth ? monthsInRole % growth.intervalMonths : 0;
            const nextMilestone = growth ? (Math.floor(monthsInRole / growth.intervalMonths) + 1) * growth.intervalMonths : null;
            const nextReward = growth ? Object.entries(growth.rewards).map(([skill, amount]) => `+${amount} ${skill.toUpperCase()}`).join(' · ') : null;
            const requirements: Requirement[] = [
              { kind: 'energy', amount: 15, label: 'Interview energy' },
              { kind: 'housing', amount: job.living.housingStatus, label: `Housing status ${job.living.housingStatus}+` },
              { kind: 'food', amount: job.living.foodLevel, label: `Food: ${FOOD_PLANS[job.living.foodLevel]?.name ?? 'required plan'} or better` },
              { kind: 'vehicle', amount: job.living.vehicleStatus, label: `Transport status ${job.living.vehicleStatus}+` },
            ];
            for (const course of job.requiredCourses ?? []) requirements.push({ kind: 'degree', key: course, label: COURSES.find((item) => item.id === course)?.name });
            for (const [key, value] of Object.entries(job.requiredSkills ?? {})) requirements.push({ kind: 'skill', key, amount: value, label: `${key} skill` });
            for (const experience of job.requiredExperience ?? []) requirements.push({ kind: 'experience', key: experience.jobId, amount: experience.months, label: experience.label });
            return <Card key={job.id} style={[styles.card, current && styles.currentJob]}><View style={styles.row}><Text style={styles.emoji}>{job.emoji}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{job.title}</Text><Text style={styles.track}>{job.track.toUpperCase()} · LEVEL {job.rank}</Text><Text style={styles.salary}>Base ${formatBig(job.salaryPerSecond * state.monthLengthSeconds, 2)}/month</Text><Text style={styles.skillGrowth}>Experience growth: {jobSkillGrowthLabel(job.id)}</Text>{current && growth ? <Text style={styles.skillGrowth}>Next skill bonus: {cycleProgress} / {growth.intervalMonths} months · Next at {nextMilestone} months</Text> : null}{current && nextReward ? <Text style={styles.skillGrowth}>Next reward: {nextReward}</Text> : null}<Text style={styles.experience}>{monthsInRole} months in this role · {housingById(state.housing.id).status >= job.living.housingStatus && vehicleById(state.vehicle.id).status >= job.living.vehicleStatus ? 'Lifestyle ready' : 'Lifestyle upgrade needed'}</Text></View></View>{current ? <AppButton variant="danger" onPress={() => state.quitJob()} style={styles.button}>QUIT JOB</AppButton> : <RequirementGate requirements={requirements} label="ATTEND INTERVIEW" onAllowed={() => interview(job.id)} />}</Card>;
          }) : null}
        </View>
      </ScrollView>
      <ActionDock active="career" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 12 }, body: { padding: 14 }, eyebrow: { color: '#2976A8', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 12 },
  sectionSwitch: { flexDirection: 'row', padding: 4, marginBottom: 12, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  sectionSwitchButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  sectionSwitchActive: { backgroundColor: '#FFD95C', borderWidth: 2, borderColor: '#17364C' },
  sectionSwitchText: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  sectionSwitchTextActive: { color: colors.text },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, skill: { width: '31.5%', backgroundColor: colors.surface, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, skillName: { color: colors.muted, fontSize: 8, fontWeight: '800' }, skillValue: { color: colors.goldDark, fontSize: 18, fontWeight: '900', marginTop: 2 },
  activeCourse: { marginTop: 14, borderColor: colors.goldDark }, activeLabel: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, courseTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 8 }, tuition: { color: colors.muted, fontSize: 9, marginBottom: 9 }, remaining: { color: colors.muted, textAlign: 'right', fontSize: 10, marginTop: 4 }, buttonRow: { flexDirection: 'row', gap: 7, marginTop: 9 }, flexButton: { flex: 1, minHeight: 42, paddingHorizontal: 6 }, studyFeedback: { color: colors.greenDark, fontSize: 10, fontWeight: '800', marginTop: 7, textAlign: 'center' },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 24, marginBottom: 9 }, card: { marginBottom: 10 }, currentJob: { borderColor: colors.greenDark }, row: { flexDirection: 'row', alignItems: 'center' }, emoji: { fontSize: 33, width: 48 }, flex: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, track: { color: '#2976A8', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 }, meta: { color: colors.goldDark, fontSize: 10, fontWeight: '800', marginTop: 2 }, duration: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 3 }, rewards: { color: colors.greenDark, fontSize: 10, marginTop: 4 }, salary: { color: colors.greenDark, fontWeight: '900', marginTop: 2 }, skillGrowth: { color: '#2976A8', fontSize: 9, fontWeight: '800', marginTop: 3 }, experience: { color: colors.muted, fontSize: 9, marginTop: 3 }, button: { marginTop: 11, minHeight: 40 },
});
