import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { HAIRSTYLES, normalizeHairstyleForGender } from '../data/artManifest';
import type { CharacterProfile } from '../store/lifeStore';
import { CharacterHead } from './PlayerCharacter';

export const CharacterAvatar = memo(function CharacterAvatar({ character, size = 84 }: { character: CharacterProfile; size?: number }) {
  const hairIndex = normalizeHairstyleForGender(character.avatar.hairStyle, character.gender);
  return (
    <View accessibilityLabel={`${character.name} avatar, ${HAIRSTYLES[hairIndex]} hairstyle`} style={[styles.shell, { width: size, height: size, borderRadius: size / 2, borderColor: character.avatar.skin }]}>
      <CharacterHead character={character} portraitCrop="tight" style={{ width: size - 6, height: size - 6 }} />
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { overflow: 'hidden', borderWidth: 3, backgroundColor: '#8FD5EC', alignItems: 'center', justifyContent: 'center' },
});
