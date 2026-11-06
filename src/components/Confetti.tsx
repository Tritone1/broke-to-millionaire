import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: ((index * 37) % 95) / 100,
  delay: (index % 6) * 45,
  color: [colors.gold, colors.green, colors.blue, colors.danger][index % 4] ?? colors.gold,
  rotation: (index * 83) % 360,
}));

function Particle({ item, nonce }: { item: (typeof PARTICLES)[number]; nonce: number }) {
  const progress = useSharedValue(1);
  useEffect(() => {
    if (nonce === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1_300 + item.delay, easing: Easing.in(Easing.quad) });
  }, [item.delay, nonce, progress]);
  const height = Dimensions.get('window').height;
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.9 ? 1 : (1 - progress.value) * 10,
    transform: [
      { translateY: progress.value * height * 0.78 },
      { rotate: `${item.rotation + progress.value * 540}deg` },
    ],
  }));
  return <Animated.View style={[styles.particle, { left: `${item.left * 100}%`, backgroundColor: item.color }, style]} />;
}

export function Confetti({ nonce }: { nonce: number }) {
  if (nonce === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((item) => <Particle key={item.id} item={item} nonce={nonce} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute', top: -20, width: 9, height: 16, borderRadius: 2 },
});
