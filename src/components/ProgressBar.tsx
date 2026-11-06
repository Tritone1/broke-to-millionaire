import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

export function ProgressBar({ progress, color = colors.green, height = 8 }: { progress: number; color?: string; height?: number }) {
  const bounded = Math.max(0, Math.min(1, progress));
  const animatedStyle = useAnimatedStyle(() => ({ width: withTiming(`${bounded * 100}%`, { duration: 250 }) }));
  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%', backgroundColor: colors.surface2, borderRadius: 99 },
  fill: { height: '100%', borderRadius: 99 },
});
