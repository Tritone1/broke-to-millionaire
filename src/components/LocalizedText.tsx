import { Children, type ReactNode } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { localizeInterfaceText } from '../data/interfaceLocalization';
import { useLocalizationStore } from '../store/localizationStore';

function localizeNode(node: ReactNode, language: ReturnType<typeof useLocalizationStore.getState>['language']): ReactNode {
  if (typeof node === 'string') return localizeInterfaceText(language, node);
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, language));
  return node;
}

/** Drop-in React Native Text that makes legacy game copy react to language changes. */
export function Text({ children, ...props }: TextProps) {
  const language = useLocalizationStore((state) => state.language);
  return <NativeText {...props}>{Children.map(children, (child) => localizeNode(child, language))}</NativeText>;
}
