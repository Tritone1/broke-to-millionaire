import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { ProgressBar } from './ProgressBar';

export function StatMeter({ label, value, color = colors.green }: { label: string; value: number; color?: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(bounded)}%</Text>
      </View>
      <ProgressBar progress={bounded / 100} color={color} height={7} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  value: { color: colors.text, fontSize: 10, fontWeight: '900' },
});
