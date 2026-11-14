import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LANGUAGE_OPTIONS, languageOption, translate, type Language } from '../data/i18n';
import { colors } from '../theme';
import { AppButton } from './AppButton';

type PickerBodyProps = {
  selected: Language;
  onSelect: (language: Language) => void;
  onConfirm: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
};

export function LanguagePickerBody({ selected, onSelect, onConfirm, showCancel, onCancel }: PickerBodyProps) {
  const insets = useSafeAreaInsets();
  const selectedOption = languageOption(selected);
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.globe}>🌍</Text>
        <Text style={styles.title}>{translate(selected, 'chooseLanguage')}</Text>
        <Text style={styles.subtitle}>{translate(selected, 'chooseLanguageHint')}</Text>
        <View style={styles.grid}>
          {LANGUAGE_OPTIONS.map((option) => {
            const active = option.id === selected;
            return (
              <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onSelect(option.id)} style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}>
                <Text style={styles.flag}>{option.flag}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.nativeName, active && styles.activeText]}>{option.nativeName}</Text>
                  {option.nativeName !== option.englishName ? <Text style={styles.englishName}>{option.englishName}</Text> : null}
                </View>
                <Text style={styles.check}>{active ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
        <AppButton onPress={onConfirm}>{translate(selected, 'continue')} · {selectedOption.flag}</AppButton>
        {showCancel ? <AppButton variant="ghost" onPress={() => onCancel?.()} style={styles.cancel}>{translate(selected, 'cancel')}</AppButton> : null}
      </ScrollView>
    </View>
  );
}

export function LanguagePickerModal({ visible, selected, onSelect, onClose }: { visible: boolean; selected: Language; onSelect: (language: Language) => void; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <LanguagePickerBody selected={selected} onSelect={onSelect} onConfirm={onClose} showCancel onCancel={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  globe: { fontSize: 52, textAlign: 'center' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7, marginBottom: 24 },
  grid: { gap: 9, marginBottom: 20 },
  option: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14 },
  optionActive: { borderColor: colors.gold, backgroundColor: '#FFF2C7' },
  optionPressed: { transform: [{ scale: 0.985 }] },
  flag: { fontSize: 29, width: 47 },
  optionText: { flex: 1 },
  nativeName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  activeText: { color: colors.goldDark },
  englishName: { color: colors.muted, fontSize: 10, marginTop: 2 },
  check: { color: colors.greenDark, fontSize: 21, fontWeight: '900', width: 24, textAlign: 'right' },
  cancel: { marginTop: 9 },
});
