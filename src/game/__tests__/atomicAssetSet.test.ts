import { atomicAssetSetReady, emptyAtomicAssetState, updateAtomicAssetState } from '../atomicAssetSet';

const requiredLayers = ['hairBack', 'outfitBack', 'neck', 'outfitFront', 'headAndEars', 'hairFront'] as const;

describe('atomic avatar asset readiness', () => {
  it('does not expose a partly loaded character', () => {
    let state = emptyAtomicAssetState('avatar-a');
    for (const layer of requiredLayers.slice(0, -1)) {
      state = updateAtomicAssetState(state, 'avatar-a', layer, 'ready');
      expect(atomicAssetSetReady(state, 'avatar-a', requiredLayers)).toBe(false);
    }
    state = updateAtomicAssetState(state, 'avatar-a', 'hairFront', 'ready');
    expect(atomicAssetSetReady(state, 'avatar-a', requiredLayers)).toBe(true);
  });

  it('invalidates readiness atomically when the asset signature changes', () => {
    let state = emptyAtomicAssetState('male');
    for (const layer of requiredLayers) state = updateAtomicAssetState(state, 'male', layer, 'ready');
    expect(atomicAssetSetReady(state, 'male', requiredLayers)).toBe(true);

    state = updateAtomicAssetState(state, 'female', 'hairBack', 'ready');
    expect(state.signature).toBe('female');
    expect(atomicAssetSetReady(state, 'female', requiredLayers)).toBe(false);
    expect(atomicAssetSetReady(state, 'male', requiredLayers)).toBe(false);
  });

  it('reports a failed layer instead of treating it as complete', () => {
    let state = emptyAtomicAssetState('avatar');
    for (const layer of requiredLayers) state = updateAtomicAssetState(state, 'avatar', layer, 'ready');
    state = updateAtomicAssetState(state, 'avatar', 'headAndEars', 'failed');
    expect(state.failedLayers.has('headAndEars')).toBe(true);
    expect(atomicAssetSetReady(state, 'avatar', requiredLayers)).toBe(false);
  });
});
