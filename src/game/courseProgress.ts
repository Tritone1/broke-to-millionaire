import type { CourseDefinition } from '../data/courses';

export type ActiveCourseProgress = {
  courseId: string;
  enrolledMonth: number;
  activeProgress: number;
  examReady: boolean;
  examAttempts: number;
};

export type CourseProgressBreakdown = {
  monthsCompleted: number;
  monthsRemaining: number;
  passiveProgress: number;
  activeProgress: number;
  totalProgress: number;
  durationComplete: boolean;
  readyToGraduate: boolean;
};

export const ACTIVE_STUDY_CAP = 50;
export const PASSIVE_STUDY_CAP = 50;
export const STUDY_SESSION_ENERGY = 8;
export const STUDY_SESSION_HOURS = 2;

export function courseProgress(
  active: ActiveCourseProgress,
  course: Pick<CourseDefinition, 'durationMonths'>,
  gameMonth: number,
): CourseProgressBreakdown {
  const duration = Math.max(1, Math.floor(course.durationMonths));
  const monthsCompleted = Math.min(duration, Math.max(0, Math.floor(gameMonth - active.enrolledMonth)));
  const passiveProgress = Math.min(PASSIVE_STUDY_CAP, monthsCompleted * PASSIVE_STUDY_CAP / duration);
  const activeProgress = Math.min(ACTIVE_STUDY_CAP, Math.max(0, active.activeProgress));
  const totalProgress = Math.min(100, passiveProgress + activeProgress);
  const durationComplete = monthsCompleted >= duration;
  return {
    monthsCompleted,
    monthsRemaining: Math.max(0, duration - monthsCompleted),
    passiveProgress,
    activeProgress,
    totalProgress,
    durationComplete,
    readyToGraduate: durationComplete && totalProgress >= 100,
  };
}

export function activeStudyGain(intelligence: number, energy: number, sessionHours = STUDY_SESSION_HOURS): number {
  const focus = Math.max(0.5, sessionHours) * 2 + Math.max(0, intelligence) * 0.08 + Math.max(0, energy - 20) * 0.0125;
  return Math.max(3, Math.min(8, Number(focus.toFixed(2))));
}
