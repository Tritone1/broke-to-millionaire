import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { clearGame } from '../services/storage';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';
import { GAME_MONTH_SECONDS } from '../game/config';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { LanguagePickerModal } from '../components/LanguagePicker';
import { languageOption } from '../data/i18n';
import { useTranslation } from '../hooks/useTranslation';
import { useSessionStore } from '../store/sessionStore';

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
  const session = useSessionStore();
  const { t } = useTranslation();
  const [languageOpen, setLanguageOpen] = useState(false);
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
        <Text style={styles.eyebrow}>{t('preferences').toUpperCase()}</Text>
        <Text style={styles.title}>{t('settings')}</Text>
        <Card style={styles.card}>
          <SettingRow icon="🔊" title={t('sound')} subtitle={t('soundHint')} value={state.settings.sound} onValueChange={(sound) => state.updateSettings({ sound })} />
          <View style={styles.separator} />
          <SettingRow icon="📳" title={t('haptics')} subtitle={t('hapticsHint')} value={state.settings.haptics} onValueChange={(haptics) => state.updateSettings({ haptics })} />
        </Card>

        <Text style={styles.section}>{t('language').toUpperCase()}</Text>
        <Card style={styles.languageCard}>
          <Text style={styles.flag}>{languageOption(session.settings.language).flag}</Text>
          <View style={styles.flex}>
            <Text style={styles.settingTitle}>{languageOption(session.settings.language).nativeName}</Text>
            <Text style={styles.settingSubtitle}>{t('languageHint')}</Text>
          </View>
          <AppButton variant="ghost" onPress={() => setLanguageOpen(true)}>{t('language')}</AppButton>
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
      <LanguagePickerModal visible={languageOpen} selected={session.settings.language} onSelect={(language) => void session.chooseLanguage(language)} onClose={() => setLanguageOpen(false)} />
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
