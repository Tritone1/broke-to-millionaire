import { useEffect } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from '../../hooks/useTranslation';

const ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂', route: 'Home' },
  { id: 'career', label: 'Career', icon: '★', route: 'Career' },
  { id: 'business', label: 'Business', icon: '▦', route: 'Business' },
  { id: 'market', label: 'Market', icon: '↗', route: 'Market' },
  { id: 'more', label: 'More', icon: '☰', route: 'More' },
] as const;

function NavItem({ item, active, onPress }: { item: typeof ITEMS[number]; active: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const label = t(item.id);
  const bounce = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    bounce.value = active ? withRepeat(withSequence(withTiming(-3, { duration: 420 }), withTiming(0, { duration: 420 })), -1, false) : withTiming(0);
  }, [active, bounce]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }, { scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => { scale.set(withSpring(0.86)); }}
      onPressOut={() => { scale.set(withSpring(1)); }}
      style={[styles.item, active && styles.activeItem]}
    >
      <Animated.View style={[styles.iconShell, active && styles.activeIconShell, iconStyle]}><Text style={[styles.icon, active && styles.activeIcon]}>{item.icon}</Text></Animated.View>
      <Text numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

export function ActionDock({ active }: { active?: string }) {
  const navigation = useNavigation();
  return (
    <View style={styles.shell} accessibilityRole="tablist">
      {ITEMS.map((item) => <NavItem key={item.id} item={item} active={active === item.id} onPress={() => navigation.dispatch(CommonActions.navigate('Tabs', { screen: item.route }))} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { height: 67, flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#FFF8E8', borderTopWidth: 3, borderTopColor: '#17364C', paddingHorizontal: 3, paddingTop: 4, paddingBottom: 3, zIndex: 30 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  activeItem: { backgroundColor: '#FFF0AF' },
  iconShell: { width: 31, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  activeIconShell: { backgroundColor: '#FFD558', borderWidth: 2, borderColor: '#17364C', shadowColor: '#F2B82E', shadowOpacity: 0.65, shadowRadius: 8, elevation: 5 },
  icon: { color: '#617582', fontSize: 20, lineHeight: 22, fontWeight: '900' },
  activeIcon: { color: '#17364C' },
  label: { maxWidth: '100%', color: '#617582', fontSize: 8, fontWeight: '900', marginTop: 2 },
  activeLabel: { color: '#17364C' },
});
