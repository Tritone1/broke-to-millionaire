import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { cooldownRemaining } from '../services/ads/adConfig';
import { colors } from '../theme';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { Text } from './LocalizedText';

type Props = {
  title: string;
  description: string;
  buttonLabel: string;
  busy: boolean;
  adsReady: boolean;
  disabled?: boolean;
  readyAt?: number;
  message?: string;
  onPress: () => void;
};

function remainingLabel(readyAt?: number, now = Date.now()): string {
  const remaining = cooldownRemaining(readyAt, now);
  if (remaining <= 0) return '';
  return `Available in ${Math.ceil(remaining / 60_000)} min`;
}

export function RewardedAdCard({ title, description, buttonLabel, busy, adsReady, disabled, readyAt, message, onPress }: Props) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!readyAt) return undefined;
    const updateNow = () => setNow(Date.now());
    updateNow();
    const timer = setInterval(updateNow, 10_000);
    return () => clearInterval(timer);
  }, [readyAt]);
  const cooldown = now > 0 ? remainingLabel(readyAt, now) : '';
  const unavailable = !adsReady || !!disabled || !!cooldown;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>▶ {title}</Text>
      <Text style={styles.description}>{description}</Text>
      <AppButton variant="green" disabled={busy || unavailable} onPress={onPress} style={styles.button}>
        {busy ? 'PREPARING AD...' : cooldown || (!adsReady ? 'ADVERTISEMENT UNAVAILABLE' : buttonLabel)}
      </AppButton>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.greenDark, marginBottom: 10 },
  title: { color: colors.text, fontSize: 14, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  button: { marginTop: 9 },
  message: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 6 },
});
