import { HOUSING_ART } from '../../data/artManifest';
import { HOUSING } from '../../data/living';

describe('housing scene art', () => {
  it('provides bundled art for every housing option', () => {
    for (const housing of HOUSING) {
      expect(HOUSING_ART[housing.id]).toBeDefined();
      expect(HOUSING_ART[housing.id]?.source).toBeDefined();
    }
  });

  it('uses a distinct scene identity for every housing tier', () => {
    const titles = HOUSING.map((housing) => HOUSING_ART[housing.id]?.title);
    expect(new Set(titles).size).toBe(HOUSING.length);
  });
});
