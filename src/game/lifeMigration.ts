import { createInitialLifeState, LIFE_SAVE_VERSION, monthlyBillsFor, type LifePersistedState } from '../store/lifeStore';
import { COURSES } from '../data/courses';
import { normalizeHairstyleForGender, normalizeSkinTone } from '../data/avatarOptions';
import { JOB_SKILL_GROWTH } from '../data/jobs';
import { GAME_MONTH_SECONDS, MAX_PROMOTION_LEVEL } from './config';

export function migrateLifeSave(raw: unknown, now = Date.now()): LifePersistedState {
  const initial = createInitialLifeState(now);
  if (!raw || typeof raw !== 'object') return initial;
  const parsed = raw as Partial<LifePersistedState>;
  const legacyPartner = parsed.partner as (Partial<NonNullable<LifePersistedState['partner']>> & { age?: number }) | null | undefined;
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
    partner: legacyPartner ? {
      name: legacyPartner.name ?? 'Alex',
      birthMonth: legacyPartner.birthMonth ?? (parsed.gameMonth ?? initial.gameMonth) - (legacyPartner.age ?? parsed.age ?? initial.age) * 12,
      gender: legacyPartner.gender ?? 'non-binary',
      pronouns: legacyPartner.pronouns === 'she/her' || legacyPartner.pronouns === 'he/him' ? legacyPartner.pronouns : 'they/them',
      occupation: legacyPartner.occupation ?? 'Office assistant',
      personality: legacyPartner.personality ?? 'Kind and family-minded',
      avatarEmoji: legacyPartner.avatarEmoji ?? '🧑',
      jobIncome: legacyPartner.jobIncome ?? 2_200,
      stage: legacyPartner.stage ?? 'dating',
      affection: legacyPartner.affection ?? 42,
      happiness: legacyPartner.happiness ?? 70,
      monthsTogether: legacyPartner.monthsTogether ?? 0,
      stayAtHome: legacyPartner.stayAtHome ?? false,
      careMonths: legacyPartner.careMonths && typeof legacyPartner.careMonths === 'object' ? legacyPartner.careMonths : {},
    } : null,
    settings: { ...initial.settings, ...(parsed.settings ?? {}) },
    wellnessActionMonths: parsed.wellnessActionMonths && typeof parsed.wellnessActionMonths === 'object' ? parsed.wellnessActionMonths : {},
    activeCourse: parsed.activeCourse ? (() => {
      const legacy = parsed.activeCourse as typeof parsed.activeCourse & { endsAt?: number; studyProgress?: number; enrolledMonth?: number; activeProgress?: number };
      const course = COURSES.find((item) => item.id === legacy.courseId);
      const inferredRemainingMonths = course && legacy.endsAt
        ? Math.max(0, Math.ceil((legacy.endsAt - now) / (GAME_MONTH_SECONDS * 1_000)))
        : course?.durationMonths ?? 0;
      const inferredCompleted = course ? Math.max(0, course.durationMonths - inferredRemainingMonths) : 0;
      return {
        courseId: legacy.courseId,
        enrolledMonth: legacy.enrolledMonth ?? Math.max(0, (parsed.gameMonth ?? 0) - inferredCompleted),
        activeProgress: Math.min(50, Math.max(0, legacy.activeProgress ?? legacy.studyProgress ?? 0)),
        examReady: legacy.examReady ?? false,
        examAttempts: legacy.examAttempts ?? 0,
      };
    })() : null,
    jobExperienceMonths: parsed.jobExperienceMonths && typeof parsed.jobExperienceMonths === 'object' ? parsed.jobExperienceMonths : {},
    jobSkillMilestones: parsed.jobSkillMilestones && typeof parsed.jobSkillMilestones === 'object' ? parsed.jobSkillMilestones : {},
    timeSpeed: parsed.timeSpeed === 0 || parsed.timeSpeed === 2 || parsed.timeSpeed === 4 ? parsed.timeSpeed : 1,
    monthlyBudgets: Array.isArray(parsed.monthlyBudgets) ? parsed.monthlyBudgets : [],
    children: Array.isArray(parsed.children) ? parsed.children : [],
    loans: Array.isArray(parsed.loans) ? parsed.loans : [],
    ownedLifestyle: Array.isArray(parsed.ownedLifestyle) ? parsed.ownedLifestyle : [],
    ownedGoods: Array.isArray(parsed.ownedGoods) ? parsed.ownedGoods : [],
  };
  if ((parsed.saveVersion ?? 0) < 13) {
    const reconciledMilestones = { ...migrated.jobSkillMilestones };
    const reconciledSkills = { ...migrated.skills };
    for (const [jobId, monthsRaw] of Object.entries(migrated.jobExperienceMonths)) {
      const growth = JOB_SKILL_GROWTH[jobId];
      if (!growth) continue;
      const completedMonths = Math.max(0, Math.floor(typeof monthsRaw === 'number' ? monthsRaw : 0));
      const earnedMilestones = Math.floor(completedMonths / growth.intervalMonths);
      const existingMilestones = Math.max(0, reconciledMilestones[jobId] ?? 0);
      if (earnedMilestones <= existingMilestones) continue;
      const pendingMilestones = earnedMilestones - existingMilestones;
      for (const [skill, amount] of Object.entries(growth.rewards) as [keyof typeof reconciledSkills, number][]) {
        reconciledSkills[skill] += amount * pendingMilestones;
      }
      reconciledMilestones[jobId] = earnedMilestones;
    }
    migrated.skills = reconciledSkills;
    migrated.jobSkillMilestones = reconciledMilestones;
  }
  const monthlyBills = monthlyBillsFor({ ...migrated, lateFees: 0 }).total;
  migrated.lateFees = Math.min(Math.max(0, migrated.lateFees), monthlyBills * 2);
  return migrated;
}
