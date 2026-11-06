import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { compare, formatBig, type BigValue } from '../game/BigNumber';
import { tapValue } from '../game/economy';
import { tapUpgradeCost } from '../game/formulas';
import { playTapSound } from '../services/audio';
import { useGameStore } from '../store/gameStore';
import { colors } from '../theme';

type FloatItem = { id: number; amount: BigValue; x: number };

function FloatingAmount({ item, onDone }: { item: FloatItem; onDone: (id: number) => void }) {
  const progress = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -100 * progress.value }, { scale: 1 + progress.value * 0.25 }],
  }));
  progress.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.quad) }, (finished) => {
    if (finished) runOnJS(onDone)(item.id);
  });
  return (
    <Animated.Text pointerEvents="none" style={[styles.float, { left: `${item.x}%` }, style]}>
      +${formatBig(item.amount, 2)}
    </Animated.Text>
  );
}

export function TapButton() {
  const state = useGameStore();
  const scale = useSharedValue(1);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const value = tapValue(state, state.tapLevel);

  const removeFloat = useCallback((id: number) => {
    setFloats((items) => items.filter((item) => item.id !== id));
  }, []);

  const handleTap = () => {
    const amount = state.tap();
    const id = Date.now() + Math.random();
    setFloats((items) => [...items.slice(-7), { id, amount, x: 18 + Math.random() * 54 }]);
    scale.set(withSequence(withTiming(0.91, { duration: 55 }), withTiming(1, { duration: 110 })));
    if (state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    void playTapSound(state.settings.sound);
  };

  const upgradeCost = tapUpgradeCost(state.tapLevel);

  return (
    <View style={styles.area}>
      {floats.map((item) => <FloatingAmount key={item.id} item={item} onDone={removeFloat} />)}
      <Animated.View style={animatedStyle}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Tap to earn ${formatBig(value)}`} onPress={handleTap} style={styles.button}>
          <View style={styles.innerRing}>
            <Text style={styles.moneyBag}>💰</Text>
            <Text style={styles.tapText}>TAP TO EARN</Text>
            <Text style={styles.value}>+${formatBig(value, 2)}</Text>
          </View>
        </Pressable>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        disabled={compare(state.money, upgradeCost) < 0}
        onPress={() => state.buyTapUpgrade()}
        style={({ pressed }) => [styles.upgrade, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.upgradeText}>Upgrade tap • ${formatBig(upgradeCost)} • Lv {state.tapLevel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 284, alignItems: 'center', justifyContent: 'center', paddingTop: 16 },
  button: { width: 194, height: 194, borderRadius: 97, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOpacity: 0.45, shadowRadius: 20, elevation: 12 },
  innerRing: { width: 174, height: 174, borderRadius: 87, backgroundColor: colors.gold, borderWidth: 5, borderColor: '#FFE59A', alignItems: 'center', justifyContent: 'center' },
  moneyBag: { fontSize: 48 },
  tapText: { color: colors.black, fontSize: 13, letterSpacing: 1.4, fontWeight: '900', marginTop: 3 },
  value: { color: '#2C2108', fontSize: 21, fontWeight: '900', marginTop: 2 },
  float: { position: 'absolute', top: 70, zIndex: 10, color: colors.green, fontSize: 21, fontWeight: '900', textShadowColor: colors.black, textShadowRadius: 5 },
  upgrade: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface2, borderRadius: 99, borderWidth: 1, borderColor: colors.goldDark },
  upgradeText: { color: colors.gold, fontWeight: '800', fontSize: 12 },
});
