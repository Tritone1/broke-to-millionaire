import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { COURSES, type SkillName } from '../data/courses';
import { JOBS, jobSkillGrowthLabel } from '../data/jobs';
import { FOOD_PLANS, housingById, vehicleById } from '../data/living';
import { formatBig } from '../game/BigNumber';
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
    runtimeNow: current.activeCourse ? Math.floor(current.runtimeNow / 1_000) * 1_000 : 0,
    finishCourseNow: current.finishCourseNow,
    takeCourseExam: current.takeCourseExam,
    takeJob: current.takeJob,
    studyActiveCourse: current.studyActiveCourse,
    startCourse: current.startCourse,
    quitJob: current.quitJob,
  })));
  const { showRewardedAd } = useRewardedAd();
  const active = COURSES.find((course) => course.id === state.activeCourse?.courseId);
  const remaining = state.activeCourse ? Math.max(0, Math.ceil((state.activeCourse.endsAt - state.runtimeNow) / 1_000)) : 0;
  const speedCourse = async () => {
    const completed = await showRewardedAd('Finish study stage');
    if (completed) state.finishCourseNow();
  };
  const takeExam = () => {
    const result = state.takeCourseExam();
    Alert.alert(result === 'passed' ? 'Exam passed!' : result === 'failed' ? 'Exam not passed' : 'Not ready', result === 'passed' ? 'Your qualification and skill rewards are now unlocked.' : result === 'failed' ? 'Study again to improve your next attempt.' : 'Finish the timer, study to 40%, and keep at least 8 energy.');
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
          <Text style={styles.eyebrow}>BUILD YOUR FUTURE</Text><Text style={styles.title}>Study & Career</Text>
          <View style={styles.skills}>{(Object.keys(SKILL_LABELS) as SkillName[]).map((skill) => <View key={skill} style={styles.skill}><Text style={styles.skillName}>{SKILL_LABELS[skill]}</Text><Text style={styles.skillValue}>{state.skills[skill]}</Text></View>)}</View>
          {active && state.activeCourse ? <Card style={styles.activeCourse}>
            <Text style={styles.activeLabel}>{state.activeCourse.examReady ? 'EXAM READY' : 'STUDYING NOW'}</Text>
            <Text style={styles.courseTitle}>{active.emoji} {active.name}</Text>
            <Text style={styles.tuition}>Tuition: ${formatBig(active.monthlyTuition)}/month · Retake: ${formatBig(active.retakeFee)}</Text>
            <ProgressBar progress={state.activeCourse.examReady ? state.activeCourse.studyProgress / 100 : 1 - remaining / active.durationSeconds} color={state.activeCourse.examReady ? colors.green : colors.gold} />
            <Text style={styles.remaining}>{state.activeCourse.examReady ? `${Math.round(state.activeCourse.studyProgress)}% prepared · ${state.activeCourse.examAttempts} attempts` : `${formatDuration(remaining)} remaining`}</Text>
            <View style={styles.buttonRow}><AppButton variant="green" disabled={state.energy < 8} onPress={() => state.studyActiveCourse()} style={styles.flexButton}>STUDY · 8 ENERGY</AppButton>{state.activeCourse.examReady ? <AppButton onPress={takeExam} style={styles.flexButton}>TAKE EXAM</AppButton> : <AppButton onPress={() => void speedCourse()} style={styles.flexButton}>▶ FINISH TIMER</AppButton>}</View>
          </Card> : null}
          <Text style={styles.section}>EDUCATION</Text>
          {COURSES.map((course) => {
            const completed = state.completedCourses.includes(course.id);
            const requirements: Requirement[] = [
              { kind: 'fee', amount: course.cost, label: 'Enrollment fee' },
              { kind: 'monthlyFee', amount: course.monthlyTuition, label: 'Monthly surplus for tuition' },
              { kind: 'energy', amount: 10 },
              { kind: 'housing', amount: course.living.housingStatus, label: `Housing: ${housingById(state.housing.id).name} now` },
              { kind: 'food', amount: course.living.foodLevel, label: `Food plan: ${FOOD_PLANS[course.living.foodLevel]?.name ?? 'required plan'}` },
              { kind: 'vehicle', amount: course.living.vehicleStatus, label: `Transport status ${course.living.vehicleStatus}+` },
            ];
            if (course.prerequisite) requirements.push({ kind: 'degree', key: course.prerequisite, label: COURSES.find((item) => item.id === course.prerequisite)?.name });
            return <Card key={course.id} style={styles.card}><View style={styles.row}><Text style={styles.emoji}>{course.emoji}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{course.name}</Text><Text style={styles.meta}>${formatBig(course.cost)} enrollment · ${formatBig(course.monthlyTuition)}/mo</Text><Text style={styles.duration}>Difficulty {course.difficulty}/5 · {course.durationMonths} game months · {formatDuration(course.durationSeconds)} at 1x</Text><Text style={styles.rewards}>{Object.entries(course.rewards).map(([key, value]) => `+${value} ${key}`).join(' · ')}</Text></View></View>{completed ? <AppButton disabled onPress={() => undefined} style={styles.button}>✓ COMPLETED</AppButton> : <RequirementGate disabled={!!state.activeCourse} requirements={requirements} label={state.activeCourse ? 'FINISH CURRENT COURSE' : 'CHECK & ENROLL'} onAllowed={() => state.startCourse(course.id)} />}</Card>;
          })}
          <Text style={styles.section}>JOB INTERVIEWS</Text>
          {JOBS.map((job) => {
            const current = state.jobId === job.id;
            const requirements: Requirement[] = [
              { kind: 'energy', amount: 15, label: 'Interview energy' },
              { kind: 'housing', amount: job.living.housingStatus, label: `Housing status ${job.living.housingStatus}+` },
              { kind: 'food', amount: job.living.foodLevel, label: `Food: ${FOOD_PLANS[job.living.foodLevel]?.name ?? 'required plan'} or better` },
              { kind: 'vehicle', amount: job.living.vehicleStatus, label: `Transport status ${job.living.vehicleStatus}+` },
            ];
            for (const course of job.requiredCourses ?? []) requirements.push({ kind: 'degree', key: course, label: COURSES.find((item) => item.id === course)?.name });
            for (const [key, value] of Object.entries(job.requiredSkills ?? {})) requirements.push({ kind: 'skill', key, amount: value, label: `${key} skill` });
            for (const experience of job.requiredExperience ?? []) requirements.push({ kind: 'experience', key: experience.jobId, amount: experience.months, label: experience.label });
            return <Card key={job.id} style={[styles.card, current && styles.currentJob]}><View style={styles.row}><Text style={styles.emoji}>{job.emoji}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{job.title}</Text><Text style={styles.track}>{job.track.toUpperCase()} · LEVEL {job.rank}</Text><Text style={styles.salary}>Base ${formatBig(job.salaryPerSecond * state.monthLengthSeconds, 2)}/month</Text><Text style={styles.skillGrowth}>Experience growth: {jobSkillGrowthLabel(job.id)}</Text><Text style={styles.experience}>{state.jobExperienceMonths[job.id] ?? 0} months in this role · {housingById(state.housing.id).status >= job.living.housingStatus && vehicleById(state.vehicle.id).status >= job.living.vehicleStatus ? 'Lifestyle ready' : 'Lifestyle upgrade needed'}</Text></View></View>{current ? <AppButton variant="danger" onPress={() => state.quitJob()} style={styles.button}>QUIT JOB</AppButton> : <RequirementGate requirements={requirements} label="ATTEND INTERVIEW" onAllowed={() => interview(job.id)} />}</Card>;
          })}
        </View>
      </ScrollView>
      <ActionDock active="career" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 12 }, body: { padding: 14 }, eyebrow: { color: '#2976A8', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 12 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, skill: { width: '31.5%', backgroundColor: colors.surface, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, skillName: { color: colors.muted, fontSize: 8, fontWeight: '800' }, skillValue: { color: colors.goldDark, fontSize: 18, fontWeight: '900', marginTop: 2 },
  activeCourse: { marginTop: 14, borderColor: colors.goldDark }, activeLabel: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, courseTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 8 }, tuition: { color: colors.muted, fontSize: 9, marginBottom: 9 }, remaining: { color: colors.muted, textAlign: 'right', fontSize: 10, marginTop: 4 }, buttonRow: { flexDirection: 'row', gap: 7, marginTop: 9 }, flexButton: { flex: 1, minHeight: 42, paddingHorizontal: 6 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 24, marginBottom: 9 }, card: { marginBottom: 10 }, currentJob: { borderColor: colors.greenDark }, row: { flexDirection: 'row', alignItems: 'center' }, emoji: { fontSize: 33, width: 48 }, flex: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, track: { color: '#2976A8', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 }, meta: { color: colors.goldDark, fontSize: 10, fontWeight: '800', marginTop: 2 }, duration: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 3 }, rewards: { color: colors.greenDark, fontSize: 10, marginTop: 4 }, salary: { color: colors.greenDark, fontWeight: '900', marginTop: 2 }, skillGrowth: { color: '#2976A8', fontSize: 9, fontWeight: '800', marginTop: 3 }, experience: { color: colors.muted, fontSize: 9, marginTop: 3 }, button: { marginTop: 11, minHeight: 40 },
});
