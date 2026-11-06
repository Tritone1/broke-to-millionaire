import { big, toNumber } from '../BigNumber';
import { BROKER_UNLOCK_NET_WORTH, BUSINESS_UNLOCK_NET_WORTH, GAME_MONTH_SECONDS, LOAN_BASE_APR, LOAN_REQUIRED_JOB_MONTHS } from '../config';
import { cappedOfflineSeconds, calculateOfflineLifeEarnings, createInitialLifeState, hasBrokerAccess, hasBusinessAccess, jobRequirementsMet, jobSalaryPerSecond, loanOfferFor, monthlyBillsFor, monthlyIncomeBreakdown, offlineClaimAmount, processGameMonth, simulateOfflineProgress, totalIncomePerSecond, useLifeStore, type LifePersistedState } from '../../store/lifeStore';

describe('offline time safety and cap', () => {
  const state = { ...createInitialLifeState(), jobId: 'courier' };

  it('stops a five-minute absence after one game month', () => {
    const result = calculateOfflineLifeEarnings(state, 5 * 60 * 1_000);
    expect(result.seconds).toBe(GAME_MONTH_SECONDS);
    expect(toNumber(result.earnings)).toBeCloseTo(jobSalaryPerSecond(state) * GAME_MONTH_SECONDS, 5);
  });

  it('caps offline time at one game month', () => {
    expect(cappedOfflineSeconds(20 * 60 * 1_000)).toBe(GAME_MONTH_SECONDS);
  });

  it('caps a five-hour absence at one game month', () => {
    const result = calculateOfflineLifeEarnings(state, 5 * 60 * 60 * 1_000);
    expect(result.seconds).toBe(GAME_MONTH_SECONDS);
    expect(toNumber(result.earnings)).toBeCloseTo(jobSalaryPerSecond(state) * GAME_MONTH_SECONDS, 5);
  });

  it('rejects negative, future, non-finite, and unrealistic timestamps', () => {
    expect(cappedOfflineSeconds(-1)).toBe(0);
    expect(cappedOfflineSeconds(Number.NaN)).toBe(0);
    expect(cappedOfflineSeconds(366 * 24 * 60 * 60 * 1_000)).toBe(0);
    const futureSave = { ...createInitialLifeState(20_000), lastSeenTimestamp: 30_000 };
    expect(simulateOfflineProgress(futureSave, 20_000).summary.countedSeconds).toBe(0);
  });
});

describe('offline calendar and net result', () => {
  it('charges expenses, keeps cash at the safe floor, and applies late fees', () => {
    const saved = { ...createInitialLifeState(1_000), money: '1|2', lifetimeEarnings: '1|2', housing: { id: 'shared', tenure: 'rent' as const, purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 }, vehicle: { ...createInitialLifeState(1_000).vehicle, id: 'public', tenure: 'public' as const }, foodPlanId: 'budget', healthPlanId: 'basic', character: { ...createInitialLifeState(1_000).character, traits: [] } };
    const result = simulateOfflineProgress(saved, 61_000);
    expect(toNumber(result.state.money)).toBe(0);
    expect(result.state.missedPayments).toBe(1);
    expect(result.state.lateFees).toBeGreaterThan(0);
    expect(toNumber(result.summary.totalIncome)).toBe(0);
    expect(toNumber(result.summary.expensesPaid)).toBe(100);
    expect(toNumber(result.summary.cashLoss)).toBe(100);
  });

  it('advances no more than one month and processes one loan payment', () => {
    const saved = {
      ...createInitialLifeState(1_000),
      money: '1|9',
      lifetimeEarnings: '1|9',
      loans: [{ id: 'test-loan', originalAmount: 24_000, balance: 24_000, annualRate: 0, monthlyPayment: 1_000, monthsRemaining: 24 }],
    };
    const result = simulateOfflineProgress(saved, 5 * 60 * 60 * 1_000 + 1_000);
    expect(result.summary.monthsAdvanced).toBe(1);
    expect(result.state.gameMonth).toBe(1);
    expect(result.state.age).toBe(18);
    expect(result.state.loans[0]?.monthsRemaining).toBe(23);
    expect(result.state.loans[0]?.balance).toBe(23_000);
    expect(result.state.monthlyBudgets).toHaveLength(1);
    expect(result.state.monthlyBudgets[0]?.month).toBe(1);
  });

  it('simulates the full capped month when the save starts partway through a month', () => {
    const saved = {
      ...createInitialLifeState(1_000),
      jobId: 'courier',
      monthProgressSeconds: GAME_MONTH_SECONDS - 1,
    };
    const result = simulateOfflineProgress(saved, 5 * 60 * 60 * 1_000 + 1_000);
    expect(result.summary.countedSeconds).toBe(GAME_MONTH_SECONDS);
    expect(result.summary.monthsAdvanced).toBe(1);
    expect(result.state.monthProgressSeconds).toBeCloseTo(GAME_MONTH_SECONDS - 1, 5);
    expect(toNumber(result.summary.salaryIncome)).toBeCloseTo(jobSalaryPerSecond(saved) * GAME_MONTH_SECONDS, 5);
    expect(result.state.monthlyBudgets).toHaveLength(1);
  });

  it('doubles only a positive claimable net amount', () => {
    expect(toNumber(offlineClaimAmount('2.5|2', 2))).toBe(500);
    expect(toNumber(offlineClaimAmount('0|0', 2))).toBe(0);
  });

  it('simulates closing and reopening through the store hydration path', () => {
    const now = 301_000;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const saved = { ...createInitialLifeState(1_000), lastSeenTimestamp: 1_000, lastSavedAt: 1_000, money: '1|6', lifetimeEarnings: '1|6', jobId: 'ceo' };
    useLifeStore.getState().hydrate(saved);
    const reopened = useLifeStore.getState();
    expect(reopened.offlineSeconds).toBe(GAME_MONTH_SECONDS);
    expect(reopened.gameMonth).toBe(1);
    expect(reopened.offlineSummary?.monthsAdvanced).toBe(1);
    const beforeClaim = toNumber(reopened.money);
    const positiveNet = toNumber(reopened.offlineEarnings);
    expect(positiveNet).toBeGreaterThan(0);
    reopened.claimOffline(2);
    expect(toNumber(useLifeStore.getState().money)).toBeCloseTo(beforeClaim + positiveNet * 2, 5);
    clock.mockRestore();
  });

  it('never accrues more than one monthly job salary while offline', () => {
    const saved = { ...createInitialLifeState(1_000), jobId: 'courier', lastSeenTimestamp: 1_000 };
    const result = simulateOfflineProgress(saved, 20 * 60 * 1_000 + 1_000);
    expect(toNumber(result.summary.salaryIncome)).toBeCloseTo(jobSalaryPerSecond(saved) * GAME_MONTH_SECONDS, 5);
    expect(result.summary.monthsAdvanced).toBe(1);
  });
});

describe('monthly payday', () => {
  it('shows salary and additional income separately instead of calling the total salary', () => {
    const state = { ...createInitialLifeState(), jobId: 'courier', partner: { name: 'Sam', age: 21, gender: 'non-binary' as const, pronouns: 'they/them' as const, occupation: 'Teacher', personality: 'Calm and thoughtful', avatarEmoji: '🧑', stage: 'dating' as const, affection: 50, monthsTogether: 1, jobIncome: 2_200, stayAtHome: false } };
    const income = monthlyIncomeBreakdown(state);
    expect(income.salary).toBe(450);
    expect(income.partner).toBe(2_200);
    expect(income.total).toBe(2_650);
  });
  it('leaves a positive surplus after the living upgrades required for first study', () => {
    const state = { ...createInitialLifeState(), jobId: 'courier', housing: { id: 'shared', tenure: 'rent' as const, purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 }, foodPlanId: 'budget' };
    const monthlyIncome = totalIncomePerSecond(state) * state.monthLengthSeconds;
    expect(monthlyIncome).toBeGreaterThan(0);
    expect(monthlyBillsFor(state).total).toBeLessThan(monthlyIncome);
    expect(monthlyBillsFor(state).total / monthlyIncome).toBeLessThanOrEqual(0.6);
  });

  it('does not compound an old late balance into an impossible bill', () => {
    const initial = { ...createInitialLifeState(), jobId: 'courier', housing: { id: 'shared', tenure: 'rent' as const, purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 }, foodPlanId: 'budget', lateFees: 3_140_000, accruedMonthlyIncome: '9|2' };
    const result = processGameMonth(initial);
    expect(result.lateFees).toBeLessThanOrEqual(monthlyBillsFor(initial).total * 2);
  });

  it('creates a planned annual deficit that can reduce saved cash', () => {
    const base = createInitialLifeState();
    const state: LifePersistedState = {
      ...base,
      gameMonth: 11,
      jobId: 'courier',
      money: big(2_000),
      accruedMonthlyIncome: big(450),
      housing: { ...base.housing, id: 'shared', tenure: 'rent' },
      foodPlanId: 'budget',
    };
    const bills = monthlyBillsFor(state);
    expect(bills.lines.some((line) => line.id === 'annual-costs')).toBe(true);
    expect(bills.total).toBeGreaterThan(450);
    const result = processGameMonth(state);
    expect(toNumber(result.money!)).toBeLessThan(2_000);
  });

  it('advances exactly one month after 60 real seconds at 1x and pays only on payday', () => {
    const now = 10_000;
    const initial = { ...createInitialLifeState(now), jobId: 'courier', nextLifeEventAt: now + 999_999 };
    useLifeStore.setState({ ...initial, hydrated: true, runtimeNow: now, offlineSummary: null, monthlySummary: null, activeLifeEvent: null });
    const startingCash = toNumber(initial.money);
    for (let index = 1; index <= 11; index += 1) useLifeStore.getState().tick(5_000, now + index * 5_000);
    expect(initial.monthLengthSeconds).toBe(GAME_MONTH_SECONDS);
    expect(useLifeStore.getState().gameMonth).toBe(0);
    expect(toNumber(useLifeStore.getState().money)).toBe(startingCash);
    expect(toNumber(useLifeStore.getState().accruedMonthlyIncome)).toBeGreaterThan(0);
    useLifeStore.getState().tick(5_000, now + 60_000);
    expect(useLifeStore.getState().gameMonth).toBe(1);
    expect(toNumber(useLifeStore.getState().money)).toBeGreaterThan(startingCash);
    expect(toNumber(useLifeStore.getState().accruedMonthlyIncome)).toBe(0);
  });
});

describe('first-minute onboarding balance', () => {
  it('persists the selected body, ethnicity, skin, and hairstyle into the playable character', () => {
    const character = { ...createInitialLifeState().character, name: 'Aylin', gender: 'female' as const, pronouns: 'she/her', ethnicity: 'middle-eastern' as const, avatar: { ...createInitialLifeState().character.avatar, skin: '#4B2A23', hairStyle: 5 } };
    useLifeStore.getState().startNewLife(character);
    expect(useLifeStore.getState().character.gender).toBe('female');
    expect(useLifeStore.getState().character.ethnicity).toBe('middle-eastern');
    expect(useLifeStore.getState().character.avatar.skin).toBe('#4B2A23');
    expect(useLifeStore.getState().character.avatar.hairStyle).toBe(5);
  });

  it('starts homeless and unemployed, with no free starter-gig income', () => {
    const initial = createInitialLifeState();
    useLifeStore.setState({ ...initial, hydrated: true });
    expect(initial.housing.id).toBe('homeless');
    expect(initial.foodPlanId).toBe('survival');
    expect(initial.vehicle.id).toBe('walk');
    expect(initial.jobId).toBeNull();
    expect(monthlyBillsFor(initial).total).toBe(0);
    expect(toNumber(useLifeStore.getState().money)).toBe(toNumber(initial.money));
    expect(toNumber(useLifeStore.getState().accruedMonthlyIncome)).toBe(0);
    expect(useLifeStore.getState().takeJob('courier')).toBe(true);
    expect(useLifeStore.getState().jobId).toBe('courier');
    expect(useLifeStore.getState().tutorialStep).toBe(2);
  });

  it('requires housing and food before the first course', () => {
    const initial = { ...createInitialLifeState(), money: big(1_000), energy: 100 };
    useLifeStore.setState({ ...initial, hydrated: true });
    expect(useLifeStore.getState().startCourse('highSchool')).toBe(false);
    expect(useLifeStore.getState().chooseHousing('shared', 'rent')).toBe(true);
    useLifeStore.getState().setFoodPlan('budget');
    expect(useLifeStore.getState().startCourse('highSchool')).toBe(true);
    expect(useLifeStore.getState().tutorialStep).toBe(3);
  });

  it('allows a qualified early-career player to enroll in Coding Bootcamp', () => {
    const initial = {
      ...createInitialLifeState(),
      money: big(2_000),
      energy: 100,
      jobId: 'barista',
      completedCourses: ['highSchool'],
      housing: { id: 'studio', tenure: 'rent' as const, purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 },
      vehicle: { ...createInitialLifeState().vehicle, id: 'public', tenure: 'public' as const },
      foodPlanId: 'balanced',
    };
    const monthlySurplus = totalIncomePerSecond(initial) * initial.monthLengthSeconds - monthlyBillsFor(initial).total;
    expect(monthlySurplus).toBeGreaterThanOrEqual(100);
    useLifeStore.setState({ ...initial, hydrated: true });
    expect(useLifeStore.getState().startCourse('coding')).toBe(true);
    expect(useLifeStore.getState().activeCourse?.courseId).toBe('coding');
    expect(toNumber(useLifeStore.getState().money)).toBe(500);
  });

  it('blocks better jobs until their living standards are met', () => {
    const initial = { ...createInitialLifeState(), money: big(10_000), energy: 100, completedCourses: ['highSchool'], tutorialStep: 1 as const };
    expect(jobRequirementsMet(initial, 'cashier')).toBe(false);
    const stable = { ...initial, housing: { id: 'shared', tenure: 'rent' as const, purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 }, foodPlanId: 'budget' };
    expect(jobRequirementsMet(stable, 'cashier')).toBe(true);
  });

  it('requires both work performance and three months of experience for promotion', () => {
    let passiveState: LifePersistedState = { ...createInitialLifeState(), jobId: 'courier', money: big(10_000) };
    for (let month = 0; month < 3; month += 1) {
      passiveState = { ...passiveState, accruedMonthlyIncome: big(450), ...processGameMonth({ ...passiveState, accruedMonthlyIncome: big(450) }) };
    }
    expect(passiveState.promotionLevel).toBe(0);

    let state: LifePersistedState = { ...createInitialLifeState(), jobId: 'courier', money: big(10_000), performance: 100 };
    for (let month = 0; month < 3; month += 1) {
      state = { ...state, accruedMonthlyIncome: big(450), ...processGameMonth({ ...state, accruedMonthlyIncome: big(450) }) };
    }
    expect(state.jobExperienceMonths.courier).toBe(3);
    expect(state.promotionLevel).toBe(1);
    expect(state.performance).toBe(0);
  });
});

describe('wealth gates and strict bank credit', () => {
  it('locks broker purchases below $25K and first businesses below $50K', () => {
    const brokerLocked = { ...createInitialLifeState(), money: big(BROKER_UNLOCK_NET_WORTH - 1) };
    const businessLocked = { ...createInitialLifeState(), money: big(BUSINESS_UNLOCK_NET_WORTH - 1) };
    expect(hasBrokerAccess(brokerLocked)).toBe(false);
    expect(hasBusinessAccess(businessLocked)).toBe(false);

    useLifeStore.setState({ ...brokerLocked, hydrated: true });
    expect(useLifeStore.getState().tradeMarket('novacore', 'buy', 1)).toBe(false);
    useLifeStore.setState({ ...businessLocked, hydrated: true });
    expect(useLifeStore.getState().foundCompany('cafe', 'Too Early Cafe')).toBe(false);

    const brokerReady = { ...createInitialLifeState(), money: big(BROKER_UNLOCK_NET_WORTH) };
    const businessReady = { ...createInitialLifeState(), money: big(BUSINESS_UNLOCK_NET_WORTH) };
    expect(hasBrokerAccess(brokerReady)).toBe(true);
    expect(hasBusinessAccess(businessReady)).toBe(true);
  });

  it('requires six clean job months and caps debt by salary and payment share', () => {
    const unemployed = createInitialLifeState();
    expect(loanOfferFor(unemployed).eligible).toBe(false);

    const inexperienced = { ...createInitialLifeState(), jobId: 'courier', jobExperienceMonths: { courier: LOAN_REQUIRED_JOB_MONTHS - 1 } };
    expect(loanOfferFor(inexperienced).eligible).toBe(false);

    const eligible = { ...createInitialLifeState(), jobId: 'courier', jobExperienceMonths: { courier: LOAN_REQUIRED_JOB_MONTHS } };
    const offer = loanOfferFor(eligible);
    expect(offer.eligible).toBe(true);
    expect(offer.annualRate).toBe(LOAN_BASE_APR);
    expect(offer.maxAmount).toBeLessThanOrEqual(900);
    useLifeStore.setState({ ...eligible, hydrated: true });
    expect(useLifeStore.getState().takeLoan(500)).toBe(true);
    expect(useLifeStore.getState().loans[0]?.monthsRemaining).toBe(12);

    expect(loanOfferFor({ ...eligible, lateFees: 1 }).eligible).toBe(false);
  });
});
