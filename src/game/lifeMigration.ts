import { createInitialLifeState, LIFE_SAVE_VERSION, monthlyBillsFor, type LifePersistedState } from '../store/lifeStore';
import { normalizeHairstyleForGender, normalizeSkinTone } from '../data/avatarOptions';
import { GAME_MONTH_SECONDS, MAX_PROMOTION_LEVEL } from './config';

export function migrateLifeSave(raw: unknown, now = Date.now()): LifePersistedState {
  const initial = createInitialLifeState(now);
  if (!raw || typeof raw !== 'object') return initial;
  const parsed = raw as Partial<LifePersistedState>;
  const character = { ...initial.character, ...(parsed.character ?? {}), avatar: { ...initial.character.avatar, ...(parsed.character?.avatar ?? {}) } };
  character.avatar = {
    ...character.avatar,
    hairStyle: normalizeHairstyleForGender(character.avatar.hairStyle, character.gender),
    skin: normalizeSkinTone(character.avatar.skin),
  };
  const migrated: LifePersistedState = {
    ...initial,
    ...parsed,
    saveVersion: LIFE_SAVE_VERSION,
    monthLengthSeconds: GAME_MONTH_SECONDS,
    promotionLevel: Math.max(0, Math.min(MAX_PROMOTION_LEVEL, parsed.promotionLevel ?? initial.promotionLevel)),
    performance: Math.max(0, Math.min(100, parsed.performance ?? initial.performance)),
    lastSeenTimestamp: parsed.lastSeenTimestamp ?? parsed.lastSavedAt ?? initial.lastSeenTimestamp,
    character,
    housing: { ...initial.housing, ...(parsed.housing ?? {}) },
    vehicle: { ...initial.vehicle, ...(parsed.vehicle ?? {}) },
    datingCandidate: parsed.datingCandidate ?? null,
    partner: parsed.partner ? {
      name: parsed.partner.name ?? 'Alex',
      age: parsed.partner.age ?? parsed.age ?? initial.age,
      gender: parsed.partner.gender ?? 'non-binary',
      pronouns: parsed.partner.pronouns === 'she/her' || parsed.partner.pronouns === 'he/him' ? parsed.partner.pronouns : 'they/them',
      occupation: parsed.partner.occupation ?? 'Office assistant',
      personality: parsed.partner.personality ?? 'Kind and family-minded',
      avatarEmoji: parsed.partner.avatarEmoji ?? '🧑',
      jobIncome: parsed.partner.jobIncome ?? 2_200,
      stage: parsed.partner.stage ?? 'dating',
      affection: parsed.partner.affection ?? 42,
      monthsTogether: parsed.partner.monthsTogether ?? 0,
      stayAtHome: parsed.partner.stayAtHome ?? false,
    } : null,
    settings: { ...initial.settings, ...(parsed.settings ?? {}) },
    wellnessActionMonths: parsed.wellnessActionMonths && typeof parsed.wellnessActionMonths === 'object' ? parsed.wellnessActionMonths : {},
    activeCourse: parsed.activeCourse ? { courseId: parsed.activeCourse.courseId, endsAt: parsed.activeCourse.endsAt, studyProgress: parsed.activeCourse.studyProgress ?? 10, examReady: parsed.activeCourse.examReady ?? false, examAttempts: parsed.activeCourse.examAttempts ?? 0 } : null,
    jobExperienceMonths: parsed.jobExperienceMonths && typeof parsed.jobExperienceMonths === 'object' ? parsed.jobExperienceMonths : {},
    timeSpeed: parsed.timeSpeed === 0 || parsed.timeSpeed === 2 || parsed.timeSpeed === 4 ? parsed.timeSpeed : 1,
    monthlyBudgets: Array.isArray(parsed.monthlyBudgets) ? parsed.monthlyBudgets : [],
    children: Array.isArray(parsed.children) ? parsed.children : [],
    loans: Array.isArray(parsed.loans) ? parsed.loans : [],
    ownedLifestyle: Array.isArray(parsed.ownedLifestyle) ? parsed.ownedLifestyle : [],
    ownedGoods: Array.isArray(parsed.ownedGoods) ? parsed.ownedGoods : [],
  };
  const monthlyBills = monthlyBillsFor({ ...migrated, lateFees: 0 }).total;
  migrated.lateFees = Math.min(Math.max(0, migrated.lateFees), monthlyBills * 2);
  return migrated;
}
