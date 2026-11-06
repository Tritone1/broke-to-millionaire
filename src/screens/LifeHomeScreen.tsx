import { useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { LifeHeader } from '../components/LifeHeader';
import { ActionDock } from '../components/scene/ActionDock';
import { SceneStage, type SceneAction } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';
import { jobById } from '../data/jobs';
import { useLifeStore } from '../store/lifeStore';

function GoalChip() {
  const [open, setOpen] = useState(false);
  const tutorialStep = useLifeStore((state) => state.tutorialStep);
  const goal = tutorialStep === 0
    ? { title: 'Apply for your first job', detail: 'Open Career and attend the Delivery Courier interview. No home or car is required.' }
    : tutorialStep === 1
      ? { title: 'Land your first job', detail: 'Open Career and interview for Delivery Courier. No home or car is required.' }
      : tutorialStep === 2
        ? { title: 'Improve your basic needs', detail: 'Rent a shared room and select budget groceries, then enroll in High School.' }
        : { title: 'Earn your next promotion', detail: 'Keep monthly bills below income and build 3 months of experience.' };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Show next goal" onPress={() => setOpen((value) => !value)} style={[styles.goal, open && styles.goalOpen]}>
      <Text style={styles.goalStar}>★</Text>
      <View style={styles.goalCopy}><Text numberOfLines={1} style={styles.goalLabel}>NEXT GOAL · {goal.title}</Text>{open ? <Text style={styles.goalDetail}>{goal.detail}</Text> : null}</View>
      <Text style={styles.goalArrow}>{open ? '▲' : '▼'}</Text>
    </Pressable>
  );
}

export function LifeHomeScreen() {
  const [floatReward, setFloatReward] = useState(0);
  const navigation = useNavigation();
  const jobId = useLifeStore((state) => state.jobId);
  const health = useLifeStore((state) => state.health);
  const energy = useLifeStore((state) => Math.round(state.energy));
  const tutorialStep = useLifeStore((state) => state.tutorialStep);
  const housingId = useLifeStore((state) => state.housing.id);
  const haptics = useLifeStore((state) => state.settings.haptics);
  const workHard = useLifeStore((state) => state.workHard);
  const float = useSharedValue(1);
  const floatStyle = useAnimatedStyle(() => ({ opacity: 1 - float.value, transform: [{ translateY: -42 * float.value }, { scale: 0.9 + float.value * 0.2 }] }));
  const go = (route: 'Work' | 'Study' | 'Living') => navigation.dispatch(CommonActions.navigate(route));
  const work = () => {
    const currentJob = jobById(jobId);
    if (!currentJob) {
      go('Work');
      return;
    }
    if (!workHard()) return;
    setFloatReward(currentJob.hardWorkBonus);
    if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    float.value = 0;
    float.value = withSequence(withSpring(0.05), withTiming(1, { duration: 900 }));
  };
  const pose = health < 30 ? 'hurt' : energy < 15 ? 'sad' : jobId ? 'talk' : 'idle';
  const actions: SceneAction[] = [
    { id: 'desk', icon: '💼', label: jobId ? 'Work shift' : 'Find work', hint: jobId ? 'Add to paycheck' : 'Apply in Career', onPress: work, position: 'left', highlighted: tutorialStep === 0 },
    { id: 'laptop', icon: '🎓', label: 'Study', hint: 'Needs a stable life', onPress: () => go('Study'), position: 'right', highlighted: false },
    { id: 'door', icon: '🚪', label: 'Living', hint: 'Home, food & travel', onPress: () => go('Living'), position: 'door', highlighted: tutorialStep === 2 },
  ];
  return (
    <Screen style={styles.screen}>
      <LifeHeader />
      <GoalChip />
      <View style={styles.sceneWrap}>
        <SceneStage location={housingId === 'homeless' ? 'street' : 'apartment'} pose={pose} hero actions={actions} />
        {floatReward > 0 ? <Animated.Text pointerEvents="none" style={[styles.floatMoney, floatStyle]}>+${floatReward} PAYCHECK</Animated.Text> : null}
        <View pointerEvents="none" style={styles.paydayChip}><Text style={styles.paydayLabel}>{jobId ? jobById(jobId)?.title ?? 'Working' : 'Unemployed'}</Text><Text style={styles.paydayValue}>{jobId ? 'PAYDAY EACH MONTH' : 'APPLY IN CAREER'}</Text></View>
      </View>
      <ActionDock active="home" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#10283A' },
  goal: { minHeight: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#17364C', borderBottomWidth: 2, borderBottomColor: '#071B29' },
  goalOpen: { minHeight: 52 },
  goalStar: { color: '#FFD95C', fontSize: 14 },
  goalCopy: { flex: 1, marginHorizontal: 7 },
  goalLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  goalDetail: { color: '#C9D9E1', fontSize: 8, lineHeight: 11, marginTop: 2 },
  goalArrow: { color: '#91B6C7', fontSize: 8 },
  sceneWrap: { flex: 1, overflow: 'hidden' },
  floatMoney: { position: 'absolute', alignSelf: 'center', top: '43%', color: '#D8FF75', fontSize: 20, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', textShadowColor: '#17364C', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1, zIndex: 30 },
  paydayChip: { position: 'absolute', left: 10, bottom: 9, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: 'rgba(18,44,61,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', zIndex: 9 },
  paydayLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  paydayValue: { color: '#FFD95C', fontSize: 7, fontWeight: '900', marginTop: 1 },
});
