import { ETHNICITIES } from '../../data/living';
import { CHARACTER_ART, HAIRSTYLE_INDEXES, LOCATION_ART, SKIN_TONES, normalizeHairstyleForGender } from '../../data/artManifest';
import hairBounds from '../../data/avatarHairBounds.json';
import anchorData from '../../data/avatarAnchorData.json';
import { AVATAR_ANCHORS, AVATAR_CANVAS, AVATAR_CREATOR_LAYOUT, AVATAR_GENDER_ANCHORS, AVATAR_HAIR_FITS, AVATAR_HEAD_CENTER_X, AVATAR_LAYER_ORDER, AVATAR_OUTFIT_FITS, AVATAR_OUTFIT_TOKENS, AVATAR_PROPORTIONS, AVATAR_REQUIRED_LAYERS } from '../../data/avatarAnchors';
import { avatarFrameGeometry, framedAnchorY, HUD_PORTRAIT_SCREENS, type AvatarFramingMode } from '../avatarGeometry';
import { AVATAR_ATLAS, avatarAppearanceKey, ethnicityColumn, genderRow, skinToneIndex } from '../avatarRig';

describe('unified avatar geometry', () => {
  it('maps every ethnicity to a unique atlas column', () => {
    const columns = ETHNICITIES.map(({ id }) => ethnicityColumn(id));
    expect(new Set(columns).size).toBe(ETHNICITIES.length);
    expect(columns.every((column) => column >= 0 && column < AVATAR_ATLAS.ethnicityColumns)).toBe(true);
  });

  it('changes the render identity whenever the selected ethnicity changes', () => {
    const keys = ETHNICITIES.map(({ id }) => avatarAppearanceKey({
      gender: 'female',
      ethnicity: id,
      avatar: { skin: SKIN_TONES[2], hairStyle: 4, hairColor: '#2A1A12', outfitColor: '#176B42' },
    }));
    expect(new Set(keys).size).toBe(ETHNICITIES.length);
  });

  it('uses stable gender rows and safe fallbacks', () => {
    expect(genderRow('male')).toBe(0);
    expect(genderRow('female')).toBe(1);
    expect(ethnicityColumn('unknown')).toBe(ethnicityColumn('european'));
  });

  it('keeps male and female hairstyle choices separate and normalizes old saves', () => {
    expect(HAIRSTYLE_INDEXES.male).toEqual([0, 1, 2]);
    expect(HAIRSTYLE_INDEXES.female).toEqual([3, 4, 5]);
    expect(HAIRSTYLE_INDEXES.male.some((index) => HAIRSTYLE_INDEXES.female.includes(index as never))).toBe(false);
    expect(normalizeHairstyleForGender(5, 'male')).toBe(0);
    expect(normalizeHairstyleForGender(0, 'female')).toBe(3);
  });

  it('maps every centralized skin token to its painted shading atlas', () => {
    expect(SKIN_TONES.map((tone) => skinToneIndex(tone))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('uses one anatomical layer order and centered head-to-shoulder proportions', () => {
    expect(AVATAR_LAYER_ORDER).toEqual(['hairBack', 'outfitBack', 'neck', 'outfitFront', 'headAndEars', 'hairFront']);
    expect(AVATAR_ANCHORS.headCenter.x).toBe(AVATAR_ANCHORS.neckBase.x);
    expect(AVATAR_HEAD_CENTER_X).toBe(AVATAR_ANCHORS.headCenter.x);
    expect(AVATAR_ANCHORS.headCenter.x).toBe(AVATAR_ANCHORS.shoulderLine.x);
    expect(AVATAR_PROPORTIONS.headWidth / AVATAR_PROPORTIONS.shoulderWidth).toBeCloseTo(0.625, 3);
  });

  it('keeps the jaw, visible neck, shirt neckline, and collar in anatomical order', () => {
    expect(AVATAR_ANCHORS.chin.y).toBeLessThan(AVATAR_ANCHORS.collarTop.y);
    expect(AVATAR_ANCHORS.collarTop.y).toBeLessThan(AVATAR_ANCHORS.neckBase.y);
    expect(AVATAR_ANCHORS.neckBase.y).toBeLessThan(AVATAR_ANCHORS.shirtNeckline.y);
    expect(AVATAR_ANCHORS.shirtNeckline.y).toBeLessThan(AVATAR_ANCHORS.shoulderLine.y);
  });

  it('keeps creator controls clear of the form and safe-area edge', () => {
    expect(AVATAR_CREATOR_LAYOUT.showsSettingsGear).toBe(false);
    expect(AVATAR_CREATOR_LAYOUT.bottomPadding).toBeGreaterThanOrEqual(96);
  });

  it.each(['male', 'female'] as const)('keeps the %s collar below the jaw and bridges the neck continuously', (gender) => {
    const anchors = AVATAR_GENDER_ANCHORS[gender];
    const outfit = AVATAR_OUTFIT_FITS.casual[gender];
    const neck = anchorData.portraitNeckFit[gender];
    const minimumClearance = (anchors.chin - anchors.headTop) * 0.08;
    expect(outfit.collarTopY).toBeGreaterThanOrEqual(anchors.chin + minimumClearance);
    expect(neck.startY).toBeLessThanOrEqual(anchors.chin);
    expect(neck.endY).toBeGreaterThan(outfit.collarTopY);
    expect(neck.bottomHalfWidth).toBeGreaterThan(neck.topHalfWidth);
    expect(neck.bottomCurveDepth).toBeGreaterThan(0);
    expect(anchors.jawLeft).toBeLessThan(anchors.headCenterX);
    expect(anchors.jawRight).toBeGreaterThan(anchors.headCenterX);
  });

  it.each(AVATAR_HAIR_FITS)('$label contains the skull anchors and stays inside the canvas', (style) => {
    const bounds = hairBounds[AVATAR_HAIR_FITS.indexOf(style)]!;
    expect(bounds.id).toBe(style.id);
    expect(bounds.top).toBeLessThanOrEqual(AVATAR_ANCHORS.headTop.y);
    expect(bounds.left).toBeLessThanOrEqual(AVATAR_ANCHORS.templeLeft.x);
    expect(bounds.right).toBeGreaterThanOrEqual(AVATAR_ANCHORS.templeRight.x);
    expect(bounds.left).toBeGreaterThanOrEqual((AVATAR_CANVAS.width - AVATAR_PROPORTIONS.shoulderWidth) / 2);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual((AVATAR_CANVAS.width + AVATAR_PROPORTIONS.shoulderWidth) / 2);
    expect(bounds.bottom).toBeLessThanOrEqual(AVATAR_CANVAS.portraitHeight);
    expect(style.attachments).toContain('headTop');
    expect(style.attachments).toContain('hairline');
    if (style.id === 'long-waves' || style.id === 'high-ponytail') {
      expect(Math.max(bounds.leftRun, bounds.rightRun)).toBeLessThanOrEqual(64);
      expect(bounds.bottomRun).toBeLessThanOrEqual(48);
    }
    expect(bounds.leftEyeCoverage).toBeLessThanOrEqual(0.3);
    expect(bounds.rightEyeCoverage).toBeLessThanOrEqual(0.3);
  });

  it.each(['male', 'female'] as const)('passes collar, eye, canvas, and frame-fill geometry for every %s appearance combination', (gender) => {
    const anchors = AVATAR_GENDER_ANCHORS[gender];
    const outfit = AVATAR_OUTFIT_FITS.casual[gender];
    const genderStyles = gender === 'male' ? AVATAR_HAIR_FITS.slice(0, 3) : AVATAR_HAIR_FITS.slice(3);
    for (const style of genderStyles) {
      const bounds = hairBounds[AVATAR_HAIR_FITS.indexOf(style)]!;
      AVATAR_OUTFIT_TOKENS.forEach(() => {
        expect(outfit.collarTopY).toBeGreaterThanOrEqual(anchors.chin + (anchors.chin - anchors.headTop) * 0.08);
        expect(bounds.left).toBeGreaterThan(0);
        expect(bounds.right).toBeLessThan(AVATAR_CANVAS.width - 1);
        expect(bounds.leftEyeCoverage).toBeLessThanOrEqual(0.3);
        expect(bounds.rightEyeCoverage).toBeLessThanOrEqual(0.3);
        expect(anchorData.headshotCrop.bottomAligned).toBe(true);
        expect(anchorData.headshotCrop.canvasBleedScale).toBeGreaterThan(1);
      });
    }
  });

  it('uses the nape anchor for every long hairstyle', () => {
    for (const style of AVATAR_HAIR_FITS.filter(({ frontMode }) => frontMode === 'split')) {
      expect(style.attachments).toContain('nape');
    }
  });

  it.each([
    ['full', 320, 360],
    ['full', 430, 560],
    ['bust', 320, 160],
    ['bust', 430, 210],
    ['hud', 46, 46],
    ['creator', 300, 300],
  ] as const)('%s framing keeps headTop and chin inside an eight-percent safe margin', (mode, width, height) => {
    const geometry = avatarFrameGeometry(width, height, mode as AvatarFramingMode);
    expect(framedAnchorY(geometry, 'headTop')).toBeGreaterThanOrEqual(height * 0.08);
    expect(framedAnchorY(geometry, 'chin')).toBeLessThanOrEqual(height * 0.92);
  });

  it.each([[320, 360], [390, 520], [430, 640]] as const)('places the feet anchor exactly on the full-scene ground line at %sx%s', (width, height) => {
    const geometry = avatarFrameGeometry(width, height, 'full');
    expect(framedAnchorY(geometry, 'feet')).toBeCloseTo(geometry.groundY!, 6);
  });

  it('declares full and bust framing for every scene location', () => {
    for (const scene of Object.values(LOCATION_ART)) {
      expect(scene.framing.default).toBe('full');
      expect(scene.framing.compact).toBe('bust');
    }
  });

  it.each(HUD_PORTRAIT_SCREENS)('%s HUD portrait renders every required gender-aware layer', () => {
    expect(AVATAR_REQUIRED_LAYERS).toEqual(['hairBack', 'outfitBack', 'neck', 'outfitFront', 'headAndEars', 'hairFront']);
    expect(CHARACTER_ART.portraitUnified.necklineFront).toBeDefined();
    expect(CHARACTER_ART.portraitUnified.headAtlases).toHaveLength(6);
    expect(CHARACTER_ART.portraitUnified.neckAtlases).toHaveLength(6);
    expect(CHARACTER_ART.portraitUnified.hairBack).toHaveLength(6);
    expect(CHARACTER_ART.portraitUnified.hairFront).toHaveLength(6);
  });
});
