import { createDatingCandidate } from '../../data/dating';
import { CONSUMER_GOODS } from '../../data/goods';
import { JOBS, JOB_SKILL_GROWTH, jobById } from '../../data/jobs';
import { COURSES, type SkillName } from '../../data/courses';
import { HOUSING, VEHICLES } from '../../data/living';
import { LIFE_EVENTS } from '../../data/lifeEvents';
import { big, toNumber } from '../BigNumber';
import { estimatedLifespanYears } from '../wellness';
import { calculateLifeNetWorth, createInitialLifeState, jobRequirementsMet, processGameMonth, useLifeStore, type LifePersistedState } from '../../store/lifeStore';

describe('expanded career ladders', () => {
  it('provides ordered technology and finance roles with rising salaries', () => {
    const technologyIds = ['juniorDev', 'softwareEngineer', 'seniorDev', 'techLead'];
    const financeIds = ['accountant', 'financeAssociate', 'analyst', 'financeManager', 'cfo'];
    for (const ids of [technologyIds, financeIds]) {
      const roles = ids.map((id) => jobById(id));
      expect(roles.every(Boolean)).toBe(true);
      expect(roles.map((role) => role?.rank)).toEqual(ids.map((_, index) => index + 1));
      for (let index = 1; index < roles.length; index += 1) {
        expect(roles[index]!.salaryPerSecond).toBeGreaterThan(roles[index - 1]!.salaryPerSecond);
        expect(roles[index]!.requiredExperience?.length).toBeGreaterThan(0);
      }
    }
    expect(new Set(JOBS.map((job) => job.id)).size).toBe(JOBS.length);
  });

  it('blocks a mid-level developer until junior experience is earned', () => {
    const base = createInitialLifeState();
    const qualified = {
      ...base,
      completedCourses: ['coding'],
      skills: { ...base.skills, tech: 12, intelligence: 6 },
      housing: { ...base.housing, id: 'apartment', tenure: 'rent' as const },
      vehicle: { ...base.vehicle, id: 'used', tenure: 'owned' as const },
      foodPlanId: 'balanced',
    };
    expect(jobRequirementsMet(qualified, 'softwareEngineer')).toBe(false);
    expect(jobRequirementsMet({ ...qualified, jobExperienceMonths: { juniorDev: 5 } }, 'softwareEngineer')).toBe(false);
    expect(jobRequirementsMet({ ...qualified, jobExperienceMonths: { juniorDev: 6 } }, 'softwareEngineer')).toBe(true);
  });

  it('turns junior developer experience into the Tech skill needed for the next role', () => {
    const base = createInitialLifeState();
    let state: LifePersistedState = {
      ...base,
      money: big(20_000),
      accruedMonthlyIncome: big(1_500),
      jobId: 'juniorDev',
      completedCourses: ['highSchool', 'coding'],
      skills: { ...base.skills, intelligence: 7, tech: 8 },
      housing: { ...base.housing, id: 'apartment', tenure: 'rent' },
      vehicle: { ...base.vehicle, id: 'used', tenure: 'owned' },
      foodPlanId: 'balanced',
    };
    for (let month = 0; month < 5; month += 1) {
      const before = { ...state, accruedMonthlyIncome: big(1_500) };
      state = { ...before, ...processGameMonth(before) };
    }
    expect(state.skills.tech).toBe(8);
    expect(state.skills.intelligence).toBe(7);
    expect(jobRequirementsMet(state, 'softwareEngineer')).toBe(false);
    const sixthMonth = { ...state, accruedMonthlyIncome: big(1_500) };
    state = { ...sixthMonth, ...processGameMonth(sixthMonth) };
    expect(state.skills.tech).toBe(12);
    expect(state.skills.intelligence).toBe(8);
    expect(state.jobExperienceMonths.juniorDev).toBe(6);
    expect(jobRequirementsMet(state, 'softwareEngineer')).toBe(true);
  });

  it('keeps every job-learning checkpoint between six months and one year', () => {
    for (const growth of Object.values(JOB_SKILL_GROWTH)) {
      expect(growth.intervalMonths).toBeGreaterThanOrEqual(6);
      expect(growth.intervalMonths).toBeLessThanOrEqual(12);
    }
  });

  it('has a course or paid-job route to every required job skill', () => {
    const courseMaximums = COURSES.reduce<Record<SkillName, number>>((totals, course) => {
      for (const [skill, amount] of Object.entries(course.rewards) as [SkillName, number][]) totals[skill] += amount;
      return totals;
    }, { intelligence: 0, business: 0, finance: 0, tech: 0, charisma: 0 });
    const careerMaximums = Object.values(JOB_SKILL_GROWTH).reduce<Record<SkillName, number>>((totals, growth) => {
      for (const [skill, cap] of Object.entries(growth.caps) as [SkillName, number][]) totals[skill] = Math.max(totals[skill], cap);
      return totals;
    }, { intelligence: 0, business: 0, finance: 0, tech: 0, charisma: 0 });
    for (const job of JOBS) {
      for (const [skill, required] of Object.entries(job.requiredSkills ?? {}) as [SkillName, number][]) {
        expect(Math.max(courseMaximums[skill], careerMaximums[skill])).toBeGreaterThanOrEqual(required);
      }
    }
  });
});

describe('expanded life choices', () => {
  afterEach(() => {
    useLifeStore.setState({ ...createInitialLifeState(), hydrated: false });
  });

  it('adds meaningful housing and vehicle steps without duplicate ids', () => {
    expect(HOUSING.map((item) => item.id)).toEqual(expect.arrayContaining(['hostel', 'one-bedroom', 'townhouse', 'luxury-condo', 'estate']));
    expect(VEHICLES.map((item) => item.id)).toEqual(expect.arrayContaining(['compact', 'hybrid', 'executive', 'electric-luxury']));
    expect(new Set(HOUSING.map((item) => item.id)).size).toBe(HOUSING.length);
    expect(new Set(VEHICLES.map((item) => item.id)).size).toBe(VEHICLES.length);
  });

  it('generates complete and varied dating profiles', () => {
    const first = createDatingCandidate(100, 24);
    const second = createDatingCandidate(10_001, 24);
    for (const candidate of [first, second]) {
      expect(candidate.name.length).toBeGreaterThan(1);
      expect(candidate.occupation.length).toBeGreaterThan(2);
      expect(candidate.personality.length).toBeGreaterThan(4);
      expect(candidate.age).toBeGreaterThanOrEqual(18);
      expect(candidate.jobIncome).toBeGreaterThan(0);
    }
    expect(second).not.toEqual(first);
  });

  it('purchases consumer goods once and adds their resale value to net worth', () => {
    const initial = createInitialLifeState();
    useLifeStore.setState({ ...initial, money: big(2_000), hydrated: true });
    const before = toNumber(useLifeStore.getState().money);
    expect(useLifeStore.getState().buyGood('budget-phone')).toBe(true);
    expect(useLifeStore.getState().buyGood('budget-phone')).toBe(false);
    expect(useLifeStore.getState().ownedGoods).toEqual(['budget-phone']);
    expect(toNumber(useLifeStore.getState().money)).toBe(before - 250);
    expect(toNumber(calculateLifeNetWorth(useLifeStore.getState()))).toBe(before - 250 + 250 * 0.35);
    expect(CONSUMER_GOODS).toHaveLength(8);
  });

  it('shows a generated match before creating a partner', () => {
    useLifeStore.setState({ ...createInitialLifeState(), hydrated: true });
    useLifeStore.getState().meetPartner();
    const candidate = useLifeStore.getState().datingCandidate;
    expect(candidate).not.toBeNull();
    expect(useLifeStore.getState().partner).toBeNull();
    expect(useLifeStore.getState().acceptDatingCandidate()).toBe(true);
    expect(useLifeStore.getState().partner?.name).toBe(candidate?.name);
    expect(useLifeStore.getState().partner?.occupation).toBe(candidate?.occupation);
    expect(useLifeStore.getState().datingCandidate).toBeNull();
  });
});

describe('wellness pressure', () => {
  it('includes health popups whose choices can reduce or worsen stress', () => {
    const issues = LIFE_EVENTS.filter((event) => event.wellnessIssue);
    expect(issues.length).toBeGreaterThanOrEqual(16);
    expect(issues.some((event) => event.choices.some((choice) => (choice.outcome.stress ?? 0) < 0))).toBe(true);
    expect(issues.some((event) => event.choices.some((choice) => (choice.outcome.stress ?? 0) > 0))).toBe(true);
  });

  it('makes poor health and high stress materially reduce lifespan', () => {
    expect(estimatedLifespanYears({ health: 35, happiness: 35, stress: 90 })).toBeLessThan(estimatedLifespanYears({ health: 90, happiness: 90, stress: 10 }));
  });
});
