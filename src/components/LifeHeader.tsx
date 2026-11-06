import { useEffect, useRef, useState } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View, type HostInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { formatBig, toNumber, type BigValue } from '../game/BigNumber';
import type { LifeRootParamList } from '../navigation/AppNavigator';
import { monthlyBillsFor, totalIncomePerSecond, useLifeStore } from '../store/lifeStore';
import { estimatedLifespanYears } from '../game/wellness';
import { colors } from '../theme';
import { CharacterAvatar } from './CharacterAvatar';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
type LayoutRect = Readonly<{ x: number; y: number; width: number; height: number }>;

function intersects(first: LayoutRect, second: LayoutRect) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function measureView(view: HostInstance | null) {
  return new Promise<LayoutRect | null>((resolve) => {
    if (!view) { resolve(null); return; }
    view.measureInWindow((x: number, y: number, width: number, height: number) => resolve({ x, y, width, height }));
  });
}

function MiniMeter({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.meterRow}>
      <Text style={styles.meterIcon}>{icon}</Text>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}><View style={[styles.meterFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function CountedCash({ value }: { value: BigValue }) {
  const target = toNumber(value);
  const previous = useRef(target);
  const [shown, setShown] = useState(target);
  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (!Number.isFinite(target) || Math.abs(target - from) < 0.01) {
      setShown(target);
      return undefined;
    }
    const started = Date.now();
    let frame = 0;
    const update = () => {
      const progress = Math.min(1, (Date.now() - started) / 520);
      setShown(from + (target - from) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <Text numberOfLines={1} adjustsFontSizeToFit style={styles.cash}>${formatBig(shown, 2)}</Text>;
}

export function LifeHeader() {
  const header = useLifeStore(useShallow((state) => {
    const monthlyIncome = totalIncomePerSecond(state) * state.monthLengthSeconds;
    const monthlyNet = monthlyIncome - monthlyBillsFor(state).total - state.lateFees;
    return {
      character: state.character,
      money: state.money,
      gems: state.gems,
      energy: Math.round(state.energy),
      health: Math.round(state.health),
      happiness: Math.round(state.happiness),
      gameMonth: state.gameMonth,
      age: state.age,
      timeSpeed: state.timeSpeed,
      setTimeSpeed: state.setTimeSpeed,
      monthlyIncome,
      monthlyNet,
      level: 1 + Math.floor((state.totalPlaySeconds + Object.values(state.skills).reduce((sum, value) => sum + value * 30, 0)) / 300),
      lifespan: estimatedLifespanYears(state),
    };
  }));
  const navigation = useNavigation<NavigationProp<LifeRootParamList>>();
  const pulse = useSharedValue(1);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const previousMoney = useRef(toNumber(header.money));
  const moneyRef = useRef<HostInstance>(null);
  const gemRef = useRef<HostInstance>(null);
  const gearRef = useRef<HostInstance>(null);
  const speedRef = useRef<HostInstance>(null);
  useEffect(() => {
    if (!__DEV__) return undefined;
    const timer = setTimeout(() => {
      void Promise.all([measureView(gearRef.current), measureView(moneyRef.current), measureView(gemRef.current), measureView(speedRef.current)]).then(([gear, money, gem, speed]) => {
        if (!gear) return;
        const collisions = [['cash text', money], ['gems control', gem], ['speed controls', speed]] as const;
        for (const [label, rect] of collisions) {
          if (rect && intersects(gear, rect)) {
            // eslint-disable-next-line no-console
            console.warn(`[Header layout] Settings gear overlaps ${label}.`);
          }
        }
      });
    }, 250);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const next = toNumber(header.money);
    if (next !== previousMoney.current) {
      setFlash(next > previousMoney.current ? 'up' : 'down');
      pulse.value = withSequence(withSpring(1.06), withSpring(1));
      const timer = setTimeout(() => setFlash(null), 500);
      previousMoney.current = next;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [header.money, pulse]);
  const cashStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const year = 2026 + Math.floor(header.gameMonth / 12);
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.avatarRing}>
          <CharacterAvatar character={header.character} size={46} />
          <View style={styles.levelBadge}><Text style={styles.levelText}>{header.level}</Text></View>
        </View>
        <Animated.View ref={moneyRef} style={[styles.moneyBlock, flash === 'up' && styles.moneyUp, flash === 'down' && styles.moneyDown, cashStyle]}>
          <CountedCash value={header.money} />
          <Text numberOfLines={1} style={[styles.income, header.monthlyNet < 0 && styles.negative]}>Total ${formatBig(header.monthlyIncome, 1)}/mo · {header.monthlyNet >= 0 ? '+' : '-'}${formatBig(Math.abs(header.monthlyNet), 1)} net</Text>
        </Animated.View>
        <View style={styles.rightCluster}>
          <View ref={gemRef} style={styles.gemChip}><Text style={styles.gemIcon}>◆</Text><Text style={styles.gemValue}>{header.gems}</Text></View>
          <Pressable ref={gearRef} accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => navigation.navigate('Profile')} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.meters}>
          <MiniMeter icon="⚡" label="ENERGY" value={header.energy} color="#F3B72E" />
          <MiniMeter icon="♥" label="HEALTH" value={header.health} color="#E84D63" />
          <MiniMeter icon="●" label="HAPPY" value={header.happiness} color="#4DBD69" />
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.date}>{MONTHS[header.gameMonth % 12]} {year}</Text>
          <Text style={styles.age}>AGE {header.age} / {header.lifespan}</Text>
        </View>
        <View ref={speedRef} style={styles.segmented}>
          {([0, 1, 2, 4] as const).map((speed) => (
            <Pressable key={speed} accessibilityRole="button" accessibilityLabel={speed === 0 ? 'Pause' : `${speed} times speed`} onPress={() => header.setTimeSpeed(speed)} style={[styles.segment, header.timeSpeed === speed && styles.segmentActive]}>
              <Text style={[styles.segmentText, header.timeSpeed === speed && styles.segmentTextActive]}>{speed === 0 ? 'Ⅱ' : `${speed}x`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 96, backgroundColor: '#FFF8E8', borderBottomWidth: 3, borderBottomColor: '#17364C', paddingHorizontal: 8, paddingTop: 5, paddingBottom: 5, zIndex: 20 },
  topRow: { height: 48, flexDirection: 'row', alignItems: 'center' },
  avatarRing: { width: 46, height: 46, borderRadius: 23 },
  levelBadge: { position: 'absolute', left: -2, bottom: -2, minWidth: 20, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD95C', borderWidth: 2, borderColor: '#17364C' },
  levelText: { color: '#17364C', fontSize: 8, fontWeight: '900' },
  moneyBlock: { flex: 1, minWidth: 0, marginHorizontal: 7, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 14, backgroundColor: '#E7F7E9', borderWidth: 2, borderColor: '#4B9B62' },
  moneyUp: { backgroundColor: '#CFF4D8' },
  moneyDown: { backgroundColor: '#FFE0DE', borderColor: '#D85C58' },
  cash: { color: '#17683A', fontSize: 20, lineHeight: 22, fontWeight: '900', fontFamily: 'LilitaOne_400Regular' },
  income: { color: '#35764D', fontSize: 8, fontWeight: '800' },
  negative: { color: colors.danger },
  rightCluster: { width: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  gemChip: { minWidth: 38, height: 31, paddingHorizontal: 6, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9DFFF', borderWidth: 2, borderColor: '#7B60BD' },
  gemIcon: { color: '#7452C4', fontSize: 11 },
  gemValue: { color: '#443071', fontSize: 10, fontWeight: '900', marginLeft: 3 },
  settingsButton: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDECF1', borderWidth: 2, borderColor: '#5D7785' },
  settingsIcon: { color: '#17364C', fontSize: 17, lineHeight: 19, fontWeight: '900' },
  bottomRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  meters: { flex: 1, minWidth: 112, gap: 1 },
  meterRow: { height: 10, flexDirection: 'row', alignItems: 'center' },
  meterIcon: { width: 11, color: '#17364C', fontSize: 7, fontWeight: '900' },
  meterLabel: { width: 37, color: '#466173', fontSize: 6, fontWeight: '900' },
  meterTrack: { flex: 1, height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: '#D2D9D9', borderWidth: 0.5, borderColor: '#78909A' },
  meterFill: { height: '100%', borderRadius: 4 },
  dateBlock: { width: 61, alignItems: 'center' },
  date: { color: '#17364C', fontSize: 8, fontWeight: '900' },
  age: { color: '#5D7180', fontSize: 7, fontWeight: '800' },
  segmented: { height: 25, flexDirection: 'row', overflow: 'hidden', borderRadius: 9, borderWidth: 2, borderColor: '#17364C', backgroundColor: '#DDECF1' },
  segment: { width: 24, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#8DA9B5' },
  segmentActive: { backgroundColor: '#FFD95C' },
  segmentText: { color: '#59717E', fontSize: 7, fontWeight: '900' },
  segmentTextActive: { color: '#17364C' },
});
