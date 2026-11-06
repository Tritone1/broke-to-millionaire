import type { SkillName } from './courses';

export type JobDefinition = {
  id: string;
  title: string;
  emoji: string;
  track: 'general' | 'technology' | 'finance' | 'professional';
  rank: number;
  salaryPerSecond: number;
  hardWorkBonus: number;
  requiredCourses?: string[];
  requiredSkills?: Partial<Record<SkillName, number>>;
  requiredExperience?: { jobId: string; months: number; label: string }[];
  living: { housingStatus: number; foodLevel: number; vehicleStatus: number };
};

export type JobSkillGrowth = {
  intervalMonths: 6 | 9 | 12;
  rewards: Partial<Record<SkillName, number>>;
  caps: Partial<Record<SkillName, number>>;
};

export const JOBS: JobDefinition[] = [
  { id: 'courier', title: 'Delivery Courier', emoji: '🛵', track: 'general', rank: 1, salaryPerSecond: 7.5, hardWorkBonus: 18, living: { housingStatus: 0, foodLevel: 0, vehicleStatus: 0 } },
  { id: 'cashier', title: 'Cashier', emoji: '🧾', track: 'general', rank: 2, salaryPerSecond: 10, hardWorkBonus: 23, requiredCourses: ['highSchool'], living: { housingStatus: 2, foodLevel: 1, vehicleStatus: 0 } },
  { id: 'barista', title: 'Barista', emoji: '☕', track: 'general', rank: 2, salaryPerSecond: 12.5, hardWorkBonus: 28, requiredSkills: { charisma: 2 }, living: { housingStatus: 2, foodLevel: 1, vehicleStatus: 2 } },

  { id: 'juniorDev', title: 'Junior Developer', emoji: '⌨️', track: 'technology', rank: 1, salaryPerSecond: 25, hardWorkBonus: 60, requiredCourses: ['coding'], requiredSkills: { tech: 6 }, living: { housingStatus: 6, foodLevel: 2, vehicleStatus: 2 } },
  { id: 'softwareEngineer', title: 'Mid-Level Developer', emoji: '💻', track: 'technology', rank: 2, salaryPerSecond: 45, hardWorkBonus: 105, requiredCourses: ['coding'], requiredSkills: { tech: 12, intelligence: 6 }, requiredExperience: [{ jobId: 'juniorDev', months: 6, label: 'Junior Developer experience' }], living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 5 } },
  { id: 'seniorDev', title: 'Senior Developer', emoji: '🧑‍💻', track: 'technology', rank: 3, salaryPerSecond: 75, hardWorkBonus: 180, requiredCourses: ['coding'], requiredSkills: { tech: 18, intelligence: 10 }, requiredExperience: [{ jobId: 'softwareEngineer', months: 12, label: 'Mid-Level Developer experience' }], living: { housingStatus: 24, foodLevel: 2, vehicleStatus: 12 } },
  { id: 'techLead', title: 'Technology Team Lead', emoji: '🧑‍🚀', track: 'technology', rank: 4, salaryPerSecond: 125, hardWorkBonus: 300, requiredCourses: ['coding'], requiredSkills: { tech: 24, intelligence: 14, business: 8, charisma: 6 }, requiredExperience: [{ jobId: 'seniorDev', months: 12, label: 'Senior Developer experience' }], living: { housingStatus: 36, foodLevel: 3, vehicleStatus: 22 } },

  { id: 'accountant', title: 'Junior Accountant', emoji: '🧮', track: 'finance', rank: 1, salaryPerSecond: 35, hardWorkBonus: 85, requiredCourses: ['financeDegree'], requiredSkills: { finance: 8 }, living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 5 } },
  { id: 'financeAssociate', title: 'Financial Analyst', emoji: '📊', track: 'finance', rank: 2, salaryPerSecond: 50, hardWorkBonus: 120, requiredCourses: ['financeDegree'], requiredSkills: { finance: 12, intelligence: 6 }, requiredExperience: [{ jobId: 'accountant', months: 6, label: 'Junior Accountant experience' }], living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 5 } },
  { id: 'analyst', title: 'Senior Financial Analyst', emoji: '🔎', track: 'finance', rank: 3, salaryPerSecond: 80, hardWorkBonus: 200, requiredCourses: ['financeDegree'], requiredSkills: { finance: 16, intelligence: 8 }, requiredExperience: [{ jobId: 'financeAssociate', months: 6, label: 'Financial Analyst experience' }], living: { housingStatus: 24, foodLevel: 2, vehicleStatus: 12 } },
  { id: 'financeManager', title: 'Finance Manager', emoji: '📈', track: 'finance', rank: 4, salaryPerSecond: 125, hardWorkBonus: 310, requiredCourses: ['financeDegree', 'businessDegree'], requiredSkills: { finance: 20, business: 10, charisma: 6 }, requiredExperience: [{ jobId: 'analyst', months: 12, label: 'Senior Financial Analyst experience' }], living: { housingStatus: 36, foodLevel: 3, vehicleStatus: 22 } },
  { id: 'cfo', title: 'Chief Financial Officer', emoji: '💹', track: 'finance', rank: 5, salaryPerSecond: 375, hardWorkBonus: 1_000, requiredCourses: ['mba', 'financeDegree'], requiredSkills: { finance: 22, business: 18 }, requiredExperience: [{ jobId: 'financeManager', months: 12, label: 'Finance Manager experience' }], living: { housingStatus: 48, foodLevel: 3, vehicleStatus: 22 } },

  { id: 'salesManager', title: 'Sales Manager', emoji: '🤝', track: 'professional', rank: 2, salaryPerSecond: 50, hardWorkBonus: 120, requiredCourses: ['businessDegree'], requiredSkills: { charisma: 7 }, living: { housingStatus: 14, foodLevel: 2, vehicleStatus: 5 } },
  { id: 'doctor', title: 'Doctor', emoji: '👩‍⚕️', track: 'professional', rank: 3, salaryPerSecond: 117.5, hardWorkBonus: 300, requiredCourses: ['medical'], requiredSkills: { intelligence: 16 }, living: { housingStatus: 24, foodLevel: 2, vehicleStatus: 12 } },
  { id: 'lawyer', title: 'Lawyer', emoji: '👨‍⚖️', track: 'professional', rank: 3, salaryPerSecond: 135, hardWorkBonus: 350, requiredCourses: ['law'], requiredSkills: { charisma: 10 }, living: { housingStatus: 24, foodLevel: 2, vehicleStatus: 12 } },
  { id: 'ceo', title: 'Chief Executive Officer', emoji: '👑', track: 'professional', rank: 5, salaryPerSecond: 750, hardWorkBonus: 2_000, requiredCourses: ['mba'], requiredSkills: { business: 25, charisma: 18 }, requiredExperience: [{ jobId: 'salesManager', months: 12, label: 'Sales Manager experience' }], living: { housingStatus: 48, foodLevel: 3, vehicleStatus: 48 } },
];

export function jobById(id: string | null): JobDefinition | undefined {
  return JOBS.find((job) => job.id === id);
}

export const JOB_SKILL_GROWTH: Record<string, JobSkillGrowth> = {
  courier: { intervalMonths: 12, rewards: { charisma: 1 }, caps: { charisma: 3 } },
  cashier: { intervalMonths: 12, rewards: { business: 1, charisma: 1 }, caps: { business: 5, charisma: 6 } },
  barista: { intervalMonths: 12, rewards: { business: 1, charisma: 1 }, caps: { business: 5, charisma: 7 } },
  juniorDev: { intervalMonths: 6, rewards: { tech: 4, intelligence: 1 }, caps: { tech: 12, intelligence: 8 } },
  softwareEngineer: { intervalMonths: 6, rewards: { tech: 3, intelligence: 1 }, caps: { tech: 18, intelligence: 10 } },
  seniorDev: { intervalMonths: 6, rewards: { tech: 3, intelligence: 2, business: 4, charisma: 3 }, caps: { tech: 24, intelligence: 14, business: 8, charisma: 6 } },
  techLead: { intervalMonths: 12, rewards: { tech: 2, business: 2, charisma: 2 }, caps: { tech: 32, business: 16, charisma: 12 } },
  accountant: { intervalMonths: 6, rewards: { finance: 2, intelligence: 1 }, caps: { finance: 16, intelligence: 8 } },
  financeAssociate: { intervalMonths: 6, rewards: { finance: 2, intelligence: 1 }, caps: { finance: 20, intelligence: 10 } },
  analyst: { intervalMonths: 6, rewards: { finance: 2, business: 2, charisma: 1 }, caps: { finance: 22, business: 10, charisma: 6 } },
  financeManager: { intervalMonths: 12, rewards: { finance: 4, business: 4, charisma: 2 }, caps: { finance: 28, business: 18, charisma: 12 } },
  cfo: { intervalMonths: 12, rewards: { finance: 2, business: 2, charisma: 2 }, caps: { finance: 36, business: 30, charisma: 18 } },
  salesManager: { intervalMonths: 6, rewards: { business: 2, charisma: 3 }, caps: { business: 25, charisma: 18 } },
  doctor: { intervalMonths: 12, rewards: { intelligence: 2, charisma: 1 }, caps: { intelligence: 30, charisma: 12 } },
  lawyer: { intervalMonths: 12, rewards: { business: 2, charisma: 2 }, caps: { business: 18, charisma: 24 } },
  ceo: { intervalMonths: 12, rewards: { business: 2, finance: 2, charisma: 2 }, caps: { business: 40, finance: 30, charisma: 30 } },
};

export function skillsAfterJobMonth<T extends Record<SkillName, number>>(skills: T, jobId: string | null, completedMonths: number): T {
  const growth = jobId ? JOB_SKILL_GROWTH[jobId] : undefined;
  if (!growth || completedMonths <= 0 || completedMonths % growth.intervalMonths !== 0) return skills;
  const next = { ...skills };
  for (const [skill, amount] of Object.entries(growth.rewards) as [SkillName, number][]) {
    next[skill] = Math.min(growth.caps[skill] ?? Number.POSITIVE_INFINITY, next[skill] + amount);
  }
  return next;
}

export function jobSkillGrowthLabel(jobId: string): string {
  const growth = JOB_SKILL_GROWTH[jobId];
  if (!growth) return 'No experience skill growth';
  const rewards = (Object.entries(growth.rewards) as [SkillName, number][]).map(([skill, amount]) => `+${amount} ${skill.toUpperCase()}`).join(' · ');
  return `Every ${growth.intervalMonths} months: ${rewards}`;
}
