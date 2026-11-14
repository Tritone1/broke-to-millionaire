import { migrateLifeSave } from '../lifeMigration';
import { LIFE_SAVE_VERSION, partnerAgeAtMonth } from '../../store/lifeStore';
import { GAME_MONTH_SECONDS, MAX_PROMOTION_LEVEL } from '../config';
import { SKIN_TONES } from '../../data/artManifest';

describe('life save migration', () => {
  it('upgrades an old save, preserves its last-seen time, and supplies new defaults', () => {
    const migrated = migrateLifeSave({ saveVersion: 3, age: 42, totalPlaySeconds: 12_345, lastSavedAt: 777, settings: { sound: false }, promotionLevel: 99, performance: 999 }, 1_000);
    expect(migrated.saveVersion).toBe(LIFE_SAVE_VERSION);
    expect(migrated.age).toBe(42);
    expect(migrated.totalPlaySeconds).toBe(12_345);
    expect(migrated.lastSeenTimestamp).toBe(777);
    expect(migrated.character.name).toBe('Player');
    expect(migrated.housing.id).toBe('homeless');
    expect(migrated.vehicle.id).toBe('walk');
    expect(migrated.foodPlanId).toBe('survival');
    expect(migrated.character.ethnicity).toBe('european');
    expect(migrated.children).toEqual([]);
    expect(migrated.settings).toEqual({ sound: false, haptics: true, language: 'en', languageChosen: false });
    expect(migrated.monthLengthSeconds).toBe(GAME_MONTH_SECONDS);
    expect(migrated.promotionLevel).toBe(MAX_PROMOTION_LEVEL);
    expect(migrated.performance).toBe(100);
    expect(migrated.wellnessActionMonths).toEqual({});
    expect(migrated.ownedGoods).toEqual([]);
    expect(migrated.datingCandidate).toBeNull();
  });

  it('preserves the complete selected appearance when a saved character reloads', () => {
    const migrated = migrateLifeSave({
      saveVersion: 4,
      lastSeenTimestamp: 888,
      character: {
        name: 'Mina',
        gender: 'female',
        pronouns: 'she/her',
        ethnicity: 'middle-eastern',
        avatar: { skin: '#4B2A23', hairStyle: 5, hairColor: '#fff' },
      },
    }, 1_000);
    expect(migrated.character.name).toBe('Mina');
    expect(migrated.character.gender).toBe('female');
    expect(migrated.character.ethnicity).toBe('middle-eastern');
    expect(migrated.character.avatar.skin).toBe('#4B2A23');
    expect(migrated.character.avatar.hairStyle).toBe(5);
    expect(migrated.character.avatar.hairColor).toBe('#fff');
    expect(migrated.lastSeenTimestamp).toBe(888);
  });

  it('normalizes legacy cross-gender hair and invalid skin without losing identity', () => {
    const female = migrateLifeSave({ character: { name: 'Mina', gender: 'female', ethnicity: 'east-asian', avatar: { hairStyle: 0, skin: '#BAD' } } }, 1_000);
    const male = migrateLifeSave({ character: { name: 'Noah', gender: 'male', ethnicity: 'african', avatar: { hairStyle: 5 } } }, 1_000);

    expect(female.character.name).toBe('Mina');
    expect(female.character.ethnicity).toBe('east-asian');
    expect(female.character.avatar.hairStyle).toBe(3);
    expect(female.character.avatar.skin).toBe(SKIN_TONES[2]);
    expect(male.character.avatar.hairStyle).toBe(0);
  });

  it('migrates a fixed partner age to a birth month that advances with the calendar', () => {
    const migrated = migrateLifeSave({
      saveVersion: 13,
      gameMonth: 48,
      partner: { name: 'Sam', age: 24, gender: 'non-binary', pronouns: 'they/them', occupation: 'Teacher', personality: 'Kind', avatarEmoji: '🧑', jobIncome: 2_200, stage: 'married', affection: 80, monthsTogether: 12, stayAtHome: false },
    }, 1_000);

    expect(partnerAgeAtMonth(migrated.partner!, 48)).toBe(24);
    expect(partnerAgeAtMonth(migrated.partner!, 60)).toBe(25);
    expect(migrated.partner?.happiness).toBe(70);
    expect(migrated.partner?.careMonths).toEqual({});
  });

  it('migrates legacy timer-based course progress without losing active study', () => {
    const now = 1_000_000;
    const migrated = migrateLifeSave({
      saveVersion: 14,
      gameMonth: 20,
      activeCourse: {
        courseId: 'coding',
        endsAt: now + 4 * GAME_MONTH_SECONDS * 1_000,
        studyProgress: 65,
        examReady: true,
        examAttempts: 2,
      },
    }, now);
    expect(migrated.activeCourse).toEqual({
      courseId: 'coding',
      enrolledMonth: 16,
      activeProgress: 50,
      examReady: true,
      examAttempts: 2,
    });
  });
});
