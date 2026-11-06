import { examSuccessChance, interviewSuccessChance, studyGain } from '../education';
import { COURSES } from '../../data/courses';
import { GAME_MONTH_SECONDS } from '../config';

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
