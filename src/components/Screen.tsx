import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { renderSafeChildren } from './SafeChildren';

export function Screen({ children, style, edges = ['top', 'right', 'bottom', 'left'] }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; edges?: Edge[] }>) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[styles.content, style]}>{renderSafeChildren(children, styles.text)}</View>
    </SafeAreaView>
  );
}

export function StackScreen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <Screen edges={['right', 'bottom', 'left']} style={style}>{children}</Screen>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  text: { color: colors.text },
});
