import { Children, type ReactNode } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import { Text } from './LocalizedText';

export function renderSafeChildren(children: ReactNode, textStyle?: StyleProp<TextStyle>): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'bigint') {
      return <Text style={textStyle}>{String(child)}</Text>;
    }
    return child;
  });
}
