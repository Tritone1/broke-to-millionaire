export async function playTapSound(enabled: boolean): Promise<void> {
  if (!enabled) return;
  // Sound is intentionally silent until a bundled asset is added. This keeps
  // Expo Go fully functional without network audio or a missing-asset crash.
}

export async function unloadSounds(): Promise<void> {
  // No player is allocated while the game uses its silent fallback.
}
