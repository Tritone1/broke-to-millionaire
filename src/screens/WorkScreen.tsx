import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { LifeHeader } from '../components/LifeHeader';
import { RequirementGate } from '../components/RequirementGate';
import { ActionDock } from '../components/scene/ActionDock';
import { SceneStage } from '../components/scene/SceneStage';
import { COURSES } from '../data/courses';
import { JOBS, JOB_SKILL_GROWTH, jobById, jobSkillGrowthLabel } from '../data/jobs';
import { FOOD_PLANS } from '../data/living';
import { formatBig } from '../game/BigNumber';
import { MAX_PROMOTION_LEVEL } from '../game/config';
import type { Requirement } from '../game/requirements';
import { jobSalaryPerSecond, useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { Screen } from '../components/Screen';

export function WorkScreen() {
  const state = useLifeStore();
  const currentJob = jobById(state.jobId);
  const currentExperience = state.jobId ? state.jobExperienceMonths[state.jobId] ?? 0 : 0;
  const currentGrowth = state.jobId ? JOB_SKILL_GROWTH[state.jobId] : undefined;
  const nextMilestone = currentGrowth
    ? (Math.floor(currentExperience / currentGrowth.intervalMonths) + 1) * currentGrowth.intervalMonths
    : null;
  const monthsIntoCycle = currentGrowth ? currentExperience % currentGrowth.intervalMonths : 0;
  const nextRewardLabel = currentGrowth
    ? (Object.entries(currentGrowth.rewards).map(([skill, amount]) => `+${amount} ${skill.toUpperCase()}`).join(' · '))
    : null;
  const shiftBonus = currentJob
    ? currentJob.hardWorkBonus * (1 + state.promotionLevel * 0.2)
    : 0;
  const nextPromotionMonths = (state.promotionLevel + 1) * 3;
  const interview = (jobId: string) => {
    const hired = state.takeJob(jobId);
    Alert.alert(hired ? 'You got the job!' : 'Interview complete', hired ? 'Your salary is added to the paycheck and paid at the end of the month.' : 'Check your home, food, transport, qualifications, and skills before trying again.');
  };
  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="office" pose={currentJob ? 'talk' : 'idle'} compact />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>CAREER CENTER</Text><Text style={styles.title}>Work</Text>
          <Card style={styles.payday}><View style={styles.payRow}><View><Text style={styles.payLabel}>CURRENT PAYCHECK</Text><Text style={styles.payValue}>${formatBig(state.accruedMonthlyIncome, 2)}</Text></View><View style={styles.payRight}><Text style={styles.payLabel}>PAYDAY IN</Text><Text style={styles.payTime}>{Math.max(0, Math.ceil(state.monthLengthSeconds - state.monthProgressSeconds))} sec</Text></View></View><Text style={styles.payNote}>Salary and work bonuses are paid together once per game month.</Text></Card>
          {currentJob ? <Card style={styles.current}><View style={styles.row}><Text style={styles.emoji}>{currentJob.emoji}</Text><View style={styles.flex}><Text style={styles.smallLabel}>YOUR JOB</Text><Text style={styles.jobTitle}>{currentJob.title}</Text><Text style={styles.salary}>${formatBig(jobSalaryPerSecond(state) * state.monthLengthSeconds, 2)} monthly salary</Text><Text style={styles.skillGrowth}>Skill growth: {jobSkillGrowthLabel(currentJob.id)}</Text>{currentGrowth ? <Text style={styles.skillGrowth}>Next skill bonus: {monthsIntoCycle} / {currentGrowth.intervalMonths} working months · Next at {nextMilestone} months</Text> : null}{nextRewardLabel ? <Text style={styles.skillGrowth}>Next reward: {nextRewardLabel}</Text> : null}</View></View><View style={styles.performance}><View style={[styles.performanceFill, { width: `${state.performance}%` }]} /></View><Text style={styles.promotion}>{state.promotionLevel >= MAX_PROMOTION_LEVEL ? 'MAXIMUM PROMOTION LEVEL' : `Promotion needs 100 performance and ${nextPromotionMonths} months experience · ${Math.round(state.performance)}/100 · ${currentExperience}/${nextPromotionMonths} months`}</Text><AppButton disabled={state.energy < 5 || state.stress >= 98} onPress={() => state.workHard()} style={styles.action}><View style={styles.shiftContent}><Text style={styles.shiftTitle}>WORK SHIFT</Text><Text style={styles.shiftMeta}>5 energy · +${formatBig(shiftBonus, 0)} to next paycheck</Text></View></AppButton><AppButton variant="danger" onPress={() => state.quitJob()} style={styles.quit}>QUIT JOB</AppButton></Card> : <Card><Text style={styles.emptyTitle}>You are unemployed</Text><Text style={styles.note}>Choose an entry-level job or meet the checklist for a better career.</Text></Card>}
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
            return <Card key={job.id} style={[styles.jobCard, current && styles.current]}><View style={styles.row}><Text style={styles.emoji}>{job.emoji}</Text><View style={styles.flex}><Text style={styles.jobTitle}>{job.title}</Text><Text style={styles.salary}>${formatBig(job.salaryPerSecond * state.monthLengthSeconds, 2)}/month</Text><Text style={styles.skillGrowth}>{jobSkillGrowthLabel(job.id)}</Text><Text style={styles.experience}>{state.jobExperienceMonths[job.id] ?? 0} months experience</Text></View></View>{current ? <Text style={styles.employed}>CURRENT JOB</Text> : <RequirementGate requirements={requirements} label="ATTEND INTERVIEW" onAllowed={() => interview(job.id)} />}</Card>;
          })}
        </View>
      </ScrollView>
      <ActionDock active="career" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 10 }, body: { padding: 14 }, eyebrow: { color: '#2677AD', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, title: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 10 }, payday: { backgroundColor: '#E8F7E8', borderColor: '#61A36B', marginBottom: 10 }, payRow: { flexDirection: 'row', justifyContent: 'space-between' }, payLabel: { color: '#52705A', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, payValue: { color: colors.greenDark, fontSize: 24, fontWeight: '900' }, payRight: { alignItems: 'flex-end' }, payTime: { color: colors.text, fontSize: 16, fontWeight: '900' }, payNote: { color: colors.muted, fontSize: 9, marginTop: 6 }, current: { borderColor: colors.greenDark }, row: { flexDirection: 'row', alignItems: 'center' }, emoji: { width: 50, fontSize: 35 }, flex: { flex: 1 }, smallLabel: { color: colors.muted, fontSize: 8, fontWeight: '900' }, jobTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, salary: { color: colors.greenDark, fontSize: 11, fontWeight: '900', marginTop: 2 }, skillGrowth: { color: '#2677AD', fontSize: 9, fontWeight: '800', marginTop: 3 }, experience: { color: colors.muted, fontSize: 9, marginTop: 3 }, performance: { height: 8, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.surface2, marginTop: 12 }, performanceFill: { height: '100%', backgroundColor: colors.goldDark }, promotion: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 5 }, action: { marginTop: 9 }, quit: { marginTop: 6, minHeight: 38 }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 21, marginBottom: 8 }, jobCard: { marginBottom: 9 }, employed: { color: colors.greenDark, fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  shiftContent: { alignItems: 'center' },
  shiftTitle: { color: colors.black, fontSize: 14, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', letterSpacing: 0.4 },
  shiftMeta: { color: colors.black, fontSize: 9, fontWeight: '800', marginTop: 1 },
});
