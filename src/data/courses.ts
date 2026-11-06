import { GAME_MONTH_SECONDS } from '../game/config';

export type SkillName = 'intelligence' | 'business' | 'finance' | 'tech' | 'charisma';
export type CourseDifficulty = 1 | 2 | 3 | 4 | 5;

export type CourseDefinition = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  monthlyTuition: number;
  retakeFee: number;
  difficulty: CourseDifficulty;
  durationMonths: number;
  durationSeconds: number;
  rewards: Partial<Record<SkillName, number>>;
  prerequisite?: string;
  living: { housingStatus: number; foodLevel: number; vehicleStatus: number };
};

type CourseInput = Omit<CourseDefinition, 'durationSeconds'>;

function defineCourse(course: CourseInput): CourseDefinition {
  return { ...course, durationSeconds: course.durationMonths * GAME_MONTH_SECONDS };
}

export const COURSES: CourseDefinition[] = [
  defineCourse({ id: 'highSchool', name: 'High School Diploma', emoji: '🎓', cost: 50, monthlyTuition: 0, retakeFee: 20, difficulty: 1, durationMonths: 3, rewards: { intelligence: 3, charisma: 1 }, living: { housingStatus: 2, foodLevel: 1, vehicleStatus: 0 } }),
  defineCourse({ id: 'language', name: 'Language Course', emoji: '🗣️', cost: 250, monthlyTuition: 70, retakeFee: 50, difficulty: 1, durationMonths: 4, rewards: { intelligence: 2, charisma: 4 }, living: { housingStatus: 2, foodLevel: 1, vehicleStatus: 2 } }),
  defineCourse({ id: 'coding', name: 'Coding Bootcamp', emoji: '💻', cost: 1_500, monthlyTuition: 100, retakeFee: 250, difficulty: 2, durationMonths: 8, rewards: { intelligence: 4, tech: 8 }, prerequisite: 'highSchool', living: { housingStatus: 6, foodLevel: 2, vehicleStatus: 2 } }),
  defineCourse({ id: 'businessDegree', name: 'Business Degree', emoji: '📊', cost: 8_000, monthlyTuition: 900, retakeFee: 600, difficulty: 3, durationMonths: 12, rewards: { intelligence: 5, business: 10, charisma: 3 }, prerequisite: 'highSchool', living: { housingStatus: 6, foodLevel: 2, vehicleStatus: 5 } }),
  defineCourse({ id: 'financeDegree', name: 'Finance Degree', emoji: '📈', cost: 12_000, monthlyTuition: 1_200, retakeFee: 800, difficulty: 3, durationMonths: 15, rewards: { intelligence: 6, finance: 12 }, prerequisite: 'highSchool', living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 5 } }),
  defineCourse({ id: 'law', name: 'Law School', emoji: '⚖️', cost: 35_000, monthlyTuition: 2_400, retakeFee: 1_600, difficulty: 4, durationMonths: 18, rewards: { intelligence: 12, charisma: 10 }, prerequisite: 'highSchool', living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 12 } }),
  defineCourse({ id: 'medical', name: 'Medical School', emoji: '🩺', cost: 45_000, monthlyTuition: 3_000, retakeFee: 2_000, difficulty: 5, durationMonths: 24, rewards: { intelligence: 18, charisma: 4 }, prerequisite: 'highSchool', living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 12 } }),
  defineCourse({ id: 'mba', name: 'MBA', emoji: '🏛️', cost: 120_000, monthlyTuition: 6_000, retakeFee: 4_000, difficulty: 5, durationMonths: 24, rewards: { business: 18, finance: 10, charisma: 8 }, prerequisite: 'businessDegree', living: { housingStatus: 24, foodLevel: 3, vehicleStatus: 22 } }),
];
