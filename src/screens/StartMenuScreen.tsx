import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useSessionStore } from '../store/sessionStore';
import { colors } from '../theme';
import type { SlotId } from '../services/lifeStorage';
import { GAME_MONTH_SECONDS } from '../game/config';

function playtime(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours}h ${minutes}m`;
}

export function StartMenuScreen() {
  const session = useSessionStore();
  const occupied = Object.keys(session.slots).length;
  const openNew = () => {
    const empty = ([1, 2, 3] as SlotId[]).find((slot) => !session.slots[slot]);
    if (empty) session.openSetup(empty);
    else Alert.alert('All slots are full', 'Delete a save slot before starting a new life.');
  };
  const remove = (slot: SlotId, name: string) => Alert.alert('Delete this life?', `${name}'s progress will be permanently removed.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => void session.deleteSlot(slot) },
  ]);

  if (session.phase === 'settings') {
    return <Screen><ScrollView contentContainerStyle={styles.panel}><Text style={styles.panelTitle}>Settings</Text><Card><View style={styles.setting}><Text style={styles.settingText}>Sound</Text><Switch value={session.settings.sound} onValueChange={(sound) => void session.updateSettings({ sound })} /></View><View style={styles.divider} /><View style={styles.setting}><Text style={styles.settingText}>Haptics</Text><Switch value={session.settings.haptics} onValueChange={(haptics) => void session.updateSettings({ haptics })} /></View><View style={styles.divider} /><View style={styles.setting}><Text style={styles.settingText}>Language</Text><Text style={styles.gold}>English</Text></View><Text style={styles.note}>The language field is stored independently and ready for additional translation dictionaries.</Text></Card><AppButton onPress={session.closePanel} style={styles.back}>BACK</AppButton></ScrollView></Screen>;
  }
  if (session.phase === 'help') {
    return <Screen><ScrollView contentContainerStyle={styles.panel}><Text style={styles.panelTitle}>How to Play</Text><Card><Text style={styles.helpTitle}>Build a life, not just a balance.</Text><Text style={styles.help}>You begin with $0, no job, no home, community meals, and walking. These starting choices create no monthly bill.</Text><Text style={styles.help}>At 1x speed, every game month lasts exactly 60 real seconds. Salary arrives on payday, then only your selected housing, food, transport, healthcare, debts, and family costs are charged.</Text><Text style={styles.help}>Apply for courier work, then improve your housing and food to unlock longer, more difficult courses and better careers.</Text><Text style={styles.help}>Offline simulation stops after one game month ({GAME_MONTH_SECONDS} seconds). Income, expenses, study, aging, and markets all stop together at that cap.</Text><Text style={styles.help}>Broker access unlocks at $25K net worth and the first business unlocks at $50K net worth.</Text><Text style={styles.help}>Bank credit requires six clean months in the current job, uses high interest, and limits all loan payments to 25% of job salary.</Text><Text style={styles.help}>Offline expenses and calendar months advance with income, so keep a safe cash reserve for recurring bills.</Text><Text style={styles.help}>Missed payments add bounded late fees and may return you to homelessness or walking.</Text><Text style={styles.help}>Relationships need time and affection. Dates, marriage, and children add happiness as well as expenses.</Text><Text style={styles.help}>Net worth includes cash, investments, companies, home and vehicle equity, minus debt.</Text></Card><AppButton onPress={session.closePanel} style={styles.back}>BACK</AppButton></ScrollView></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>$</Text>
        <Text style={styles.title}>RICH SIMULATOR</Text>
        <Text style={styles.subtitle}>IDLE LIFE</Text>
        <View style={styles.heroButtons}>
          <AppButton onPress={openNew}>NEW GAME</AppButton>
          <AppButton variant="green" disabled={occupied === 0} onPress={() => void session.continueLatest()}>CONTINUE</AppButton>
          <View style={styles.row}><AppButton variant="ghost" style={styles.half} onPress={() => session.openPanel('settings')}>SETTINGS</AppButton><AppButton variant="ghost" style={styles.half} onPress={() => session.openPanel('help')}>HOW TO PLAY</AppButton></View>
        </View>
        <Text style={styles.section}>SAVE SLOTS</Text>
        {([1, 2, 3] as SlotId[]).map((slot) => {
          const save = session.slots[slot];
          return (
            <Card key={slot} style={styles.slot}>
              <View style={styles.slotTop}><Text style={styles.slotNumber}>SLOT {slot}</Text><Text style={styles.slotState}>{save ? 'SAVED LIFE' : 'EMPTY'}</Text></View>
              {save ? <><Text style={styles.name}>{save.name}</Text><Text style={styles.meta}>Age {save.age} · ${save.netWorth} net worth · {playtime(save.playSeconds)}</Text><View style={styles.row}><AppButton style={styles.half} onPress={() => void session.continueSlot(slot)}>CONTINUE</AppButton><AppButton variant="danger" style={styles.delete} onPress={() => remove(slot, save.name)}>DELETE</AppButton></View></> : <><Text style={styles.empty}>A fresh story is waiting.</Text><AppButton variant="ghost" onPress={() => session.openSetup(slot)}>CREATE CHARACTER</AppButton></>}
            </Card>
          );
        })}
        <Text style={styles.version}>SAVE SYSTEM V3 · THREE LOCAL SLOTS</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 54, paddingBottom: 50 },
  logo: { color: colors.black, backgroundColor: colors.gold, width: 82, height: 82, borderRadius: 41, textAlign: 'center', textAlignVertical: 'center', alignSelf: 'center', fontSize: 55, fontWeight: '900' },
  title: { color: colors.text, textAlign: 'center', fontSize: 30, fontWeight: '900', letterSpacing: 1.5, marginTop: 16 },
  subtitle: { color: colors.green, textAlign: 'center', fontSize: 11, fontWeight: '900', letterSpacing: 4, marginTop: 3 },
  heroButtons: { gap: 9, marginTop: 30 },
  row: { flexDirection: 'row', gap: 8, marginTop: 9 },
  half: { flex: 1 },
  delete: { width: 92 },
  section: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 30, marginBottom: 9 },
  slot: { marginBottom: 10 },
  slotTop: { flexDirection: 'row', justifyContent: 'space-between' },
  slotNumber: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  slotState: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  name: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 8 },
  meta: { color: colors.green, fontSize: 11, fontWeight: '700', marginTop: 3 },
  empty: { color: colors.muted, marginVertical: 14 },
  version: { color: colors.muted, textAlign: 'center', fontSize: 9, marginTop: 16 },
  panel: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  panelTitle: { color: colors.text, fontSize: 32, fontWeight: '900', marginBottom: 15 },
  setting: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  settingText: { color: colors.text, fontWeight: '800', flex: 1 },
  divider: { height: 1, backgroundColor: colors.border },
  gold: { color: colors.gold, fontWeight: '900' },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  back: { marginTop: 12 },
  helpTitle: { color: colors.gold, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  help: { color: colors.text, lineHeight: 21, marginBottom: 12 },
});
