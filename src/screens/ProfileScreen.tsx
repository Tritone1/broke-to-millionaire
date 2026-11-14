import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { LIFESTYLE_ITEMS } from '../data/shop';
import { formatBig, toNumber } from '../game/BigNumber';
import { prestigePointsForLifetime } from '../game/formulas';
import { DAILY_MISSION_REWARDS, DAILY_REWARD_AMOUNTS, GAME_MONTH_SECONDS } from '../game/config';
import { useRewardedAd } from '../services/ads';
import { CASH_REWARD_PLACEMENT } from '../services/adRequest';
import { calculateLifeNetWorth, useLifeStore } from '../store/lifeStore';
import { usePurchaseStore } from '../store/purchaseStore';
import { useSessionStore } from '../store/sessionStore';
import { colors } from '../theme';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { CloudAccountCard } from '../components/CloudAccountCard';
import { LifeHeader } from '../components/LifeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { SceneStage } from '../components/scene/SceneStage';
import { LanguagePickerModal } from '../components/LanguagePicker';
import { languageOption } from '../data/i18n';
import { useTranslation } from '../hooks/useTranslation';

const MISSIONS = [
  { id: 'work', title: 'Work hard 10 times', target: 10, reward: DAILY_MISSION_REWARDS.work },
  { id: 'trade', title: 'Complete 3 market trades', target: 3, reward: DAILY_MISSION_REWARDS.trade },
  { id: 'business', title: 'Found 2 companies today', target: 2, reward: DAILY_MISSION_REWARDS.business },
];

const ACHIEVEMENTS = [
  { id: 'graduate', title: 'Graduate', description: 'Complete your first course', target: 1, reward: 1_000 },
  { id: 'founder', title: 'Founder', description: 'Create your first company', target: 1, reward: 5_000 },
  { id: 'investor', title: 'Investor', description: 'Own a market position', target: 1, reward: 2_500 },
  { id: 'first-home', title: 'First Home', description: 'Buy a property', target: 1, reward: 10_000 },
  { id: 'first-car', title: 'First Car', description: 'Own, finance, or lease a vehicle', target: 1, reward: 2_000 },
  { id: 'married', title: 'Life Partners', description: 'Get married', target: 1, reward: 5_000 },
  { id: 'parent', title: 'New Parent', description: 'Welcome your first child', target: 1, reward: 7_500 },
  { id: 'debt-free', title: 'Debt Free', description: 'Finish a month owing nothing', target: 1, reward: 15_000 },
  { id: 'mansion', title: 'Mansion Life', description: 'Own a mansion or penthouse', target: 1, reward: 250_000 },
  { id: 'millionaire', title: 'Millionaire', description: 'Reach $1M net worth', target: 1_000_000, reward: 100_000 },
  { id: 'billionaire', title: 'Billionaire', description: 'Reach $1B net worth', target: 1_000_000_000, reward: 10_000_000 },
];

const MOCK_LEADERS = [
  { id: 'one', name: 'NovaMogul', worth: 7.4e12 },
  { id: 'two', name: 'GoldenAylin', worth: 1.2e12 },
  { id: 'three', name: 'CapitalKai', worth: 88e9 },
  { id: 'four', name: 'StartupSam', worth: 6.5e9 },
];

export function ProfileScreen() {
  const state = useLifeStore();
  const navigation = useNavigation();
  const session = useSessionStore();
  const { adsReady, cashRewardsRequireServerClaim, privacyOptionsRequired, showPrivacyOptions, showRewardedAd } = useRewardedAd();
  const syncVerifiedCash = usePurchaseStore((purchaseState) => purchaseState.syncPendingCash);
  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [languageOpen, setLanguageOpen] = useState(false);
  const { t } = useTranslation();
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
  const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim();
  const netWorth = calculateLifeNetWorth(state);
  const numericWorth = toNumber(netWorth);
  const potential = prestigePointsForLifetime(state.lifetimeEarnings);
  const prestigeGain = Math.max(0, potential - state.legacyPoints);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const confirmPrestige = () => Alert.alert('Retire and restart?', `Reset cash, career, companies, and investments for +${prestigeGain} Legacy Points. Courses and lifestyle trophies remain.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Retire', style: 'destructive', onPress: () => state.prestige() },
  ]);
  const reset = () => Alert.alert('Erase your life?', 'This permanently removes this save slot.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Erase save', style: 'destructive', onPress: () => { if (session.activeSlot) void session.deleteSlot(session.activeSlot); } },
  ]);
  const missionProgress = (id: string) => id === 'work' ? state.dailyProgress.workTaps : id === 'trade' ? state.dailyProgress.trades : state.dailyProgress.businessActions;
  const achievementProgress = (id: string) => id === 'graduate' ? state.completedCourses.length : id === 'founder' ? state.companies.length : id === 'investor' ? (Object.values(state.portfolio).some((item) => item.quantity > 0) ? 1 : 0) : id === 'first-home' ? (state.housing.marketValue > 0 ? 1 : 0) : id === 'first-car' ? (state.vehicle.id !== 'public' && state.vehicle.id !== 'walk' ? 1 : 0) : id === 'married' ? (state.partner?.stage === 'married' ? 1 : 0) : id === 'parent' ? state.children.length : id === 'debt-free' ? (state.gameMonth >= 1 && state.loans.length === 0 && state.housing.mortgageBalance === 0 && state.vehicle.debt === 0 ? 1 : 0) : id === 'mansion' ? (state.housing.id === 'mansion' || state.housing.id === 'penthouse' ? 1 : 0) : numericWorth;
  const totalBonus = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.bonus, 0);
  const claimAdCash = async () => {
    if (adBusy) return;
    setAdBusy(true);
    setAdMessage('');
    try {
      const completed = await showRewardedAd(CASH_REWARD_PLACEMENT);
      if (!completed) {
        setAdMessage('The advertisement is not ready or was closed before the reward. Try again shortly.');
      } else if (cashRewardsRequireServerClaim) {
        const credited = await syncVerifiedCash(true);
        setAdMessage(credited > 0
          ? '$1,000 verified virtual game cash added. It has no real-world value.'
          : 'Reward completed and is being verified. It will sync automatically shortly.');
      } else {
        state.claimRewardedCash();
        setAdMessage('$1,000 simulated virtual game cash added. It has no real-world value.');
      }
    } catch {
      setAdMessage('The reward could not be synchronized. It will be retried automatically.');
    } finally {
      setAdBusy(false);
    }
  };
  const openExternalUrl = async (label: string, url?: string) => {
    if (!url?.startsWith('https://')) {
      Alert.alert(`${label} unavailable`, 'This link has not been configured in this build.');
      return;
    }
    await Linking.openURL(url);
  };
  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <LifeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SceneStage location="park" pose="celebrate" compact />
        <Text style={styles.eyebrow}>YOUR LEGACY</Text>
        <Text style={styles.title}>Profile & Lifestyle</Text>
        <AppButton variant="ghost" onPress={() => navigation.dispatch(CommonActions.navigate('Budget'))} style={styles.button}>OPEN MONTHLY BUDGET</AppButton>

        <Card style={styles.daily}>
          <View style={styles.row}><Text style={styles.dailyIcon}>🎁</Text><View style={styles.flex}><Text style={styles.cardTitle}>Daily reward</Text><Text style={styles.meta}>Current streak: day {state.dailyStreak || 1} of 7</Text></View></View>
          <View style={styles.calendar}>{DAILY_REWARD_AMOUNTS.map((reward, index) => <View key={index} style={[styles.day, index + 1 === (state.dailyStreak % 7) + 1 && styles.activeDay]}><Text style={styles.dayText}>D{index + 1}</Text><Text style={styles.dayReward}>${formatBig(reward)}</Text></View>)}</View>
          <AppButton disabled={state.lastDailyClaim === todayKey} onPress={() => state.claimDaily()} style={styles.button}>{state.lastDailyClaim === todayKey ? '✓ CLAIMED TODAY' : 'CLAIM DAILY REWARD'}</AppButton>
        </Card>

        <Card style={styles.adReward}>
          <Text style={styles.cardTitle}>Optional advertisement reward</Text>
          <Text style={styles.meta}>Watch a complete rewarded advertisement to receive $1,000 virtual game cash. Virtual cash cannot be exchanged for real money.</Text>
          <AppButton disabled={!adsReady || adBusy} onPress={() => void claimAdCash()} style={styles.button} variant="green">{adBusy ? 'LOADING AD' : adsReady ? 'WATCH AD · GET $1,000' : 'ADVERTISEMENT UNAVAILABLE'}</AppButton>
          {!!adMessage && <Text style={styles.adMessage}>{adMessage}</Text>}
        </Card>

        <Text style={styles.section}>DAILY MISSIONS</Text>
        {MISSIONS.map((mission) => {
          const progress = missionProgress(mission.id);
          const claimed = state.claimedDailyMissions.includes(mission.id);
          return <Card key={mission.id} style={styles.listCard}><View style={styles.row}><View style={styles.flex}><Text style={styles.cardTitle}>{mission.title}</Text><Text style={styles.reward}>Reward ${formatBig(mission.reward)}</Text></View><Text style={styles.counter}>{Math.min(progress, mission.target)}/{mission.target}</Text></View><ProgressBar progress={progress / mission.target} /><AppButton disabled={progress < mission.target || claimed} onPress={() => state.claimMission(mission.id)} style={styles.smallButton} variant={progress >= mission.target && !claimed ? 'gold' : 'ghost'}>{claimed ? '✓ CLAIMED' : progress >= mission.target ? 'CLAIM' : 'IN PROGRESS'}</AppButton></Card>;
        })}

        <Text style={styles.section}>LIFESTYLE SHOP • +{Math.round(totalBonus * 100)}% STATUS BONUS</Text>
        {LIFESTYLE_ITEMS.map((item) => {
          const owned = state.ownedLifestyle.includes(item.id);
          return <Card key={item.id} style={[styles.listCard, owned && styles.owned]}><View style={styles.row}><Text style={styles.itemIcon}>{item.emoji}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.reward}>{item.description}</Text><Text style={styles.meta}>Monthly upkeep ${formatBig(item.monthlyUpkeep)}</Text></View>{owned ? <Text style={styles.trophy}>🏆</Text> : null}</View><AppButton disabled={owned} onPress={() => state.buyLifestyle(item.id)} style={styles.smallButton} variant={owned ? 'ghost' : 'gold'}>{owned ? 'OWNED' : `BUY • $${formatBig(item.cost)}`}</AppButton></Card>;
        })}

        <Text style={styles.section}>ACHIEVEMENTS</Text>
        {ACHIEVEMENTS.map((achievement) => {
          const progress = achievementProgress(achievement.id);
          const claimed = state.claimedAchievements.includes(achievement.id);
          return <Card key={achievement.id} style={styles.listCard}><View style={styles.row}><Text style={styles.achievementIcon}>{claimed ? '✅' : progress >= achievement.target ? '🏆' : '🏅'}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{achievement.title}</Text><Text style={styles.meta}>{achievement.description} • ${formatBig(achievement.reward)}</Text></View></View><ProgressBar progress={progress / achievement.target} color={colors.gold} />{progress >= achievement.target && !claimed ? <AppButton onPress={() => state.claimAchievement(achievement.id)} style={styles.smallButton}>CLAIM REWARD</AppButton> : null}</Card>;
        })}

        <Text style={styles.section}>RETIRE & RESTART</Text>
        <Card style={styles.prestige}>
          <Text style={styles.prestigeIcon}>♛</Text><Text style={styles.prestigeValue}>{state.legacyPoints} Legacy Points</Text><Text style={styles.prestigeBonus}>+{state.legacyPoints * 5}% permanent income</Text><Text style={styles.meta}>Retiring now grants +{prestigeGain} points. Courses, trophies, settings, and 25% of skills survive.</Text>
          <AppButton disabled={prestigeGain <= 0} onPress={confirmPrestige} style={styles.button}>{prestigeGain > 0 ? `RETIRE FOR +${prestigeGain} LP` : 'REACH $1M LIFETIME EARNINGS'}</AppButton>
        </Card>

        <Text style={styles.section}>GLOBAL MOGULS • MOCK DATA</Text>
        {[...MOCK_LEADERS, { id: 'you', name: 'You', worth: numericWorth }].sort((a, b) => b.worth - a.worth).map((entry, index) => <View key={entry.id} style={[styles.leader, entry.id === 'you' && styles.you]}><Text style={styles.position}>{index + 1}</Text><Text style={styles.leaderName}>{entry.name}</Text><Text style={styles.leaderWorth}>${formatBig(entry.worth)}</Text></View>)}

        <Text style={styles.section}>SETTINGS</Text>
        <CloudAccountCard />
        <Card>
          <Text style={styles.howTitle}>HOW TO PLAY</Text>
          <Text style={styles.howText}>Offline progress stops after one game month ({GAME_MONTH_SECONDS} seconds). One paycheck and one set of monthly expenses settle together.</Text>
          <View style={styles.divider} />
          <View style={styles.setting}><Text style={styles.settingText}>🔊 Sound</Text><Switch value={state.settings.sound} onValueChange={(sound) => void session.updateSettings({ sound })} trackColor={{ false: colors.border, true: colors.greenDark }} thumbColor={colors.green} /></View>
          <View style={styles.divider} />
          <View style={styles.setting}><Text style={styles.settingText}>📳 Haptics</Text><Switch value={state.settings.haptics} onValueChange={(haptics) => void session.updateSettings({ haptics })} trackColor={{ false: colors.border, true: colors.greenDark }} thumbColor={colors.green} /></View>
          <View style={styles.divider} />
          <View style={styles.setting}><Text style={styles.settingText}>🌐 {t('language')}</Text><AppButton variant="ghost" onPress={() => setLanguageOpen(true)} style={styles.languageButton}>{languageOption(state.settings.language).flag} {languageOption(state.settings.language).nativeName}</AppButton></View>
          {privacyOptionsRequired ? <><View style={styles.divider} /><AppButton variant="ghost" onPress={() => void showPrivacyOptions()} style={styles.button}>ADVERTISEMENT PRIVACY OPTIONS</AppButton></> : null}
        </Card>
        <Card style={styles.legalCard}>
          <Text style={styles.howTitle}>LEGAL & SUPPORT</Text>
          <Text style={styles.howText}>Review the policies that apply to your account, purchases, advertisements, and game data.</Text>
          <AppButton variant="ghost" onPress={() => void openExternalUrl('Privacy Policy', privacyPolicyUrl)} style={styles.legalButton}>PRIVACY POLICY</AppButton>
          <AppButton variant="ghost" onPress={() => void openExternalUrl('Terms of Service', termsUrl)} style={styles.legalButton}>TERMS OF SERVICE</AppButton>
          <AppButton variant="ghost" onPress={() => void openExternalUrl('Support', supportUrl)} style={styles.legalButton}>SUPPORT</AppButton>
        </Card>
        <AppButton variant="ghost" onPress={() => void session.returnToMenu()} style={styles.reset}>{t('saveAndReturn').toUpperCase()}</AppButton>
        <AppButton variant="danger" onPress={reset} style={styles.reset}>RESET SAVE</AppButton>
        <Text style={styles.version}>Rich Simulator • Save v{state.saveVersion}</Text>
      </ScrollView>
      <LanguagePickerModal visible={languageOpen} selected={state.settings.language} onSelect={(language) => void session.chooseLanguage(language)} onClose={() => setLanguageOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 110 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginBottom: 13 },
  daily: { borderColor: colors.goldDark },
  adReward: { borderColor: colors.greenDark, marginTop: 10 },
  adMessage: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  dailyIcon: { fontSize: 35, marginRight: 11 },
  flex: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  calendar: { flexDirection: 'row', gap: 3, marginTop: 11 },
  day: { flex: 1, alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 8, paddingVertical: 6 },
  activeDay: { borderWidth: 1, borderColor: colors.gold },
  dayText: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  dayReward: { color: colors.text, fontSize: 7, marginTop: 3 },
  button: { marginTop: 11 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 23, marginBottom: 8 },
  listCard: { marginBottom: 8 },
  reward: { color: colors.green, fontSize: 10, fontWeight: '800', marginTop: 3 },
  counter: { color: colors.gold, fontWeight: '900', fontSize: 11 },
  smallButton: { minHeight: 37, marginTop: 9, paddingVertical: 6 },
  owned: { borderColor: colors.goldDark, backgroundColor: '#18160F' },
  itemIcon: { fontSize: 32, width: 48 },
  trophy: { fontSize: 22 },
  achievementIcon: { fontSize: 28, width: 43 },
  prestige: { alignItems: 'center', borderColor: colors.goldDark },
  prestigeIcon: { color: colors.gold, fontSize: 45 },
  prestigeValue: { color: colors.text, fontSize: 21, fontWeight: '900' },
  prestigeBonus: { color: colors.green, fontWeight: '900', marginTop: 3 },
  leader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 6 },
  you: { borderWidth: 1, borderColor: colors.gold },
  position: { color: colors.gold, width: 30, fontWeight: '900' },
  leaderName: { color: colors.text, flex: 1, fontWeight: '800' },
  leaderWorth: { color: colors.green, fontWeight: '900' },
  setting: { flexDirection: 'row', alignItems: 'center', minHeight: 55 },
  settingText: { flex: 1, color: colors.text, fontWeight: '800' },
  language: { color: colors.gold, fontWeight: '800' },
  languageButton: { minHeight: 38, paddingVertical: 6, paddingHorizontal: 10 },
  divider: { height: 1, backgroundColor: colors.border },
  howTitle: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  howText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 10 },
  legalCard: { marginTop: 10 },
  legalButton: { marginTop: 8 },
  reset: { marginTop: 24 },
  version: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 14 },
});
