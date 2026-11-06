import { StyleSheet, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { colors } from '../theme';

export function MarketChart({ values, width = 330, height = 150 }: { values: number[]; width?: number; height?: number }) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(0.0001, maximum - minimum);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - ((value - minimum) / range) * (height - 12) - 6;
    return `${x},${y}`;
  }).join(' ');
  const positive = values.length < 2 || (values.at(-1) ?? 0) >= (values[0] ?? 0);
  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke={colors.border} strokeWidth="1" />
        <Line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke={colors.border} strokeWidth="1" />
        <Line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke={colors.border} strokeWidth="1" />
        <Polyline points={points} fill="none" stroke={positive ? colors.green : colors.danger} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', borderRadius: 14, backgroundColor: '#0B100D' },
});
