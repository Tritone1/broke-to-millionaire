import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { compare, formatBig, toNumber, type BigValue } from '../game/BigNumber';
import { GAME_MONTH_SECONDS } from '../game/config';
import { lifeEventById } from '../data/lifeEvents';
import { evaluateRequirements } from '../game/requirements';
import { useRewardedAd } from '../services/ads';
import { useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { AppButton } from './AppButton';
import { requirementSnapshot } from './RequirementGate';
import { SceneStage } from './scene/SceneStage';

function Shell({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent><View style={styles.backdrop}><View style={styles.modal}>{children}</View></View></Modal>;
}

function CountUpMoney({ value, tone = 'positive' }: { value: BigValue; tone?: 'positive' | 'negative' | 'neutral' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = toNumber(value);
    const started = Date.now();
    let frame = 0;
    const update = () => {
      const progress = Math.min(1, (Date.now() - started) / 850);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <Text style={tone === 'negative' ? styles.netNegative : tone === 'neutral' ? styles.netNeutral : styles.netPositive}>{tone === 'negative' ? '-' : tone === 'positive' ? '+' : ''}${formatBig(display, 2)}</Text>;
}

function durationLabel(seconds: number) {
  if (seconds < 60) return `${Math.floor(seconds)} sec`;
  return `${Math.floor(seconds / 60)} min`;
}

function TypewriterText({ value }: { value: string }) {
  const [visibleLength, setVisibleLength] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setVisibleLength((current) => Math.min(value.length, current + 2)), 24);
    return () => clearInterval(timer);
  }, [value]);
  return <Text style={styles.dialogue}>{value.slice(0, visibleLength)}</Text>;
}

function SceneEventModal({ visible }: { visible: boolean }) {
  const activeLifeEvent = useLifeStore((state) => state.activeLifeEvent);
  const resolveLifeEvent = useLifeStore((state) => state.resolveLifeEvent);
  const [outcome, setOutcome] = useState<string | null>(null);
  const choicesIn = useSharedValue(0);
  const shake = useSharedValue(0);
  const event = lifeEventById(activeLifeEvent?.eventId);
  useEffect(() => {
    if (visible) choicesIn.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, [choicesIn, visible]);
  const choicesStyle = useAnimatedStyle(() => ({ opacity: choicesIn.value, transform: [{ translateY: (1 - choicesIn.value) * 38 }, { scale: 0.92 + choicesIn.value * 0.08 }] }));
  const screenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  const device = search ? new URLSearchParams(search).get('device') : null;
  const previewWidth = device === 'small' ? 375 : device === 'large' ? 430 : undefined;
  if (!event) return null;
  const snapshot = requirementSnapshot(useLifeStore.getState());
  const choiceChecks = event.choices.map((choice) => evaluateRequirements(choice.requirements ?? [], snapshot));
  const hasAvailableChoice = choiceChecks.some((results) => results.every((result) => result.met));
  const choose = (index: number) => {
    const choice = event.choices[index];
    if (!choice || outcome) return;
    const badOutcome = (choice.outcome.cashFlat ?? 0) < 0 || (choice.outcome.cashPercent ?? 0) < 0 || (choice.outcome.health ?? 0) < 0;
    if (badOutcome) shake.set(withSequence(withTiming(-9, { duration: 50 }), withTiming(9, { duration: 65 }), withTiming(-6, { duration: 55 }), withTiming(0, { duration: 60 })));
    setOutcome(choice.result);
    setTimeout(() => resolveLifeEvent(index), 1_150);
  };
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <Animated.View style={[styles.eventScreen, previewWidth ? { width: previewWidth } : null, screenStyle]}>
        <View style={styles.eventTop}><Text style={styles.eventTag}>LIFE EVENT</Text><Text style={styles.eventTitle}>{event.title}</Text></View>
        <SceneStage location={event.location} pose={outcome ? 'celebrate' : event.pose} eventNpc />
        <View style={styles.dialoguePanel}>
          <Text style={styles.speaker}>{event.speaker}</Text>
          {outcome ? <Text style={styles.outcome}>{outcome}</Text> : <TypewriterText value={event.dialogue} />}
          <Animated.View style={[styles.choices, choicesStyle]}>{event.choices.map((choice, index) => {
            const results = choiceChecks[index] ?? [];
            const available = results.every((result) => result.met);
            const missing = results.filter((result) => !result.met).map((result) => `${result.displayLabel} ${result.current}/${result.target}`).join(' · ');
            return <View key={choice.label} style={styles.choiceWrap}><AppButton variant={index === 0 ? 'gold' : 'green'} disabled={!available || !!outcome} onPress={() => choose(index)}>{choice.label}</AppButton>{!available ? <Text style={styles.missing}>{missing}</Text> : <Text style={styles.resultHint}>{choice.tone.toUpperCase()} CHOICE</Text>}</View>;
          })}{!hasAvailableChoice ? <AppButton variant="ghost" onPress={() => resolveLifeEvent(-1)}>WALK AWAY</AppButton> : null}</Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

export function LifeModals() {
  const state = useLifeStore(useShallow((current) => ({
    offlineSummary: current.offlineSummary,
    monthlySummary: current.monthlySummary,
    activeLifeEvent: current.activeLifeEvent,
    age: current.age,
    promotionLevel: current.promotionLevel,
    claimOffline: current.claimOffline,
    dismissMonthlySummary: current.dismissMonthlySummary,
  })));
  const { showRewardedAd, showInterstitialIfEligible } = useRewardedAd();
  const summary = state.offlineSummary;
  const hasOffline = !!summary && summary.countedSeconds >= 5;
  const hasPositiveNet = !!summary && compare(summary.netPositive, 0) > 0;
  const hasCashLoss = !!summary && compare(summary.cashLoss, 0) > 0;
  const monthly = state.monthlySummary;
  const doubleOffline = async () => {
    const completed = await showRewardedAd('Double offline earnings');
    if (completed) state.claimOffline(2);
  };
  const continueAfterMonth = () => {
    state.dismissMonthlySummary();
    void showInterstitialIfEligible();
  };
  return (
    <>
      <Shell visible={hasOffline}>
        <Text style={styles.icon}>🌙</Text>
        <Text style={styles.title}>Welcome back</Text>
        {summary ? <>
          <Text style={styles.body}>You were away {durationLabel(summary.actualSeconds)}. Income counted for {durationLabel(summary.countedSeconds)}.</Text>
          <View style={styles.breakdown}>
            <View style={styles.row}><Text style={styles.rowLabel}>Job salary</Text><Text style={styles.income}>+${formatBig(summary.salaryIncome, 2)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Businesses</Text><Text style={styles.income}>+${formatBig(summary.businessIncome, 2)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Partner income</Text><Text style={styles.income}>+${formatBig(summary.partnerIncome, 2)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Passive bonuses</Text><Text style={styles.income}>+${formatBig(summary.passiveBonusIncome, 2)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Dividends</Text><Text style={styles.income}>+${formatBig(summary.dividendIncome, 2)}</Text></View>
            <View style={styles.divider} />
            <View style={styles.row}><Text style={styles.rowTotal}>Income earned</Text><Text style={styles.income}>+${formatBig(summary.totalIncome, 2)}</Text></View>
            <View style={styles.row}><Text style={styles.rowTotal}>Expenses paid</Text><Text style={styles.expense}>-${formatBig(summary.expensesPaid, 2)}</Text></View>
          </View>
          <Text style={styles.netLabel}>NET RESULT · {summary.monthsAdvanced} MONTHS PROCESSED</Text>
          {hasPositiveNet ? <CountUpMoney value={summary.netPositive} /> : hasCashLoss ? <CountUpMoney value={summary.cashLoss} tone="negative" /> : <CountUpMoney value={summary.netPositive} tone="neutral" />}
        </> : null}
        <AppButton disabled={!hasPositiveNet} onPress={() => void doubleOffline()} style={styles.full}>▶ CLAIM NET ×2</AppButton>
        <Pressable onPress={() => state.claimOffline(1)} style={styles.link}><Text style={styles.linkText}>{hasPositiveNet ? 'Claim normally' : 'Continue'}</Text></Pressable>
        <Text style={styles.note}>Offline progress stops after one game month ({GAME_MONTH_SECONDS} seconds).</Text>
      </Shell>
      <Shell visible={!!monthly && !hasOffline}>
        <Text style={styles.icon}>{monthly?.birthday ? '🎂' : '📅'}</Text>
        <Text style={styles.event}>{monthly?.birthday ? 'HAPPY BIRTHDAY' : monthly?.promotion ? 'PROMOTION!' : 'MONTH COMPLETE'}</Text>
        <Text style={styles.title}>{monthly?.birthday ? `You are now ${state.age}` : monthly?.promotion ? `Career level ${state.promotionLevel + 1}` : `Month ${monthly?.month}`}</Text>
        <View style={styles.breakdown}>
          <View style={styles.row}><Text style={styles.rowTotal}>Income</Text><Text style={styles.income}>+${formatBig(monthly?.income ?? 0, 2)}</Text></View>
          {(monthly?.lines ?? []).map((line) => <View key={line.id} style={styles.row}><Text style={styles.rowLabel}>{line.label}</Text><Text style={styles.expense}>-${formatBig(line.amount, 2)}</Text></View>)}
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.rowTotal}>Monthly result</Text><Text style={(monthly?.net ?? 0) >= 0 ? styles.income : styles.expense}>{(monthly?.net ?? 0) >= 0 ? '+' : '-'}${formatBig(Math.abs(monthly?.net ?? 0), 2)}</Text></View>
          {(monthly?.unpaid ?? 0) > 0 ? <View style={styles.row}><Text style={styles.rowTotal}>Carried to late fees</Text><Text style={styles.expense}>${formatBig(monthly?.unpaid ?? 0, 2)}</Text></View> : null}
        </View>
        <AppButton onPress={continueAfterMonth} style={styles.full}>CONTINUE LIFE</AppButton>
      </Shell>
      <SceneEventModal key={state.activeLifeEvent?.id ?? 'no-event'} visible={!!state.activeLifeEvent && !hasOffline && !monthly} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 410, maxHeight: '92%', padding: 22, borderRadius: 25, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goldDark, alignItems: 'center' },
  icon: { fontSize: 45 },
  event: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 8 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 3 },
  body: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  breakdown: { alignSelf: 'stretch', backgroundColor: colors.surface2, borderRadius: 14, padding: 12, marginTop: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { color: colors.muted, fontSize: 10 },
  rowTotal: { color: colors.text, fontSize: 11, fontWeight: '900' },
  income: { color: colors.green, fontSize: 10, fontWeight: '800' },
  expense: { color: colors.danger, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  netLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  netPositive: { color: colors.green, fontSize: 31, fontWeight: '900', marginTop: 2 },
  netNegative: { color: colors.danger, fontSize: 31, fontWeight: '900', marginTop: 2 },
  netNeutral: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 2 },
  full: { alignSelf: 'stretch', marginTop: 13 },
  secondary: { alignSelf: 'stretch', marginTop: 9 },
  link: { padding: 10 },
  linkText: { color: colors.muted, textDecorationLine: 'underline', fontWeight: '700' },
  note: { color: colors.muted, fontSize: 9, textAlign: 'center' },
  eventScreen: { flex: 1, backgroundColor: colors.background, paddingTop: 46 },
  eventTop: { backgroundColor: '#173D5B', paddingHorizontal: 18, paddingVertical: 11, borderBottomWidth: 3, borderBottomColor: '#F5BF3F' },
  eventTag: { color: '#F8D75B', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  eventTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginTop: 2 },
  dialoguePanel: { flex: 1, marginTop: -12, marginHorizontal: 12, marginBottom: 12, padding: 16, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#276C9E', shadowColor: '#10283A', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  speaker: { alignSelf: 'flex-start', color: '#FFFFFF', backgroundColor: '#2E78AE', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  dialogue: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 23, minHeight: 72, marginTop: 12 },
  outcome: { color: colors.greenDark, fontSize: 17, fontWeight: '900', lineHeight: 23, minHeight: 72, marginTop: 12, textAlign: 'center' },
  choices: { marginTop: 'auto', gap: 8 },
  choiceWrap: { gap: 3 },
  missing: { color: colors.danger, fontSize: 8, textAlign: 'center', fontWeight: '800' },
  resultHint: { color: colors.muted, fontSize: 7, textAlign: 'center', fontWeight: '900', letterSpacing: 1 },
});
