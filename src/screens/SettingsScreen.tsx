import Constants from 'expo-constants';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { clearGame } from '../services/storage';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { GAME_MONTH_SECONDS } from '../game/config';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';

function SettingRow({ icon, title, subtitle, value, onValueChange }: { icon: string; title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.flex}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.greenDark }} thumbColor={value ? colors.green : colors.muted} />
    </View>
  );
}

export function SettingsScreen() {
  const state = useGameStore();
  const appVersion = Constants.expoConfig?.version ?? 'Unknown';
  const nativeBuildVersion = Constants.nativeBuildVersion ?? 'Development';
  const reset = () => {
    Alert.alert('Reset all progress?', 'This permanently erases cash, businesses, trophies, achievements, and Legacy Points.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase save',
        style: 'destructive',
        onPress: () => {
          state.resetGame();
          void clearGame();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>PREFERENCES</Text>
        <Text style={styles.title}>Settings</Text>
        <Card style={styles.card}>
          <SettingRow icon="🔊" title="Sound" subtitle="Game sound effects" value={state.settings.sound} onValueChange={(sound) => state.updateSettings({ sound })} />
          <View style={styles.separator} />
          <SettingRow icon="📳" title="Haptics" subtitle="Tap and purchase feedback" value={state.settings.haptics} onValueChange={(haptics) => state.updateSettings({ haptics })} />
        </Card>

        <Text style={styles.section}>LANGUAGE</Text>
        <Card style={styles.languageCard}>
          <Text style={styles.flag}>🇺🇸</Text>
          <View style={styles.flex}>
            <Text style={styles.settingTitle}>English</Text>
            <Text style={styles.settingSubtitle}>Language-ready key structure</Text>
          </View>
          <Text style={styles.check}>✓</Text>
        </Card>

        <Text style={styles.section}>GAME DATA</Text>
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>App version</Text><Text style={styles.infoValue}>v{appVersion}</Text>
          <Text style={styles.infoLabel}>Native build</Text><Text style={styles.infoValue}>{nativeBuildVersion}</Text>
          <Text style={styles.infoLabel}>Save version</Text><Text style={styles.infoValue}>v{state.saveVersion}</Text>
          <Text style={styles.infoLabel}>Autosave</Text><Text style={styles.infoValue}>Every 10 seconds</Text>
          <Text style={styles.infoLabel}>Offline cap</Text><Text style={styles.infoValue}>1 game month ({GAME_MONTH_SECONDS}s)</Text>
        </Card>
        <AppButton variant="danger" onPress={reset} style={styles.reset}>RESET SAVE</AppButton>
        <Text style={styles.version}>Rich Simulator Idle • v{appVersion} ({nativeBuildVersion})</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingTop: 28, paddingBottom: 120 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', marginBottom: 18 },
  card: { paddingVertical: 4 },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 24, width: 42 },
  flex: { flex: 1 },
  settingTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  settingSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 42 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 24, marginBottom: 8 },
  languageCard: { flexDirection: 'row', alignItems: 'center' },
  flag: { fontSize: 28, marginRight: 14 },
  check: { color: colors.green, fontSize: 19, fontWeight: '900' },
  infoCard: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  infoLabel: { width: '50%', color: colors.muted, fontSize: 13 },
  infoValue: { width: '50%', color: colors.text, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  reset: { marginTop: 28 },
  version: { color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: 18 },
});
