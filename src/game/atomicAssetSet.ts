export type AtomicAssetState = Readonly<{
  signature: string;
  readyLayers: ReadonlySet<string>;
  failedLayers: ReadonlySet<string>;
}>;

export function emptyAtomicAssetState(signature: string): AtomicAssetState {
  return { signature, readyLayers: new Set(), failedLayers: new Set() };
}

export function updateAtomicAssetState(state: AtomicAssetState, signature: string, layer: string, result: 'ready' | 'failed'): AtomicAssetState {
  const current = state.signature === signature ? state : emptyAtomicAssetState(signature);
  const readyLayers = new Set(current.readyLayers);
  const failedLayers = new Set(current.failedLayers);
  if (result === 'ready') {
    readyLayers.add(layer);
    failedLayers.delete(layer);
  } else {
    failedLayers.add(layer);
    readyLayers.delete(layer);
  }
  return { signature, readyLayers, failedLayers };
}

export function atomicAssetSetReady(state: AtomicAssetState, signature: string, requiredLayers: readonly string[]): boolean {
  return state.signature === signature
    && state.failedLayers.size === 0
    && requiredLayers.every((layer) => state.readyLayers.has(layer));
}
