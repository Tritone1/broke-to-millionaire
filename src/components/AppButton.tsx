import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useLifeStore } from '../store/lifeStore';
import { colors } from '../theme';
import { renderSafeChildren } from './SafeChildren';

type Props = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  variant?: 'gold' | 'green' | 'ghost' | 'danger' | 'blue';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppButton({ children, onPress, disabled = false, variant = 'gold', style, accessibilityLabel }: Props) {
  const scale = useSharedValue(1);
  const hapticsEnabled = useLifeStore((state) => state.settings.haptics);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    if (hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
    onPress();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => { scale.set(withSpring(0.96)); }}
      onPressOut={() => { scale.set(withSpring(1)); }}
      style={[styles.base, styles[variant], disabled && styles.disabled, style, animatedStyle]}
    >
      {renderSafeChildren(children, [styles.text, variant === 'ghost' && styles.ghostText, variant === 'blue' && styles.lightText])}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderWidth: 2, borderBottomWidth: 4, borderColor: '#17364C', shadowColor: '#10283A', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  gold: { backgroundColor: colors.gold },
  green: { backgroundColor: colors.green },
  ghost: { backgroundColor: colors.surface2, borderColor: '#667983' },
  danger: { backgroundColor: colors.danger },
  blue: { backgroundColor: '#65A8ED', borderColor: '#245D9A' },
  disabled: { opacity: 0.38 },
  text: { color: colors.black, fontSize: 14, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', letterSpacing: 0.3, textAlign: 'center' },
  ghostText: { color: colors.text },
  lightText: { color: '#FFFFFF' },
});
