import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme';
import { renderSafeChildren } from './SafeChildren';

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{renderSafeChildren(children, styles.text)}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: '#17364C', padding: 16, shadowColor: '#10283A', shadowOpacity: 0.12, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  text: { color: colors.text },
});
