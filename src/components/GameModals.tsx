import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatBig, compare } from '../game/BigNumber';
import { GAME_MONTH_SECONDS } from '../game/config';
import { useRewardedAd } from '../services/ads';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { AppButton } from './AppButton';
import { renderSafeChildren } from './SafeChildren';

function ModalShell({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}><View style={styles.modal}>{renderSafeChildren(children, styles.body)}</View></View>
    </Modal>
  );
}

export function GameModals() {
  const state = useGameStore();
  const { showRewardedAd } = useRewardedAd();
  const [dailyDismissed, setDailyDismissed] = useState(false);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const hasOffline = state.hydrated && state.offlineSeconds >= 5 && compare(state.offlineEarnings, 0) > 0;
  const showDaily = state.hydrated && !hasOffline && !dailyDismissed && state.lastDailyClaim !== todayKey && !state.activeEvent;

  const claimDouble = async () => {
    const completed = await showRewardedAd('Double offline earnings');
    if (completed) state.claimOffline(2);
  };

  const avoidCrash = async () => {
    const completed = await showRewardedAd('Protect cash from market crash');
    if (completed) state.resolveEvent('avoid');
  };

  return (
    <>
      <ModalShell visible={hasOffline}>
        <Text style={styles.icon}>🌙</Text>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.body}>Your empire worked for {Math.floor(state.offlineSeconds / 60)} minutes while you were away.</Text>
        <Text style={styles.reward}>+${formatBig(state.offlineEarnings, 2)}</Text>
        <AppButton onPress={() => void claimDouble()} style={styles.full}>▶ Claim 2×</AppButton>
        <Pressable onPress={() => state.claimOffline(1)} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Claim normally</Text>
        </Pressable>
        <Text style={styles.footnote}>Offline earnings stop after one game month ({GAME_MONTH_SECONDS} seconds).</Text>
      </ModalShell>

      <ModalShell visible={showDaily}>
        <Text style={styles.icon}>🎁</Text>
        <Text style={styles.title}>Daily Reward</Text>
        <Text style={styles.body}>Keep returning to grow your 7-day streak.</Text>
        <View style={styles.calendar}>
          {Array.from({ length: 7 }, (_, index) => {
            const day = index + 1;
            const active = day === (state.dailyStreak % 7) + 1;
            return (
              <View key={day} style={[styles.day, active && styles.activeDay]}>
                <Text style={[styles.dayLabel, active && styles.activeDayLabel]}>D{day}</Text>
                <Text style={styles.dayIcon}>{day === 7 ? '👑' : '💵'}</Text>
                <Text style={styles.dayReward}>${formatBig(500 * 3 ** index)}</Text>
              </View>
            );
          })}
        </View>
        <AppButton onPress={() => { state.claimDaily(); setDailyDismissed(true); }} style={styles.full}>
          Claim day {(state.dailyStreak % 7) + 1}
        </AppButton>
        <Pressable onPress={() => setDailyDismissed(true)} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Later</Text>
        </Pressable>
      </ModalShell>

      <ModalShell visible={Boolean(state.activeEvent)}>
        <Text style={styles.icon}>
          {state.activeEvent?.kind === 'crash' ? '📉' : state.activeEvent?.kind === 'lucky' ? '🍀' : state.activeEvent?.kind === 'tax' ? '🧾' : '🔥'}
        </Text>
        <Text style={styles.eventLabel}>RANDOM EVENT</Text>
        <Text style={styles.title}>{state.activeEvent?.title}</Text>
        <Text style={styles.body}>{state.activeEvent?.description}</Text>
        {state.activeEvent?.kind === 'crash' ? (
          <>
            <AppButton onPress={() => void avoidCrash()} style={styles.full}>▶ Protect with ad</AppButton>
            <AppButton variant="danger" onPress={() => state.resolveEvent('accept')} style={styles.secondary}>Take the -10% hit</AppButton>
          </>
        ) : (
          <AppButton onPress={() => state.resolveEvent('accept')} style={styles.full}>
            {state.activeEvent?.kind === 'lucky' ? 'Collect bonus' : state.activeEvent?.kind === 'viral' ? 'Start 2× boost' : 'Pay audit'}
          </AppButton>
        )}
      </ModalShell>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 410, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goldDark, padding: 22, alignItems: 'center' },
  icon: { fontSize: 52, marginBottom: 8 },
  eventLabel: { color: colors.gold, fontSize: 10, letterSpacing: 1.8, fontWeight: '900', marginBottom: 6 },
  title: { color: colors.text, fontWeight: '900', fontSize: 26, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  reward: { color: colors.green, fontWeight: '900', fontSize: 34, marginVertical: 20 },
  full: { alignSelf: 'stretch', marginTop: 18 },
  secondary: { alignSelf: 'stretch', marginTop: 9 },
  textButton: { padding: 12 },
  textButtonLabel: { color: colors.muted, textDecorationLine: 'underline', fontWeight: '700' },
  footnote: { color: colors.muted, fontSize: 10, marginTop: 2 },
  calendar: { flexDirection: 'row', width: '100%', gap: 4, marginTop: 18 },
  day: { flex: 1, minWidth: 0, alignItems: 'center', borderRadius: 10, backgroundColor: colors.surface2, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  activeDay: { borderColor: colors.gold, backgroundColor: '#332A12' },
  dayLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  activeDayLabel: { color: colors.gold },
  dayIcon: { fontSize: 16, marginVertical: 4 },
  dayReward: { color: colors.text, fontSize: 8, fontWeight: '700' },
});
