import { examSuccessChance, interviewSuccessChance, studyGain } from '../education';
import { COURSES } from '../../data/courses';
import { GAME_MONTH_SECONDS } from '../config';
import { ACTIVE_STUDY_CAP, activeStudyGain, courseProgress, STUDY_SESSION_HOURS } from '../courseProgress';

describe('education and interview formulas', () => {
  it('rewards preparation while keeping exam odds bounded', () => {
    expect(examSuccessChance({ intelligence: 2, studyProgress: 15, health: 40, happiness: 40, attempts: 0 }))
      .toBeLessThan(examSuccessChance({ intelligence: 12, studyProgress: 100, health: 90, happiness: 90, attempts: 1 }));
    expect(examSuccessChance({ intelligence: 100, studyProgress: 100, health: 100, happiness: 100, attempts: 9 })).toBe(0.95);
  });

  it('scales study and interview outcomes', () => {
    expect(studyGain(10, 80)).toBeGreaterThan(studyGain(1, 20));
    expect(interviewSuccessChance(10, 10, 12)).toBeGreaterThan(interviewSuccessChance(0, 0, 0));
  });

  it('derives longer study periods from course difficulty in game months', () => {
    for (const course of COURSES) {
      expect(course.durationSeconds).toBe(course.durationMonths * GAME_MONTH_SECONDS);
      expect(course.durationMonths).toBeGreaterThanOrEqual(3);
    }
    for (let index = 1; index < COURSES.length; index += 1) {
      const previous = COURSES[index - 1]!;
      const current = COURSES[index]!;
      expect(current.difficulty).toBeGreaterThanOrEqual(previous.difficulty);
      expect(current.durationMonths).toBeGreaterThanOrEqual(previous.durationMonths);
    }
  });
});

describe('monthly course progress', () => {
  const course = { durationMonths: 24 };
  const enrolled = { courseId: 'test', enrolledMonth: 10, activeProgress: 0, examReady: false, examAttempts: 0 };

  it('derives passive preparation from elapsed game months exactly once', () => {
    expect(courseProgress(enrolled, course, 11).passiveProgress).toBeCloseTo(2.083333, 5);
    expect(courseProgress(enrolled, course, 16).passiveProgress).toBeCloseTo(12.5, 5);
    expect(courseProgress(enrolled, course, 22).passiveProgress).toBeCloseTo(25, 5);
    expect(courseProgress(enrolled, course, 34).passiveProgress).toBe(50);
    expect(courseProgress(enrolled, course, 34).passiveProgress).toBe(50);
  });

  it('caps passive and active preparation independently at 50%', () => {
    const overPrepared = { ...enrolled, activeProgress: 500 };
    const progress = courseProgress(overPrepared, course, 100);
    expect(progress.passiveProgress).toBe(50);
    expect(progress.activeProgress).toBe(ACTIVE_STUDY_CAP);
    expect(progress.totalProgress).toBe(100);
  });

  it('never allows early graduation from repeated active study', () => {
    const fullyStudied = { ...enrolled, activeProgress: 50 };
    expect(courseProgress(fullyStudied, course, 33).totalProgress).toBeCloseTo(97.916667, 5);
    expect(courseProgress(fullyStudied, course, 33).readyToGraduate).toBe(false);
    expect(courseProgress(fullyStudied, course, 34).readyToGraduate).toBe(true);
  });

  it('keeps active gains balanced and requires sufficient energy in the store layer', () => {
    expect(activeStudyGain(0, 8)).toBeGreaterThanOrEqual(3);
    expect(activeStudyGain(100, 100)).toBeLessThanOrEqual(8);
    expect(activeStudyGain(5, 60, STUDY_SESSION_HOURS)).toBeGreaterThan(activeStudyGain(5, 60, 1));
  });
});
