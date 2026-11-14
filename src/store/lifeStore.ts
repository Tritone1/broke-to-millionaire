import { create } from 'zustand';

import { COURSES, type SkillName } from '../data/courses';
import { normalizeHairstyleForGender, normalizeSkinTone } from '../data/avatarOptions';
import { COMPANY_TYPES, companyTypeById } from '../data/companyTypes';
import { createDatingCandidate, type DatingCandidate } from '../data/dating';
import type { Language } from '../data/i18n';
import { CONSUMER_GOODS, consumerGoodById } from '../data/goods';
import { JOBS, JOB_SKILL_GROWTH, jobById } from '../data/jobs';
import { MARKET_ASSETS } from '../data/marketAssets';
import { LIFE_EVENTS, lifeEventById } from '../data/lifeEvents';
import { FOOD_PLANS, HEALTH_PLANS, housingById, vehicleById, type BackgroundId, type EthnicityId, type TraitId } from '../data/living';
import { LIFESTYLE_ITEMS } from '../data/shop';
import { wellnessActionById, type WellnessActionId } from '../data/wellness';
import { add, compare, multiply, subtract, toNumber, zero, type BigValue } from '../game/BigNumber';
import {
  BROKER_UNLOCK_NET_WORTH,
  BUSINESS_UNLOCK_NET_WORTH,
  DAILY_MISSION_REWARDS,
  DAILY_REWARD_AMOUNTS,
  GAME_MONTH_SECONDS,
  LOAN_BASE_APR,
  LOAN_MAX_INCOME_MONTHS,
  LOAN_MAX_PAYMENT_SHARE,
  LOAN_REQUIRED_JOB_MONTHS,
  LOAN_TERM_MONTHS,
  MAX_PROMOTION_LEVEL,
  OFFLINE_CAP_GAME_MONTHS,
  OFFLINE_CAP_SECONDS,
  OFFLINE_SALARY_MONTHS,
} from '../game/config';
import { examSuccessChance, interviewSuccessChance } from '../game/education';
import { activeStudyGain, courseProgress, STUDY_SESSION_ENERGY, type ActiveCourseProgress } from '../game/courseProgress';
import { legacyMultiplier, prestigePointsForLifetime } from '../game/formulas';
import { annualFeesAndRepairs, calculateMonthlyBills, careerOperatingCost, costOfLivingMultiplier, divorceSplit, mortgagePayment, nextRelationshipStage, progressiveMonthlyTax, progressiveWealthUpkeep, type BillLine, type RelationshipStage } from '../game/lifeCosts';
import { advanceMarket, averagePriceAfterBuy, createMarketSnapshot, type MarketNews } from '../game/marketEngine';
import { nextRandom } from '../game/random';

export const LIFE_SAVE_VERSION = 15;
export const BROKER_FEE = 0.005;

export type Skills = Record<SkillName, number>;
export type Employee = { id: string; name: string; salaryPerSecond: number; productivity: number };
export type CompanyUpgrades = { marketing: number; equipment: number; location: number };
export type PlayerCompany = {
  id: string;
  typeId: string;
  name: string;
  level: number;
  employees: Employee[];
  upgrades: CompanyUpgrades;
  reputation: number;
  manager: boolean;
  boostUntil: number;
  isPublic: boolean;
  ownership: number;
};
export type PortfolioPosition = { quantity: number; averageBuyPrice: number };
export type LimitOrder = { id: string; assetId: string; side: 'buy' | 'sell'; quantity: number; targetPrice: number };
export type LifeEventKind = 'windfall' | 'tax' | 'medical' | 'fired' | 'marketCrash' | 'business' | 'breakdown' | 'bill' | 'invitation' | 'birthday' | 'promotionParty';
export type LifeEvent = { id: string; kind: LifeEventKind; title: string; description: string; eventId?: string };
export type LifeSettings = { sound: boolean; haptics: boolean; language: Language; languageChosen: boolean };
export type DailyProgress = { date: string; workTaps: number; trades: number; businessActions: number };
export type CasinoStats = { totalWagered: number; totalWon: number; gamesPlayed: number };
export type Gender = 'male' | 'female' | 'non-binary';
export type CharacterProfile = {
  name: string;
  gender: Gender;
  pronouns: string;
  ethnicity: EthnicityId;
  backgroundId: BackgroundId;
  traits: TraitId[];
  avatar: { skin: string; hairStyle: number; hairColor: string; outfitColor: string };
};
export type HousingState = { id: string; tenure: 'homeless' | 'rent' | 'owned' | 'mortgage'; purchasePrice: number; marketValue: number; mortgageBalance: number; monthlyPayment: number };
export type VehicleState = { id: string; tenure: 'walk' | 'public' | 'owned' | 'lease' | 'finance'; purchasePrice: number; marketValue: number; debt: number; monthlyPayment: number; monthsOwned: number; condition: number };
export type PartnerCareAction = 'talk' | 'date' | 'gift' | 'weekend' | 'vacation' | 'family';
export type PartnerState = Omit<DatingCandidate, 'id' | 'age'> & {
  birthMonth: number;
  stage: Exclude<RelationshipStage, 'single'>;
  affection: number;
  happiness: number;
  monthsTogether: number;
  stayAtHome: boolean;
  careMonths: Partial<Record<PartnerCareAction, number>>;
};
export type ChildState = { id: string; name: string; birthMonth: number; happiness: number; education: number; privateSchool: boolean; collegeFund: number };
export type BankLoan = { id: string; originalAmount: number; balance: number; annualRate: number; monthlyPayment: number; monthsRemaining: number };
export type MonthlyBudget = { month: number; income: number; expenses: number; unpaid: number; lines: BillLine[] };
export type MonthlySummary = MonthlyBudget & { net: number; birthday: boolean; promotion: boolean };
export type OfflineSummary = {
  actualSeconds: number;
  countedSeconds: number;
  monthsAdvanced: number;
  salaryIncome: BigValue;
  businessIncome: BigValue;
  partnerIncome: BigValue;
  passiveBonusIncome: BigValue;
  dividendIncome: BigValue;
  totalIncome: BigValue;
  expensesPaid: BigValue;
  netPositive: BigValue;
  cashLoss: BigValue;
};

export type MonthlyIncomeBreakdown = {
  salary: number;
  business: number;
  partner: number;
  passiveBonus: number;
  total: number;
};

export type LoanOffer = {
  eligible: boolean;
  maxAmount: number;
  annualRate: number;
  termMonths: number;
  reason: string;
};

export type LifePersistedState = {
  saveVersion: number;
  money: BigValue;
  accruedMonthlyIncome: BigValue;
  lifetimeEarnings: BigValue;
  totalSpent: BigValue;
  character: CharacterProfile;
  age: number;
  totalPlaySeconds: number;
  gameMonth: number;
  monthProgressSeconds: number;
  monthLengthSeconds: number;
  skills: Skills;
  completedCourses: string[];
  activeCourse: ActiveCourseProgress | null;
  jobId: string | null;
  jobExperienceMonths: Record<string, number>;
  jobSkillMilestones: Record<string, number>;
  performance: number;
  promotionLevel: number;
  energy: number;
  stress: number;
  happiness: number;
  health: number;
  wellnessActionMonths: Partial<Record<WellnessActionId, number>>;
  housing: HousingState;
  vehicle: VehicleState;
  datingCandidate: DatingCandidate | null;
  partner: PartnerState | null;
  children: ChildState[];
  nanny: boolean;
  foodPlanId: string;
  healthPlanId: string;
  loans: BankLoan[];
  lateFees: number;
  missedPayments: number;
  monthlyBudgets: MonthlyBudget[];
  companies: PlayerCompany[];
  marketPrices: Record<string, number>;
  marketTrends: Record<string, number>;
  marketHistory: Record<string, number[]>;
  marketSeed: number;
  marketNews: MarketNews[];
  lastMarketTick: number;
  lastDividendAt: number;
  portfolio: Record<string, PortfolioPosition>;
  watchlist: string[];
  limitOrders: LimitOrder[];
  ownedLifestyle: string[];
  ownedGoods: string[];
  legacyPoints: number;
  gems: number;
  reputation: number;
  timeSpeed: 0 | 1 | 2 | 4;
  casinoStats: CasinoStats;
  dailyLossLimit: number;
  dailyCasinoLoss: number;
  casinoDate: string;
  dailyProgress: DailyProgress;
  claimedDailyMissions: string[];
  dailyStreak: number;
  lastDailyClaim: string | null;
  claimedAchievements: string[];
  settings: LifeSettings;
  lastSeenTimestamp: number;
  lastSavedAt: number;
  nextLifeEventAt: number;
  tutorialStep: 0 | 1 | 2 | 3;
};

type LifeStore = LifePersistedState & {
  hydrated: boolean;
  runtimeNow: number;
  offlineEarnings: BigValue;
  offlineSeconds: number;
  offlineSummary: OfflineSummary | null;
  monthlySummary: MonthlySummary | null;
  activeLifeEvent: LifeEvent | null;
  celebrationNonce: number;
  hydrate: (saved: LifePersistedState | null) => void;
  tick: (elapsedMilliseconds: number, now: number) => void;
  workHard: () => boolean;
  rest: () => void;
  enjoyHobby: () => boolean;
  performWellnessAction: (actionId: WellnessActionId) => boolean;
  startCourse: (courseId: string) => boolean;
  finishCourseNow: () => void;
  fastForwardCourseMonth: () => boolean;
  studyActiveCourse: () => boolean;
  takeCourseExam: () => 'passed' | 'failed' | 'unavailable';
  takeJob: (jobId: string) => boolean;
  quitJob: () => void;
  foundCompany: (typeId: string, name: string) => boolean;
  hireEmployee: (companyId: string) => boolean;
  fireEmployee: (companyId: string) => boolean;
  upgradeCompany: (companyId: string, kind: keyof CompanyUpgrades) => boolean;
  hireManager: (companyId: string) => boolean;
  boostCompany: (companyId: string) => void;
  sellCompany: (companyId: string) => boolean;
  ipoCompany: (companyId: string) => boolean;
  tradeMarket: (assetId: string, side: 'buy' | 'sell', quantity: number) => boolean;
  placeLimitOrder: (assetId: string, side: 'buy' | 'sell', quantity: number, targetPrice: number) => boolean;
  cancelLimitOrder: (orderId: string) => void;
  toggleWatchlist: (assetId: string) => void;
  placeCasinoWager: (amount: number) => boolean;
  creditCasinoPayout: (amount: number) => void;
  setDailyLossLimit: (amount: number) => void;
  buyLifestyle: (itemId: string) => boolean;
  buyGood: (itemId: string) => boolean;
  claimOffline: (multiplier: 1 | 2) => void;
  claimDaily: () => boolean;
  claimRewardedCash: () => void;
  applyVerifiedCashDelta: (amount: number) => void;
  claimMission: (id: string) => boolean;
  claimAchievement: (id: string) => boolean;
  resolveLifeEvent: (choice: 'accept' | 'protect' | number) => void;
  prestige: () => number;
  updateSettings: (settings: Partial<LifeSettings>) => void;
  markSaved: (timestamp: number) => void;
  resetLife: () => void;
  startNewLife: (character: CharacterProfile) => void;
  chooseHousing: (id: string, tenure: 'homeless' | 'rent' | 'owned' | 'mortgage') => boolean;
  sellHome: () => boolean;
  chooseVehicle: (id: string, tenure: 'walk' | 'public' | 'owned' | 'lease' | 'finance') => boolean;
  sellVehicle: () => boolean;
  setFoodPlan: (id: string) => void;
  setHealthPlan: (id: string) => void;
  meetPartner: () => void;
  acceptDatingCandidate: () => boolean;
  skipDatingCandidate: () => void;
  relationshipAction: (action: PartnerCareAction | 'propose' | 'marry' | 'breakup' | 'divorce') => boolean;
  haveChild: () => boolean;
  toggleNanny: () => void;
  togglePrivateSchool: (childId: string) => void;
  addCollegeFund: (childId: string, amount: number) => boolean;
  takeLoan: (amount: number) => boolean;
  togglePartnerWork: () => void;
  lifestyleSpend: (kind: 'vacation' | 'clothing') => boolean;
  setTimeSpeed: (speed: 0 | 1 | 2 | 4) => void;
  dismissMonthlySummary: () => void;
};

const EMPLOYEE_NAMES = ['Alex', 'Mina', 'Sam', 'Leyla', 'Noah', 'Aylin', 'Kai', 'Nora', 'Leo', 'Zara'];

function dateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function futureEvent(now = Date.now()): number {
  return now + (2 + Math.random() * 3) * 60_000;
}

export function createInitialLifeState(now = Date.now()): LifePersistedState {
  const market = createMarketSnapshot(now ^ 0x13579bdf);
  return {
    saveVersion: LIFE_SAVE_VERSION,
    money: zero(),
    accruedMonthlyIncome: zero(),
    lifetimeEarnings: zero(),
    totalSpent: zero(),
    character: { name: 'Player', gender: 'non-binary', pronouns: 'they/them', ethnicity: 'european', backgroundId: 'street', traits: [], avatar: { skin: '#C68642', hairStyle: 0, hairColor: '#2A1A12', outfitColor: '#176B42' } },
    age: 18,
    totalPlaySeconds: 0,
    gameMonth: 0,
    monthProgressSeconds: 0,
    monthLengthSeconds: GAME_MONTH_SECONDS,
    skills: { intelligence: 0, business: 0, finance: 0, tech: 0, charisma: 0 },
    completedCourses: [],
    activeCourse: null,
    jobId: null,
    jobExperienceMonths: {},
    jobSkillMilestones: {},
    performance: 0,
    promotionLevel: 0,
    energy: 100,
    stress: 0,
    happiness: 65,
    health: 75,
    wellnessActionMonths: {},
    housing: { id: 'homeless', tenure: 'homeless', purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 },
    vehicle: { id: 'walk', tenure: 'walk', purchasePrice: 0, marketValue: 0, debt: 0, monthlyPayment: 0, monthsOwned: 0, condition: 100 },
    datingCandidate: null,
    partner: null,
    children: [],
    nanny: false,
    foodPlanId: 'survival',
    healthPlanId: 'none',
    loans: [],
    lateFees: 0,
    missedPayments: 0,
    monthlyBudgets: [],
    companies: [],
    marketPrices: market.prices,
    marketTrends: market.trends,
    marketHistory: market.history,
    marketSeed: market.seed,
    marketNews: market.news,
    lastMarketTick: now,
    lastDividendAt: now,
    portfolio: {},
    watchlist: ['novacore', 'nexacoin'],
    limitOrders: [],
    ownedLifestyle: [],
    ownedGoods: [],
    legacyPoints: 0,
    gems: 5,
    reputation: 0,
    timeSpeed: 1,
    casinoStats: { totalWagered: 0, totalWon: 0, gamesPlayed: 0 },
    dailyLossLimit: 5_000,
    dailyCasinoLoss: 0,
    casinoDate: dateKey(now),
    dailyProgress: { date: dateKey(now), workTaps: 0, trades: 0, businessActions: 0 },
    claimedDailyMissions: [],
    dailyStreak: 0,
    lastDailyClaim: null,
    claimedAchievements: [],
    settings: { sound: true, haptics: true, language: 'en', languageChosen: false },
    lastSeenTimestamp: now,
    lastSavedAt: now,
    nextLifeEventAt: futureEvent(now),
    tutorialStep: 0,
  };
}

export function jobSalaryPerSecond(state: Pick<LifePersistedState, 'jobId' | 'promotionLevel' | 'energy' | 'legacyPoints'>): number {
  const job = jobById(state.jobId);
  if (!job) return 0;
  const fatigueMultiplier = state.energy <= 0 ? 0.25 : 1;
  return job.salaryPerSecond * (1 + Math.min(MAX_PROMOTION_LEVEL, state.promotionLevel) * 0.125) * fatigueMultiplier * legacyMultiplier(state.legacyPoints);
}

export function companyUpgradeCost(company: PlayerCompany, kind: keyof CompanyUpgrades): number {
  const definition = companyTypeById(company.typeId);
  return definition.startupCost * 0.3 * 2 ** company.upgrades[kind];
}

export function companyHiringCost(company: PlayerCompany): number {
  const definition = companyTypeById(company.typeId);
  const monthlyBaseSalary = definition.employeeBaseSalary * GAME_MONTH_SECONDS;
  return monthlyBaseSalary * 6 * (1 + company.employees.length / 10) ** 1.25;
}

function companyNetOperatingPerSecond(company: PlayerCompany, legacyPoints = 0, now = Date.now()): number {
  const definition = companyTypeById(company.typeId);
  const productivityUnits = company.employees.reduce((sum, employee) => sum + employee.productivity / 100, 0);
  const workforceMultiplier = 1 + Math.log2(1 + productivityUnits) * 0.45;
  const totalUpgrades = company.upgrades.marketing + company.upgrades.equipment + company.upgrades.location;
  const upgradeMultiplier = 1.12 ** Math.min(60, totalUpgrades);
  const reputationMultiplier = 0.75 + Math.max(5, Math.min(100, company.reputation)) / 200;
  const boostMultiplier = company.boostUntil > now ? 1.5 : 1;
  const gross = definition.baseRevenuePerSecond * workforceMultiplier * upgradeMultiplier * reputationMultiplier * boostMultiplier;
  const payroll = company.employees.reduce((sum, employee) => sum + employee.salaryPerSecond, 0);
  const fixedOperations = definition.baseRevenuePerSecond * 0.55 * (1 + Math.sqrt(totalUpgrades) * 0.15) * (company.manager ? 0.9 : 1);
  return (gross - payroll - fixedOperations) * company.ownership * legacyMultiplier(legacyPoints);
}

export function companyProfitPerSecond(company: PlayerCompany, legacyPoints = 0, now = Date.now()): number {
  return Math.max(0, companyNetOperatingPerSecond(company, legacyPoints, now));
}

export function companyOperatingLossPerSecond(company: PlayerCompany, legacyPoints = 0, now = Date.now()): number {
  return Math.max(0, -companyNetOperatingPerSecond(company, legacyPoints, now));
}

export function companyValuation(company: PlayerCompany): number {
  const definition = companyTypeById(company.typeId);
  const upgradeCapital = (Object.values(company.upgrades) as number[]).reduce((sum, level) => sum + definition.startupCost * 0.3 * (2 ** level - 1), 0);
  const hiringCapital = company.employees.reduce((sum, employee) => sum + employee.salaryPerSecond * GAME_MONTH_SECONDS * 6, 0);
  const stableMonthlyProfit = companyProfitPerSecond(company, 0, Number.POSITIVE_INFINITY) * GAME_MONTH_SECONDS;
  return definition.startupCost * 0.65 + upgradeCapital * 0.55 + hiringCapital * 0.35 + stableMonthlyProfit * 4;
}

type IncomeState = Pick<LifePersistedState, 'jobId' | 'promotionLevel' | 'energy' | 'legacyPoints' | 'companies' | 'ownedLifestyle' | 'partner' | 'character' | 'monthLengthSeconds'>;

export function monthlyIncomeBreakdown(state: IncomeState): MonthlyIncomeBreakdown {
  const salary = jobSalaryPerSecond(state) * state.monthLengthSeconds;
  const companyIncome = state.companies.reduce((sum, company) => sum + companyProfitPerSecond(company, state.legacyPoints), 0) * state.monthLengthSeconds;
  const riskMultiplier = state.character.traits.includes('risk-taker') ? 1.08 : 1;
  const business = companyIncome * riskMultiplier;
  const partner = state.partner?.stayAtHome ? 0 : state.partner?.jobIncome ?? 0;
  const gross = salary + business + partner;
  const ownedItems = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id));
  const passiveBonus = gross * ownedItems.reduce((sum, item) => sum + item.bonus, 0);
  return { salary, business, partner, passiveBonus, total: Math.max(0, gross + passiveBonus) };
}

export function totalIncomePerSecond(state: IncomeState): number {
  return monthlyIncomeBreakdown(state).total / state.monthLengthSeconds;
}

export function calculateLifeNetWorth(state: Pick<LifePersistedState, 'money' | 'portfolio' | 'marketPrices' | 'companies' | 'ownedLifestyle' | 'ownedGoods' | 'housing' | 'vehicle' | 'loans'>): BigValue {
  const portfolioValue = Object.entries(state.portfolio).reduce((sum, [id, position]) => sum + position.quantity * (state.marketPrices[id] ?? 0), 0);
  const companyValue = state.companies.reduce((sum, company) => sum + companyValuation(company), 0);
  const lifestyleValue = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.cost, 0);
  const goodsValue = CONSUMER_GOODS.filter((item) => state.ownedGoods.includes(item.id)).reduce((sum, item) => sum + item.price * item.resaleRate, 0);
  const propertyEquity = Math.max(0, state.housing.marketValue - state.housing.mortgageBalance);
  const vehicleEquity = Math.max(0, state.vehicle.marketValue - state.vehicle.debt);
  const loanDebt = state.loans.reduce((sum, loan) => sum + loan.balance, 0);
  return add(state.money, portfolioValue + companyValue + lifestyleValue + goodsValue + propertyEquity + vehicleEquity - loanDebt);
}

export function partnerAgeAtMonth(partner: Pick<PartnerState, 'birthMonth'>, gameMonth: number): number {
  return Math.max(18, Math.floor((gameMonth - partner.birthMonth) / 12));
}

export function hasBusinessAccess(state: LifePersistedState): boolean {
  return state.companies.length > 0 || toNumber(calculateLifeNetWorth(state)) >= BUSINESS_UNLOCK_NET_WORTH;
}

export function hasBrokerAccess(state: LifePersistedState): boolean {
  const ownsInvestment = Object.values(state.portfolio).some((position) => position.quantity > 0);
  return ownsInvestment || state.limitOrders.length > 0 || toNumber(calculateLifeNetWorth(state)) >= BROKER_UNLOCK_NET_WORTH;
}

export function loanOfferFor(state: LifePersistedState): LoanOffer {
  const salary = monthlyIncomeBreakdown(state).salary;
  const jobMonths = state.jobId ? state.jobExperienceMonths[state.jobId] ?? 0 : 0;
  const annualRate = Math.min(0.36, LOAN_BASE_APR + state.loans.length * 0.03);
  const currentDebt = state.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const currentPayments = state.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const principalCapacity = Math.max(0, salary * LOAN_MAX_INCOME_MONTHS - currentDebt);
  const paymentCapacity = Math.max(0, salary * LOAN_MAX_PAYMENT_SHARE - currentPayments);
  const paymentPerDollar = mortgagePayment(1, annualRate, LOAN_TERM_MONTHS);
  const maxAmount = Math.floor(Math.max(0, Math.min(principalCapacity, paymentCapacity / paymentPerDollar)));
  const reason = !state.jobId
    ? 'A job is required.'
    : jobMonths < LOAN_REQUIRED_JOB_MONTHS
      ? `${LOAN_REQUIRED_JOB_MONTHS} months in your current job are required.`
      : state.lateFees > 0 || state.missedPayments > 0
        ? 'Clear late bills and rebuild a clean payment record.'
        : maxAmount < 500
          ? 'Existing debt is already at the bank limit.'
          : '';
  return {
    eligible: reason.length === 0,
    maxAmount: reason.length === 0 ? maxAmount : 0,
    annualRate,
    termMonths: LOAN_TERM_MONTHS,
    reason,
  };
}

export function calculateOfflineLifeEarnings(
  state: Pick<LifePersistedState, 'jobId' | 'promotionLevel' | 'energy' | 'legacyPoints' | 'companies' | 'ownedLifestyle' | 'partner' | 'character' | 'monthLengthSeconds'>,
  awayMilliseconds: number,
): { earnings: BigValue; seconds: number } {
  const seconds = cappedOfflineSeconds(awayMilliseconds);
  const breakdown = monthlyIncomeBreakdown(state);
  const salarySeconds = Math.min(seconds, state.monthLengthSeconds * OFFLINE_SALARY_MONTHS);
  const salary = jobSalaryPerSecond(state) * salarySeconds;
  const nonSalaryPerSecond = (breakdown.business + breakdown.partner) / state.monthLengthSeconds;
  const base = salary + nonSalaryPerSecond * seconds;
  const passiveRate = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.bonus, 0);
  return { earnings: multiply(base, 1 + passiveRate), seconds };
}

const MAX_TRUSTED_OFFLINE_MS = 365 * 24 * 60 * 60 * 1_000;

export function cappedOfflineSeconds(awayMilliseconds: number): number {
  if (!Number.isFinite(awayMilliseconds) || awayMilliseconds < 0 || awayMilliseconds > MAX_TRUSTED_OFFLINE_MS) return 0;
  return Math.min(OFFLINE_CAP_SECONDS, awayMilliseconds / 1_000);
}

function courseCompletedPatch(state: LifePersistedState): Partial<LifePersistedState> {
  if (!state.activeCourse) return {};
  const course = COURSES.find((item) => item.id === state.activeCourse?.courseId);
  if (!course) return { activeCourse: null };
  const skills = { ...state.skills };
  for (const [key, value] of Object.entries(course.rewards) as [SkillName, number][]) skills[key] += value;
  return {
    activeCourse: null,
    completedCourses: [...new Set([...state.completedCourses, course.id])],
    skills,
    energy: Math.min(100, state.energy + 5),
  };
}

function courseReadyPatch(state: LifePersistedState): Partial<LifePersistedState> {
  if (!state.activeCourse) return {};
  const course = COURSES.find((item) => item.id === state.activeCourse?.courseId);
  if (!course || !courseProgress(state.activeCourse, course, state.gameMonth).readyToGraduate) return {};
  return {
    activeCourse: {
      ...state.activeCourse,
      examReady: true,
    },
  };
}

export function jobRequirementsMet(state: LifePersistedState, jobId: string): boolean {
  const job = JOBS.find((item) => item.id === jobId);
  if (!job) return false;
  if (job.requiredCourses?.some((course) => !state.completedCourses.includes(course))) return false;
  if (Object.entries(job.requiredSkills ?? {}).some(([key, value]) => state.skills[key as SkillName] < (value ?? 0))) return false;
  if (job.requiredExperience?.some((requirement) => (state.jobExperienceMonths[requirement.jobId] ?? 0) < requirement.months)) return false;
  const foodLevel = Math.max(0, FOOD_PLANS.findIndex((plan) => plan.id === state.foodPlanId));
  return housingById(state.housing.id).status >= job.living.housingStatus
    && foodLevel >= job.living.foodLevel
    && vehicleById(state.vehicle.id).status >= job.living.vehicleStatus;
}

function dailyPatch(state: LifePersistedState, now = Date.now()): Partial<LifePersistedState> {
  const today = dateKey(now);
  const patch: Partial<LifePersistedState> = {};
  if (state.dailyProgress.date !== today) {
    patch.dailyProgress = { date: today, workTaps: 0, trades: 0, businessActions: 0 };
    patch.claimedDailyMissions = [];
  }
  if (state.casinoDate !== today) {
    patch.casinoDate = today;
    patch.dailyCasinoLoss = 0;
  }
  return patch;
}

function createLifeEvent(now: number, seed: number, health: number, stress: number): LifeEvent {
  const wellnessEvents = LIFE_EVENTS.filter((event) => event.wellnessIssue);
  const wellnessRisk = health < 55 || stress >= 65;
  const useWellnessEvent = wellnessRisk && wellnessEvents.length > 0 && Math.abs(seed) % 3 !== 0;
  const pool = useWellnessEvent ? wellnessEvents : LIFE_EVENTS;
  const definition = pool[Math.abs(seed) % pool.length] ?? LIFE_EVENTS[0]!;
  const kinds: LifeEventKind[] = ['windfall', 'tax', 'medical', 'business', 'breakdown', 'bill', 'invitation', 'birthday'];
  const kind = definition.wellnessIssue ? 'medical' : kinds[Math.abs(seed) % kinds.length] ?? 'windfall';
  return { id: `${definition.id}-${now}`, eventId: definition.id, kind, title: definition.title, description: definition.dialogue };
}

function processLimitOrders(state: LifePersistedState): Partial<LifePersistedState> {
  let money = state.money;
  let portfolio = state.portfolio;
  const remaining: LimitOrder[] = [];
  let trades = 0;
  for (const order of state.limitOrders) {
    const price = state.marketPrices[order.assetId] ?? 0;
    const triggered = order.side === 'buy' ? price <= order.targetPrice : price >= order.targetPrice;
    if (!triggered) {
      remaining.push(order);
      continue;
    }
    const position = portfolio[order.assetId] ?? { quantity: 0, averageBuyPrice: 0 };
    if (order.side === 'buy') {
      const cost = price * order.quantity * (1 + BROKER_FEE);
      if (compare(money, cost) < 0) {
        remaining.push(order);
        continue;
      }
      money = subtract(money, cost);
      portfolio = { ...portfolio, [order.assetId]: { quantity: position.quantity + order.quantity, averageBuyPrice: averagePriceAfterBuy(position.quantity, position.averageBuyPrice, order.quantity, price) } };
    } else {
      if (position.quantity < order.quantity) {
        remaining.push(order);
        continue;
      }
      money = add(money, price * order.quantity * (1 - BROKER_FEE));
      portfolio = { ...portfolio, [order.assetId]: { ...position, quantity: position.quantity - order.quantity } };
    }
    trades += 1;
  }
  return {
    money,
    portfolio,
    limitOrders: remaining,
    dailyProgress: { ...state.dailyProgress, trades: state.dailyProgress.trades + trades },
  };
}

export function monthlyBillsFor(state: LifePersistedState) {
  const lifestyleUpkeep = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.monthlyUpkeep, 0);
  const base = calculateMonthlyBills({
    housingId: state.housing.id,
    housingTenure: state.housing.tenure,
    mortgagePayment: state.housing.monthlyPayment,
    vehicleId: state.vehicle.id,
    vehicleTenure: state.vehicle.tenure,
    vehiclePayment: state.vehicle.monthlyPayment,
    foodPlanId: state.foodPlanId,
    healthPlanId: state.healthPlanId,
    childAges: state.children.map((child) => Math.max(0, (state.gameMonth - child.birthMonth) / 12)),
    privateSchoolCount: state.children.filter((child) => child.privateSchool).length,
    nanny: state.nanny,
    lifestyleUpkeep,
    loanPayments: state.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0),
    frugal: state.character.traits.includes('frugal'),
  });
  const inflation = costOfLivingMultiplier(state.gameMonth);
  const lines = base.lines.map((line) => ({ ...line, amount: line.id === 'loans' ? line.amount : line.amount * inflation }));
  const course = COURSES.find((item) => item.id === state.activeCourse?.courseId);
  if (course) {
    const tuition = course.monthlyTuition * (state.character.traits.includes('frugal') ? 0.92 : 1);
    if (tuition > 0) lines.push({ id: 'tuition', label: `${course.name} tuition`, amount: tuition });
  }
  const income = monthlyIncomeBreakdown(state);
  const tax = progressiveMonthlyTax(income.total);
  if (tax > 0) lines.push({ id: 'income-tax', label: 'Income tax', amount: tax });
  const workCosts = careerOperatingCost(income.salary, jobById(state.jobId)?.rank ?? 0);
  if (workCosts > 0) lines.push({ id: 'career-costs', label: 'Work travel & career costs', amount: workCosts });
  const companyLosses = state.companies.reduce((sum, company) => sum + companyOperatingLossPerSecond(company, state.legacyPoints), 0) * state.monthLengthSeconds;
  if (companyLosses > 0) lines.push({ id: 'company-losses', label: 'Company operating losses', amount: companyLosses });
  const wealthUpkeep = progressiveWealthUpkeep(toNumber(calculateLifeNetWorth(state)));
  if (wealthUpkeep > 0) lines.push({ id: 'wealth-upkeep', label: 'Wealth management & asset tax', amount: wealthUpkeep });
  const regularTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const annualCosts = annualFeesAndRepairs(state.gameMonth, income.total, regularTotal);
  if (annualCosts > 0) lines.push({ id: 'annual-costs', label: 'Annual fees & repairs', amount: annualCosts });
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
}

export function processGameMonth(state: LifePersistedState): Partial<LifePersistedState> {
  const nextMonth = state.gameMonth + 1;
  const bills = monthlyBillsFor(state);
  // Late balances are deliberately bounded and never earn interest on themselves.
  // This prevents a long offline catch-up from turning a small missed bill into
  // millions while still preserving the normal missed-payment consequences.
  const priorLateBalance = Math.min(Math.max(0, state.lateFees), bills.total * 2);
  const totalDue = bills.total + priorLateBalance;
  const availableCash = add(state.money, state.accruedMonthlyIncome);
  const canPay = compare(availableCash, totalDue) >= 0;
  const unpaid = canPay ? 0 : Math.max(0, totalDue - toNumber(availableCash));
  const missedPayments = canPay ? 0 : state.missedPayments + 1;
  let housing = {
    ...state.housing,
    marketValue: state.housing.marketValue * (1 + (((state.marketSeed % 9) - 4) / 1_000)),
    mortgageBalance: Math.max(0, state.housing.mortgageBalance - Math.max(0, state.housing.monthlyPayment - state.housing.mortgageBalance * 0.055 / 12)),
  };
  let vehicle = { ...state.vehicle, monthsOwned: state.vehicle.monthsOwned + 1, marketValue: state.vehicle.marketValue * 0.985, debt: Math.max(0, state.vehicle.debt - Math.max(0, state.vehicle.monthlyPayment - state.vehicle.debt * 0.07 / 12)), condition: Math.max(25, state.vehicle.condition - 0.35) };
  if (missedPayments >= 2 && housing.id !== 'homeless') housing = { id: 'homeless', tenure: 'homeless', purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 };
  if (missedPayments >= 3 && (vehicle.tenure === 'lease' || vehicle.tenure === 'finance')) vehicle = { id: 'walk', tenure: 'walk', purchasePrice: 0, marketValue: 0, debt: 0, monthlyPayment: 0, monthsOwned: 0, condition: 100 };
  const loans = state.loans.map((loan) => ({ ...loan, balance: Math.max(0, loan.balance - Math.max(0, loan.monthlyPayment - loan.balance * loan.annualRate / 12)), monthsRemaining: Math.max(0, loan.monthsRemaining - 1) })).filter((loan) => loan.balance > 0.01);
  const home = housingById(housing.id);
  const familySize = 1 + (state.partner ? 1 : 0) + state.children.length;
  const overcrowding = Math.max(0, familySize - home.capacity) * 7;
  const partner = state.partner ? {
    ...state.partner,
    monthsTogether: state.partner.monthsTogether + 1,
    happiness: Math.max(0, Math.min(100, state.partner.happiness - 2 - overcrowding / 3 - (canPay ? 0 : 8) + (state.happiness >= 75 ? 1 : 0))),
    affection: Math.max(0, Math.min(100, state.partner.affection + (state.partner.happiness >= 75 ? 1 : -1) - (canPay ? 0 : 3))),
  } : null;
  const food = FOOD_PLANS.find((item) => item.id === state.foodPlanId) ?? FOOD_PLANS[0];
  const healthcare = HEALTH_PLANS.find((item) => item.id === state.healthPlanId) ?? HEALTH_PLANS[0];
  const children = state.children.map((child) => ({ ...child, happiness: Math.max(0, Math.min(100, child.happiness + (canPay ? 1 : -4) - overcrowding / 4)), education: Math.min(100, child.education + (child.privateSchool ? 2 : 1)) }));
  const familyAverage = children.length > 0 ? children.reduce((sum, child) => sum + child.happiness, 0) / children.length : 70;
  const partnerSupport = partner ? (partner.affection + partner.happiness) / 100 : 0;
  const happiness = Math.max(0, Math.min(100, state.happiness + food.happiness + home.comfort / 25 + partnerSupport + familyAverage / 70 - 5 - overcrowding - (canPay ? 0 : 12)));
  const exhaustionPenalty = state.energy < 20 ? 2 : state.energy < 40 ? 1 : 0;
  const stressPenalty = state.stress >= 80 ? 2 : state.stress >= 60 ? 1 : 0;
  const health = Math.max(0, Math.min(100, state.health + healthcare.health + food.health - 1 - exhaustionPenalty - stressPenalty));
  const monthlyIncome = toNumber(state.accruedMonthlyIncome);
  const jobExperienceMonths = state.jobId
    ? { ...state.jobExperienceMonths, [state.jobId]: (state.jobExperienceMonths[state.jobId] ?? 0) + 1 }
    : state.jobExperienceMonths;
  const currentJobMonths = state.jobId ? jobExperienceMonths[state.jobId] ?? 0 : 0;
  const jobSkillMilestones = { ...state.jobSkillMilestones };
  const skills = { ...state.skills };
  if (state.jobId) {
    const growth = JOB_SKILL_GROWTH[state.jobId];
    if (growth) {
      const awardedMilestones = jobSkillMilestones[state.jobId] ?? 0;
      const earnedMilestones = Math.floor(currentJobMonths / growth.intervalMonths);
      const pendingMilestones = Math.max(0, earnedMilestones - awardedMilestones);
      if (pendingMilestones > 0) {
        for (const [skill, amount] of Object.entries(growth.rewards) as [SkillName, number][]) {
          skills[skill] += amount * pendingMilestones;
        }
        jobSkillMilestones[state.jobId] = earnedMilestones;
      }
    }
  }
  const promotionEligible = !!state.jobId
    && state.promotionLevel < MAX_PROMOTION_LEVEL
    && currentJobMonths >= (state.promotionLevel + 1) * 3
    && state.performance >= 100;
  const promotionLevel = promotionEligible
    ? state.promotionLevel + 1
    : state.promotionLevel;
  return {
    money: canPay ? subtract(availableCash, totalDue) : zero(),
    accruedMonthlyIncome: zero(),
    lifetimeEarnings: add(state.lifetimeEarnings, state.accruedMonthlyIncome),
    totalSpent: add(state.totalSpent, Math.min(totalDue, toNumber(availableCash))),
    gameMonth: nextMonth,
    age: 18 + Math.floor(nextMonth / 12),
    lateFees: canPay ? 0 : Math.min(bills.total * 2, unpaid + bills.total * 0.05),
    missedPayments,
    housing,
    vehicle,
    loans,
    partner,
    children,
    happiness,
    health,
    energy: Math.max(0, Math.min(100, state.energy + (state.nanny || children.length === 0 ? 3 : -children.length * 2))),
    jobExperienceMonths,
    jobSkillMilestones,
    skills,
    promotionLevel,
    performance: promotionEligible ? 0 : state.performance,
    monthlyBudgets: [...state.monthlyBudgets, { month: nextMonth, income: monthlyIncome, expenses: totalDue, unpaid, lines: bills.lines }].slice(-12),
  };
}

function segmentIncome(state: LifePersistedState, seconds: number, salaryLimit = Number.POSITIVE_INFINITY) {
  const salary = Math.min(salaryLimit, jobSalaryPerSecond(state) * seconds);
  const businessBase = state.companies.reduce((sum, company) => sum + companyProfitPerSecond(company, state.legacyPoints), 0);
  const business = businessBase * (state.character.traits.includes('risk-taker') ? 1.08 : 1) * seconds;
  const partner = (state.partner?.stayAtHome ? 0 : (state.partner?.jobIncome ?? 0) / state.monthLengthSeconds) * seconds;
  const base = salary + business + partner;
  const passiveRate = LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.bonus, 0);
  const passiveBonus = base * passiveRate;
  return { salary, business, partner, passiveBonus, total: base + passiveBonus };
}

function dividendPayment(state: LifePersistedState): number {
  return Object.entries(state.portfolio).reduce((sum, [id, position]) => {
    const definition = MARKET_ASSETS.find((item) => item.id === id);
    return sum + position.quantity * (state.marketPrices[id] ?? 0) * (definition?.dividendYield ?? 0);
  }, 0);
}

function processCrossedOfflineOrders(state: LifePersistedState, previousPrices: Record<string, number>, nextPrices: Record<string, number>): LifePersistedState {
  let money = state.money;
  let portfolio = state.portfolio;
  let trades = 0;
  const remaining: LimitOrder[] = [];
  for (const order of state.limitOrders) {
    const previous = previousPrices[order.assetId] ?? 0;
    const next = nextPrices[order.assetId] ?? previous;
    const crossed = order.side === 'buy' ? previous > order.targetPrice && next <= order.targetPrice : previous < order.targetPrice && next >= order.targetPrice;
    if (!crossed) {
      remaining.push(order);
      continue;
    }
    const position = portfolio[order.assetId] ?? { quantity: 0, averageBuyPrice: 0 };
    if (order.side === 'buy') {
      const cost = order.targetPrice * order.quantity * (1 + BROKER_FEE);
      if (compare(money, cost) < 0) {
        remaining.push(order);
        continue;
      }
      money = subtract(money, cost);
      portfolio = { ...portfolio, [order.assetId]: { quantity: position.quantity + order.quantity, averageBuyPrice: averagePriceAfterBuy(position.quantity, position.averageBuyPrice, order.quantity, order.targetPrice) } };
    } else {
      if (position.quantity < order.quantity) {
        remaining.push(order);
        continue;
      }
      money = add(money, order.targetPrice * order.quantity * (1 - BROKER_FEE));
      portfolio = { ...portfolio, [order.assetId]: { ...position, quantity: position.quantity - order.quantity } };
    }
    trades += 1;
  }
  return { ...state, money, portfolio, limitOrders: remaining, dailyProgress: { ...state.dailyProgress, trades: state.dailyProgress.trades + trades } };
}

export function offlineClaimAmount(netPositive: BigValue, multiplierValue: 1 | 2): BigValue {
  return compare(netPositive, 0) > 0 ? multiply(netPositive, multiplierValue) : zero();
}

export function simulateOfflineProgress(saved: LifePersistedState, now: number): { state: LifePersistedState; summary: OfflineSummary } {
  const rawAwayMilliseconds = now - saved.lastSeenTimestamp;
  const countedSeconds = cappedOfflineSeconds(rawAwayMilliseconds);
  const actualSeconds = countedSeconds === 0 && rawAwayMilliseconds !== 0 ? 0 : Math.max(0, rawAwayMilliseconds / 1_000);
  const startingMoney = saved.money;
  let state: LifePersistedState = { ...saved };
  let salaryIncome = zero();
  let businessIncome = zero();
  let partnerIncome = zero();
  let passiveBonusIncome = zero();
  let dividendIncome = zero();
  let totalIncome = zero();
  let expensesPaid = zero();
  let monthsAdvanced = 0;
  let remaining = countedSeconds;
  const monthLength = Math.max(1, state.monthLengthSeconds);
  // A capped interval can straddle a month boundary, so it may need two
  // segments even though it may advance only one complete game month.
  const segmentSafetyLimit = OFFLINE_CAP_GAME_MONTHS + 1;
  let processedSegments = 0;
  let remainingSalary = jobSalaryPerSecond(state) * monthLength * OFFLINE_SALARY_MONTHS;

  while (remaining > 0.0001 && processedSegments < segmentSafetyLimit) {
    processedSegments += 1;
    const untilMonth = Math.max(0.0001, monthLength - state.monthProgressSeconds);
    const step = Math.min(remaining, untilMonth);
    const income = segmentIncome(state, step, remainingSalary);
    remainingSalary = Math.max(0, remainingSalary - income.salary);
    salaryIncome = add(salaryIncome, income.salary);
    businessIncome = add(businessIncome, income.business);
    partnerIncome = add(partnerIncome, income.partner);
    passiveBonusIncome = add(passiveBonusIncome, income.passiveBonus);
    totalIncome = add(totalIncome, income.total);
    state = {
      ...state,
      accruedMonthlyIncome: add(state.accruedMonthlyIncome, income.total),
      totalPlaySeconds: state.totalPlaySeconds + step,
      monthProgressSeconds: state.monthProgressSeconds + step,
      energy: state.jobId ? Math.max(0, state.energy - step * (state.character.traits.includes('hard-worker') ? 0.009 : 0.012)) : Math.min(100, state.energy + step * 0.018),
      stress: state.jobId ? Math.min(100, state.stress + step * 0.006) : Math.max(0, state.stress - step * 0.012),
    };
    remaining -= step;
    if (state.monthProgressSeconds + 0.0001 >= monthLength) {
      const dividends = dividendPayment(state);
      if (dividends > 0) {
        dividendIncome = add(dividendIncome, dividends);
        totalIncome = add(totalIncome, dividends);
        state = { ...state, accruedMonthlyIncome: add(state.accruedMonthlyIncome, dividends) };
      }
      const bills = monthlyBillsFor(state);
      const totalDue = bills.total + state.lateFees;
      expensesPaid = add(expensesPaid, Math.min(totalDue, toNumber(add(state.money, state.accruedMonthlyIncome))));
      state = { ...state, monthProgressSeconds: Math.max(0, state.monthProgressSeconds - monthLength), ...processGameMonth(state) };
      monthsAdvanced += 1;
    }
  }

  if (state.activeCourse) state = { ...state, ...courseReadyPatch(state) };

  let netPositive = zero();
  let cashLoss = zero();
  if (compare(state.money, startingMoney) > 0) {
    netPositive = subtract(state.money, startingMoney);
    state = { ...state, money: startingMoney };
  } else if (compare(state.money, startingMoney) < 0) {
    cashLoss = subtract(startingMoney, state.money);
  }

  let market = { prices: state.marketPrices, trends: state.marketTrends, history: state.marketHistory, seed: state.marketSeed, news: state.marketNews };
  const marketTicks = Math.floor(countedSeconds / 30);
  for (let index = 0; index < marketTicks; index += 1) {
    const previousPrices = market.prices;
    market = advanceMarket(market, saved.lastSeenTimestamp + (index + 1) * 30_000);
    state = processCrossedOfflineOrders(state, previousPrices, market.prices);
  }
  state = { ...state, marketPrices: market.prices, marketTrends: market.trends, marketHistory: market.history, marketSeed: market.seed, marketNews: market.news, lastMarketTick: now, lastDividendAt: now };

  return {
    state,
    summary: { actualSeconds, countedSeconds, monthsAdvanced, salaryIncome, businessIncome, partnerIncome, passiveBonusIncome, dividendIncome, totalIncome, expensesPaid, netPositive, cashLoss },
  };
}

export const useLifeStore = create<LifeStore>((set, get) => ({
  ...createInitialLifeState(),
  hydrated: false,
  runtimeNow: Date.now(),
  offlineEarnings: zero(),
  offlineSeconds: 0,
  offlineSummary: null,
  monthlySummary: null,
  activeLifeEvent: null,
  celebrationNonce: 0,

  hydrate: (saved) => {
    const now = Date.now();
    if (!saved) {
      set({ ...createInitialLifeState(now), hydrated: true, runtimeNow: now, offlineEarnings: zero(), offlineSeconds: 0, offlineSummary: null, monthlySummary: null, activeLifeEvent: null });
      return;
    }
    const merged = { ...createInitialLifeState(now), ...saved, monthLengthSeconds: GAME_MONTH_SECONDS };
    const offline = simulateOfflineProgress(merged, now);
    const progressed = offline.state;
    set({
      ...progressed,
      ...dailyPatch(progressed, now),
      hydrated: true,
      runtimeNow: now,
      lastSeenTimestamp: now,
      lastSavedAt: now,
      offlineEarnings: offline.summary.netPositive,
      offlineSeconds: offline.summary.countedSeconds,
      offlineSummary: offline.summary,
      monthlySummary: null,
      activeLifeEvent: null,
      nextLifeEventAt: futureEvent(now),
    });
  },

  tick: (elapsedMilliseconds, now) => {
    const state = get();
    if (!state.hydrated) return;
    const rawSeconds = Math.max(0, Math.min(5, elapsedMilliseconds / 1_000));
    if (state.timeSpeed === 0) {
      set({ runtimeNow: now });
      return;
    }
    const seconds = rawSeconds * state.timeSpeed;
    const income = multiply(totalIncomePerSecond(state), seconds);
    const totalPlaySeconds = state.totalPlaySeconds + seconds;
    const monthProgress = state.monthProgressSeconds + seconds;
    const monthDue = monthProgress >= state.monthLengthSeconds;
    const hasJob = !!state.jobId;
    const workDrain = state.character.traits.includes('hard-worker') ? 0.009 : 0.012;
    const nextEnergy = hasJob ? Math.max(0, state.energy - seconds * workDrain) : Math.min(100, state.energy + seconds * 0.018);
    const nextStress = hasJob ? Math.min(100, state.stress + seconds * 0.006) : Math.max(0, state.stress - seconds * 0.012);
    const shouldMarketTick = now - state.lastMarketTick >= 2_000;
    const market = shouldMarketTick
      ? advanceMarket({ prices: state.marketPrices, trends: state.marketTrends, history: state.marketHistory, seed: state.marketSeed, news: state.marketNews }, now)
      : null;
    const dividendDue = now - state.lastDividendAt >= 60_000;
    const dividends = dividendDue
      ? Object.entries(state.portfolio).reduce((sum, [id, position]) => {
        const definition = MARKET_ASSETS.find((item) => item.id === id);
        return sum + position.quantity * (state.marketPrices[id] ?? 0) * (definition?.dividendYield ?? 0);
      }, 0)
      : 0;
    const eventDue = now >= state.nextLifeEventAt && !state.activeLifeEvent;
    const nextBase: Partial<LifeStore> = {
      ...dailyPatch(state, now),
      accruedMonthlyIncome: add(add(state.accruedMonthlyIncome, income), dividends),
      energy: nextEnergy,
      stress: nextStress,
      totalPlaySeconds,
      monthProgressSeconds: monthDue ? monthProgress - state.monthLengthSeconds : monthProgress,
      runtimeNow: now,
      activeCourse: state.activeCourse,
      activeLifeEvent: eventDue ? createLifeEvent(now, state.marketSeed, state.health, state.stress) : state.activeLifeEvent,
      nextLifeEventAt: eventDue ? futureEvent(now) : state.nextLifeEventAt,
      lastDividendAt: dividendDue ? now : state.lastDividendAt,
    };
    if (market) Object.assign(nextBase, {
      marketPrices: market.prices,
      marketTrends: market.trends,
      marketHistory: market.history,
      marketSeed: market.seed,
      marketNews: market.news,
      lastMarketTick: now,
    });
    set(nextBase);
    if (monthDue) {
      const beforeMonth = get();
      const bills = monthlyBillsFor(beforeMonth);
      const expenses = bills.total + beforeMonth.lateFees;
      const incomeForMonth = toNumber(beforeMonth.accruedMonthlyIncome);
      const month = beforeMonth.gameMonth + 1;
      const processed = processGameMonth(beforeMonth);
      const promoted = (processed.promotionLevel ?? beforeMonth.promotionLevel) > beforeMonth.promotionLevel;
      const afterMonth = { ...beforeMonth, ...processed } as LifePersistedState;
      const readyPatch = courseReadyPatch(afterMonth);
      set({
        ...processed,
        ...readyPatch,
        monthlySummary: { month, income: incomeForMonth, expenses, unpaid: Math.max(0, expenses - toNumber(beforeMonth.money)), lines: bills.lines, net: incomeForMonth - expenses, birthday: month % 12 === 0, promotion: promoted },
        celebrationNonce: month % 12 === 0 || promoted || Object.keys(readyPatch).length > 0 ? beforeMonth.celebrationNonce + 1 : beforeMonth.celebrationNonce,
      });
    }
    if (market && state.limitOrders.length > 0) set(processLimitOrders(get()));
  },

  workHard: () => {
    const state = get();
    const job = jobById(state.jobId);
    if (!job || state.energy < 5 || state.stress >= 98) return false;
    const lifestyleBonus = 1 + LIFESTYLE_ITEMS.filter((item) => state.ownedLifestyle.includes(item.id)).reduce((sum, item) => sum + item.bonus, 0);
    const traitBonus = state.character.traits.includes('hard-worker') ? 1.15 : 1;
    const reward = job.hardWorkBonus * (1 + state.promotionLevel * 0.2) * legacyMultiplier(state.legacyPoints) * lifestyleBonus * traitBonus;
    const performance = Math.min(100, state.performance + 10);
    const patch = dailyPatch(state);
    const progress = patch.dailyProgress ?? state.dailyProgress;
    set({
      ...patch,
      accruedMonthlyIncome: add(state.accruedMonthlyIncome, reward),
      energy: Math.max(0, state.energy - 5),
      stress: Math.min(100, state.stress + 3),
      performance,
      dailyProgress: { ...progress, workTaps: progress.workTaps + 1 },
      celebrationNonce: state.celebrationNonce,
    });
    return true;
  },

  rest: () => { get().performWellnessAction('sleep'); },
  enjoyHobby: () => get().performWellnessAction('hobby'),
  performWellnessAction: (actionId) => {
    const state = get();
    const action = wellnessActionById(actionId);
    if (state.wellnessActionMonths[actionId] === state.gameMonth || compare(state.money, action.cost) < 0 || state.energy + action.effects.energy < 0) return false;
    set({
      money: subtract(state.money, action.cost),
      totalSpent: add(state.totalSpent, action.cost),
      energy: Math.max(0, Math.min(100, state.energy + action.effects.energy)),
      health: Math.max(0, Math.min(100, state.health + action.effects.health)),
      happiness: Math.max(0, Math.min(100, state.happiness + action.effects.happiness)),
      stress: Math.max(0, Math.min(100, state.stress + action.effects.stress)),
      wellnessActionMonths: { ...state.wellnessActionMonths, [actionId]: state.gameMonth },
    });
    return true;
  },

  startCourse: (courseId) => {
    const state = get();
    const course = COURSES.find((item) => item.id === courseId);
    if (!course || state.activeCourse || state.completedCourses.includes(courseId) || compare(state.money, course.cost) < 0 || state.energy < 10) return false;
    if (course.prerequisite && !state.completedCourses.includes(course.prerequisite)) return false;
    const housingStatus = housingById(state.housing.id).status;
    const foodLevel = Math.max(0, FOOD_PLANS.findIndex((plan) => plan.id === state.foodPlanId));
    const vehicleStatus = vehicleById(state.vehicle.id).status;
    if (housingStatus < course.living.housingStatus || foodLevel < course.living.foodLevel || vehicleStatus < course.living.vehicleStatus) return false;
    set({ money: subtract(state.money, course.cost), totalSpent: add(state.totalSpent, course.cost), energy: state.energy - 10, activeCourse: { courseId, enrolledMonth: state.gameMonth, activeProgress: 0, examReady: false, examAttempts: 0 }, tutorialStep: 3 });
    return true;
  },
  finishCourseNow: () => {
    const state = get();
    if (!state.activeCourse) return;
    set({ ...courseReadyPatch(state) });
  },
  fastForwardCourseMonth: () => {
    const state = get();
    const activeCourse = state.activeCourse;
    if (!activeCourse || activeCourse.examReady) return false;
    const course = COURSES.find((item) => item.id === activeCourse.courseId);
    if (!course) return false;
    const gain = Math.min(5, 50 - activeCourse.activeProgress);
    if (gain <= 0) return false;
    const nextActive = { ...activeCourse, activeProgress: activeCourse.activeProgress + gain };
    set({ activeCourse: nextActive, ...courseReadyPatch({ ...state, activeCourse: nextActive }) });
    return true;
  },
  studyActiveCourse: () => {
    const state = get();
    if (!state.activeCourse || state.energy < STUDY_SESSION_ENERGY || state.activeCourse.activeProgress >= 50) return false;
    const gain = activeStudyGain(state.skills.intelligence, state.energy);
    const nextActive = { ...state.activeCourse, activeProgress: Math.min(50, state.activeCourse.activeProgress + gain) };
    set({ activeCourse: nextActive, ...courseReadyPatch({ ...state, activeCourse: nextActive }), energy: state.energy - STUDY_SESSION_ENERGY, stress: Math.min(100, state.stress + 2) });
    return true;
  },
  takeCourseExam: () => {
    const state = get();
    const active = state.activeCourse;
    const course = COURSES.find((item) => item.id === active?.courseId);
    const progress = active && course ? courseProgress(active, course, state.gameMonth) : null;
    if (!active || !course || !active.examReady || !progress?.readyToGraduate || state.energy < STUDY_SESSION_ENERGY) return 'unavailable';
    const retakeCost = active.examAttempts > 0 ? course.retakeFee : 0;
    if (compare(state.money, retakeCost) < 0) return 'unavailable';
    const random = nextRandom({ seed: state.marketSeed + active.examAttempts + state.gameMonth });
    const passed = random.value <= examSuccessChance({ intelligence: state.skills.intelligence, studyProgress: progress.totalProgress, health: state.health, happiness: state.happiness, attempts: active.examAttempts });
    if (passed) {
      set({ ...courseCompletedPatch(state), money: subtract(state.money, retakeCost), totalSpent: add(state.totalSpent, retakeCost), marketSeed: random.next.seed, gems: state.gems + 1, reputation: state.reputation + 2, celebrationNonce: state.celebrationNonce + 1 });
      return 'passed';
    }
    set({ money: subtract(state.money, retakeCost), totalSpent: add(state.totalSpent, retakeCost), energy: state.energy - STUDY_SESSION_ENERGY, marketSeed: random.next.seed, activeCourse: { ...active, examAttempts: active.examAttempts + 1, activeProgress: Math.max(25, active.activeProgress - 15), examReady: false } });
    return 'failed';
  },
  takeJob: (jobId) => {
    const state = get();
    const job = jobById(jobId);
    if (!job || !jobRequirementsMet(state, jobId) || state.energy < 15) return false;
    const requiredSkills = Object.entries(job.requiredSkills ?? {});
    const skillFit = requiredSkills.length === 0 ? 3 : requiredSkills.reduce((sum, [key, value]) => sum + Math.max(0, state.skills[key as SkillName] - (value ?? 0)), 0) / requiredSkills.length;
    const random = nextRandom({ seed: state.marketSeed + state.gameMonth + jobId.length });
    const onboardingCourier = jobId === 'courier' && state.tutorialStep === 0 && !state.jobId;
    const hired = onboardingCourier || random.value <= interviewSuccessChance(state.skills.charisma, skillFit, state.jobExperienceMonths[jobId] ?? 0);
    set({
      jobId: hired ? jobId : state.jobId,
      performance: hired ? 0 : state.performance,
      promotionLevel: hired ? 0 : state.promotionLevel,
      energy: state.energy - 15,
      happiness: Math.max(0, Math.min(100, state.happiness + (hired ? 4 : -2))),
      reputation: state.reputation + (hired ? 1 : 0),
      marketSeed: random.next.seed,
      celebrationNonce: hired ? state.celebrationNonce + 1 : state.celebrationNonce,
      tutorialStep: hired && state.tutorialStep < 2 ? 2 : state.tutorialStep,
    });
    return hired;
  },
  quitJob: () => set({ jobId: null, performance: 0, promotionLevel: 0 }),

  foundCompany: (typeId, name) => {
    const state = get();
    const definition = companyTypeById(typeId);
    const tier = Math.max(0, COMPANY_TYPES.findIndex((item) => item.id === typeId));
    if (!hasBusinessAccess(state) || !name.trim() || compare(state.money, definition.startupCost) < 0 || state.energy < 10 || state.reputation < Math.max(0, tier * 2)) return false;
    const company: PlayerCompany = { id: `${typeId}-${Date.now()}`, typeId, name: name.trim().slice(0, 24), level: 1, employees: [], upgrades: { marketing: 0, equipment: 0, location: 0 }, reputation: 30, manager: false, boostUntil: 0, isPublic: false, ownership: 1 };
    const patch = dailyPatch(state);
    const progress = patch.dailyProgress ?? state.dailyProgress;
    set({ ...patch, money: subtract(state.money, definition.startupCost), totalSpent: add(state.totalSpent, definition.startupCost), energy: state.energy - 10, reputation: state.reputation + 2, companies: [...state.companies, company], dailyProgress: { ...progress, businessActions: progress.businessActions + 1 } });
    return true;
  },
  hireEmployee: (companyId) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company) return false;
    const definition = companyTypeById(company.typeId);
    const hiringCost = companyHiringCost(company);
    if (compare(state.money, hiringCost) < 0) return false;
    const random = nextRandom({ seed: state.marketSeed + company.employees.length + Date.now() });
    const employee: Employee = { id: `employee-${Date.now()}-${company.employees.length}`, name: EMPLOYEE_NAMES[Math.floor(random.value * EMPLOYEE_NAMES.length)] ?? 'Taylor', salaryPerSecond: definition.employeeBaseSalary * (0.9 + random.value * 0.4), productivity: Math.round(70 + random.value * 50) };
    set({ money: subtract(state.money, hiringCost), totalSpent: add(state.totalSpent, hiringCost), companies: state.companies.map((item) => item.id === companyId ? { ...item, employees: [...item.employees, employee], reputation: Math.min(100, item.reputation + 1) } : item), marketSeed: random.next.seed });
    return true;
  },
  fireEmployee: (companyId) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company || company.employees.length === 0) return false;
    set({ companies: state.companies.map((item) => item.id === companyId ? { ...item, employees: item.employees.slice(0, -1), reputation: Math.max(5, item.reputation - 2) } : item) });
    return true;
  },
  upgradeCompany: (companyId, kind) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company) return false;
    const cost = companyUpgradeCost(company, kind);
    if (compare(state.money, cost) < 0) return false;
    set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), companies: state.companies.map((item) => item.id === companyId ? { ...item, upgrades: { ...item.upgrades, [kind]: item.upgrades[kind] + 1 }, level: item.level + 1, reputation: Math.min(100, item.reputation + 3) } : item) });
    return true;
  },
  hireManager: (companyId) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company || company.manager) return false;
    const cost = companyTypeById(company.typeId).startupCost * 1.5;
    if (compare(state.money, cost) < 0) return false;
    set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), companies: state.companies.map((item) => item.id === companyId ? { ...item, manager: true } : item) });
    return true;
  },
  boostCompany: (companyId) => set((state) => state.energy < 8 ? state : ({ energy: state.energy - 8, companies: state.companies.map((item) => item.id === companyId ? { ...item, boostUntil: Date.now() + 30_000, reputation: Math.min(100, item.reputation + 0.5) } : item) })),
  sellCompany: (companyId) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company) return false;
    const proceeds = companyValuation(company) * 0.75;
    set({ money: add(state.money, proceeds), lifetimeEarnings: add(state.lifetimeEarnings, proceeds), companies: state.companies.filter((item) => item.id !== companyId) });
    return true;
  },
  ipoCompany: (companyId) => {
    const state = get();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company || company.isPublic || company.level < 5 || company.reputation < 60) return false;
    const proceeds = companyValuation(company) * 0.35;
    set({ money: add(state.money, proceeds), lifetimeEarnings: add(state.lifetimeEarnings, proceeds), companies: state.companies.map((item) => item.id === companyId ? { ...item, isPublic: true, ownership: 0.65 } : item), celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },

  tradeMarket: (assetId, side, rawQuantity) => {
    const state = get();
    const quantity = Math.floor(rawQuantity * 1000) / 1000;
    const price = state.marketPrices[assetId];
    if (!price || quantity <= 0 || (side === 'buy' && !hasBrokerAccess(state))) return false;
    const position = state.portfolio[assetId] ?? { quantity: 0, averageBuyPrice: 0 };
    if (side === 'buy') {
      const cost = price * quantity * (1 + BROKER_FEE);
      if (compare(state.money, cost) < 0) return false;
      set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), portfolio: { ...state.portfolio, [assetId]: { quantity: position.quantity + quantity, averageBuyPrice: averagePriceAfterBuy(position.quantity, position.averageBuyPrice, quantity, price) } }, dailyProgress: { ...state.dailyProgress, trades: state.dailyProgress.trades + 1 } });
    } else {
      if (position.quantity < quantity) return false;
      const proceeds = price * quantity * (1 - BROKER_FEE);
      set({ money: add(state.money, proceeds), lifetimeEarnings: add(state.lifetimeEarnings, proceeds), portfolio: { ...state.portfolio, [assetId]: { ...position, quantity: position.quantity - quantity } }, dailyProgress: { ...state.dailyProgress, trades: state.dailyProgress.trades + 1 } });
    }
    return true;
  },
  placeLimitOrder: (assetId, side, quantity, targetPrice) => {
    if (quantity <= 0 || targetPrice <= 0) return false;
    const state = get();
    if (side === 'buy' && !hasBrokerAccess(state)) return false;
    if (side === 'sell' && (state.portfolio[assetId]?.quantity ?? 0) < quantity) return false;
    set({ limitOrders: [...state.limitOrders, { id: `order-${Date.now()}`, assetId, side, quantity, targetPrice }] });
    return true;
  },
  cancelLimitOrder: (orderId) => set((state) => ({ limitOrders: state.limitOrders.filter((order) => order.id !== orderId) })),
  toggleWatchlist: (assetId) => set((state) => ({ watchlist: state.watchlist.includes(assetId) ? state.watchlist.filter((id) => id !== assetId) : [...state.watchlist, assetId] })),

  placeCasinoWager: (amount) => {
    const state = get();
    if (amount <= 0 || compare(state.money, amount) < 0 || state.dailyCasinoLoss + amount > state.dailyLossLimit) return false;
    set({ money: subtract(state.money, amount), dailyCasinoLoss: state.dailyCasinoLoss + amount, partner: state.partner ? { ...state.partner, affection: Math.max(0, state.partner.affection - Math.min(1.5, amount / Math.max(1_000, state.dailyLossLimit))) } : null, casinoStats: { ...state.casinoStats, totalWagered: state.casinoStats.totalWagered + amount, gamesPlayed: state.casinoStats.gamesPlayed + 1 } });
    return true;
  },
  creditCasinoPayout: (amount) => {
    if (amount <= 0) return;
    set((state) => ({ money: add(state.money, amount), lifetimeEarnings: add(state.lifetimeEarnings, amount), dailyCasinoLoss: Math.max(0, state.dailyCasinoLoss - amount), casinoStats: { ...state.casinoStats, totalWon: state.casinoStats.totalWon + amount } }));
  },
  setDailyLossLimit: (dailyLossLimit) => set({ dailyLossLimit: Math.max(100, Math.floor(dailyLossLimit)) }),

  buyLifestyle: (itemId) => {
    const state = get();
    const item = LIFESTYLE_ITEMS.find((entry) => entry.id === itemId);
    if (!item || state.ownedLifestyle.includes(itemId) || compare(state.money, item.cost) < 0) return false;
    set({ money: subtract(state.money, item.cost), totalSpent: add(state.totalSpent, item.cost), ownedLifestyle: [...state.ownedLifestyle, itemId], celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  buyGood: (itemId) => {
    const state = get();
    const item = consumerGoodById(itemId);
    if (!item || state.ownedGoods.includes(itemId) || compare(state.money, item.price) < 0) return false;
    set({
      money: subtract(state.money, item.price),
      totalSpent: add(state.totalSpent, item.price),
      ownedGoods: [...state.ownedGoods, item.id],
      happiness: Math.min(100, state.happiness + item.happiness),
      celebrationNonce: state.celebrationNonce + 1,
    });
    return true;
  },
  claimOffline: (multiplierValue) => {
    const state = get();
    const reward = offlineClaimAmount(state.offlineEarnings, multiplierValue);
    const bonus = multiplierValue === 2 ? state.offlineEarnings : zero();
    set({ money: add(state.money, reward), lifetimeEarnings: add(state.lifetimeEarnings, bonus), offlineEarnings: zero(), offlineSeconds: 0, offlineSummary: null });
  },
  claimDaily: () => {
    const state = get();
    const today = dateKey();
    if (state.lastDailyClaim === today) return false;
    const yesterday = dateKey(Date.now() - 86_400_000);
    const streak = state.lastDailyClaim === yesterday ? (state.dailyStreak % 7) + 1 : 1;
    const reward = DAILY_REWARD_AMOUNTS[streak - 1] ?? DAILY_REWARD_AMOUNTS[DAILY_REWARD_AMOUNTS.length - 1]!;
    set({ money: add(state.money, reward), lifetimeEarnings: add(state.lifetimeEarnings, reward), dailyStreak: streak, lastDailyClaim: today, celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  claimRewardedCash: () => {
    const state = get();
    const reward = 1_000;
    set({
      money: add(state.money, reward),
      lifetimeEarnings: add(state.lifetimeEarnings, reward),
      celebrationNonce: state.celebrationNonce + 1,
    });
  },
  applyVerifiedCashDelta: (amount) => {
    if (!Number.isSafeInteger(amount) || amount === 0) return;
    const state = get();
    if (amount < 0) {
      set({ money: subtract(state.money, Math.abs(amount)) });
      return;
    }
    set({
      money: add(state.money, amount),
      lifetimeEarnings: add(state.lifetimeEarnings, amount),
      celebrationNonce: state.celebrationNonce + 1,
    });
  },
  claimMission: (id) => {
    const state = get();
    if (state.claimedDailyMissions.includes(id)) return false;
    const complete = id === 'work' ? state.dailyProgress.workTaps >= 10 : id === 'trade' ? state.dailyProgress.trades >= 3 : state.dailyProgress.businessActions >= 2;
    if (!complete) return false;
    const reward = id === 'work' ? DAILY_MISSION_REWARDS.work : id === 'trade' ? DAILY_MISSION_REWARDS.trade : DAILY_MISSION_REWARDS.business;
    set({ money: add(state.money, reward), lifetimeEarnings: add(state.lifetimeEarnings, reward), claimedDailyMissions: [...state.claimedDailyMissions, id] });
    return true;
  },
  claimAchievement: (id) => {
    const state = get();
    if (state.claimedAchievements.includes(id)) return false;
    const netWorth = toNumber(calculateLifeNetWorth(state));
    const complete = id === 'graduate' ? state.completedCourses.length >= 1
      : id === 'founder' ? state.companies.length >= 1
        : id === 'investor' ? Object.values(state.portfolio).some((position) => position.quantity > 0)
          : id === 'first-home' ? state.housing.marketValue > 0
            : id === 'first-car' ? state.vehicle.id !== 'public' && state.vehicle.id !== 'walk'
              : id === 'married' ? state.partner?.stage === 'married'
                : id === 'parent' ? state.children.length > 0
                  : id === 'debt-free' ? state.loans.length === 0 && state.housing.mortgageBalance === 0 && state.vehicle.debt === 0 && state.gameMonth >= 1
                    : id === 'mansion' ? state.housing.id === 'mansion' || state.housing.id === 'penthouse'
                      : id === 'millionaire' ? netWorth >= 1_000_000 : netWorth >= 1_000_000_000;
    if (!complete) return false;
    const reward = id === 'graduate' ? 1_000 : id === 'founder' ? 5_000 : id === 'investor' ? 2_500 : id === 'first-home' ? 10_000 : id === 'first-car' ? 2_000 : id === 'married' ? 5_000 : id === 'parent' ? 7_500 : id === 'debt-free' ? 15_000 : id === 'mansion' ? 250_000 : id === 'millionaire' ? 100_000 : 10_000_000;
    set({ money: add(state.money, reward), lifetimeEarnings: add(state.lifetimeEarnings, reward), claimedAchievements: [...state.claimedAchievements, id], celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  resolveLifeEvent: (choice) => {
    const state = get();
    const event = state.activeLifeEvent;
    if (!event) return;
    const sceneEvent = lifeEventById(event.eventId);
    if (sceneEvent && typeof choice === 'number') {
      if (choice < 0) {
        set({ activeLifeEvent: null, happiness: Math.max(0, state.happiness - 1) });
        return;
      }
      const selected = sceneEvent.choices[choice];
      if (!selected) return;
      const cashBase = toNumber(state.money);
      const flat = selected.outcome.cashFlat ?? 0;
      const percent = selected.outcome.cashPercent ?? 0;
      const delta = flat + cashBase * percent;
      const amountSpent = delta < 0 ? Math.min(cashBase, Math.abs(delta)) : 0;
      set({
        money: delta >= 0 ? add(state.money, delta) : subtract(state.money, amountSpent),
        lifetimeEarnings: delta > 0 ? add(state.lifetimeEarnings, delta) : state.lifetimeEarnings,
        totalSpent: amountSpent > 0 ? add(state.totalSpent, amountSpent) : state.totalSpent,
        happiness: Math.max(0, Math.min(100, state.happiness + (selected.outcome.happiness ?? 0))),
        health: Math.max(0, Math.min(100, state.health + (selected.outcome.health ?? 0))),
        energy: Math.max(0, Math.min(100, state.energy + (selected.outcome.energy ?? 0))),
        stress: Math.max(0, Math.min(100, state.stress + (selected.outcome.stress ?? 0))),
        reputation: Math.max(0, state.reputation + (selected.outcome.reputation ?? 0)),
        gems: Math.max(0, state.gems + (selected.outcome.gems ?? 0)),
        activeLifeEvent: null,
        celebrationNonce: delta > 0 || (selected.outcome.reputation ?? 0) >= 5 ? state.celebrationNonce + 1 : state.celebrationNonce,
      });
      return;
    }
    let money = state.money;
    let jobId = state.jobId;
    let companies = state.companies;
    let prices = state.marketPrices;
    let vehicle = state.vehicle;
    let happiness = state.happiness;
    let partner = state.partner;
    if (event.kind === 'windfall') money = add(money, Math.max(500, totalIncomePerSecond(state) * 120));
    if (event.kind === 'tax' && choice === 'accept') money = multiply(money, 0.93);
    if (event.kind === 'medical') money = multiply(money, 0.96);
    if (event.kind === 'fired' && choice === 'accept') jobId = null;
    if (event.kind === 'marketCrash' && choice === 'accept') prices = Object.fromEntries(Object.entries(prices).map(([id, price]) => [id, price * 0.88]));
    if (event.kind === 'business' && companies.length > 0) companies = companies.map((company, index) => index === 0 ? { ...company, reputation: Math.max(5, Math.min(100, company.reputation + (state.marketSeed % 2 === 0 ? 12 : -8))) } : company);
    if (event.kind === 'breakdown' && choice === 'accept') { money = subtract(money, Math.min(toNumber(money), Math.max(250, vehicle.purchasePrice * 0.01))); vehicle = { ...vehicle, condition: Math.max(20, vehicle.condition - 12) }; }
    if (event.kind === 'bill' && choice === 'accept') money = subtract(money, Math.min(toNumber(money), Math.max(300, totalIncomePerSecond(state) * 20)));
    if (event.kind === 'invitation') { money = subtract(money, Math.min(toNumber(money), 350)); happiness = Math.min(100, happiness + 6); partner = partner ? { ...partner, affection: Math.min(100, partner.affection + 3) } : null; }
    if (event.kind === 'birthday') happiness = Math.min(100, happiness + 8);
    if (event.kind === 'promotionParty') { money = subtract(money, Math.min(toNumber(money), 500)); happiness = Math.min(100, happiness + 5); }
    set({ money, jobId, companies, marketPrices: prices, vehicle, happiness, partner, activeLifeEvent: null });
  },
  prestige: () => {
    const state = get();
    const potential = prestigePointsForLifetime(state.lifetimeEarnings);
    const gained = Math.max(0, potential - state.legacyPoints);
    if (gained <= 0) return 0;
    const fresh = createInitialLifeState();
    const retainedSkills = Object.fromEntries(Object.entries(state.skills).map(([key, value]) => [key, Math.floor(value * 0.25)])) as Skills;
    set({ ...fresh, hydrated: true, runtimeNow: Date.now(), character: state.character, legacyPoints: state.legacyPoints + gained, ownedLifestyle: state.ownedLifestyle, completedCourses: state.completedCourses, skills: retainedSkills, settings: state.settings, claimedAchievements: state.claimedAchievements, offlineEarnings: zero(), offlineSeconds: 0, offlineSummary: null, monthlySummary: null, activeLifeEvent: null, celebrationNonce: state.celebrationNonce + 1 });
    return gained;
  },
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  markSaved: (lastSavedAt) => set({ lastSavedAt, lastSeenTimestamp: lastSavedAt }),
  resetLife: () => set({ ...createInitialLifeState(), hydrated: true, runtimeNow: Date.now(), offlineEarnings: zero(), offlineSeconds: 0, offlineSummary: null, monthlySummary: null, activeLifeEvent: null }),
  startNewLife: (character) => {
    const now = Date.now();
    const fresh = createInitialLifeState(now);
    const normalizedCharacter = {
      ...character,
      backgroundId: 'street' as const,
      traits: [] as TraitId[],
      avatar: {
        ...character.avatar,
        hairStyle: normalizeHairstyleForGender(character.avatar.hairStyle, character.gender),
        skin: normalizeSkinTone(character.avatar.skin),
      },
    };
    set({ ...fresh, character: normalizedCharacter, hydrated: true, runtimeNow: now, offlineEarnings: zero(), offlineSeconds: 0, offlineSummary: null, monthlySummary: null, activeLifeEvent: null });
  },
  chooseHousing: (id, tenure) => {
    const state = get();
    const home = housingById(id);
    if (id === 'homeless') {
      set({ housing: { id, tenure: 'homeless', purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 } });
      return true;
    }
    if (home.purchasePrice === 0) {
      if (tenure !== 'rent' || compare(state.money, home.rent) < 0) return false;
      set({ money: subtract(state.money, home.rent), totalSpent: add(state.totalSpent, home.rent), housing: { id, tenure: 'rent', purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 } });
      return true;
    }
    if (tenure === 'owned') {
      if (compare(state.money, home.purchasePrice) < 0) return false;
      set({ money: subtract(state.money, home.purchasePrice), totalSpent: add(state.totalSpent, home.purchasePrice), housing: { id, tenure, purchasePrice: home.purchasePrice, marketValue: home.purchasePrice, mortgageBalance: 0, monthlyPayment: 0 }, celebrationNonce: state.celebrationNonce + 1 });
      return true;
    }
    if (tenure !== 'mortgage') return false;
    const downPayment = home.purchasePrice * 0.2;
    if (compare(state.money, downPayment) < 0) return false;
    const principal = home.purchasePrice - downPayment;
    set({ money: subtract(state.money, downPayment), totalSpent: add(state.totalSpent, downPayment), housing: { id, tenure, purchasePrice: home.purchasePrice, marketValue: home.purchasePrice, mortgageBalance: principal, monthlyPayment: mortgagePayment(principal, 0.055, 360) }, celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  sellHome: () => {
    const state = get();
    if (state.housing.marketValue <= 0) return false;
    const proceeds = Math.max(0, state.housing.marketValue * 0.94 - state.housing.mortgageBalance);
    set({ money: add(state.money, proceeds), housing: { id: 'homeless', tenure: 'homeless', purchasePrice: 0, marketValue: 0, mortgageBalance: 0, monthlyPayment: 0 } });
    return true;
  },
  chooseVehicle: (id, tenure) => {
    const state = get();
    const car = vehicleById(id);
    if (id === 'walk') {
      set({ vehicle: { id, tenure: 'walk', purchasePrice: 0, marketValue: 0, debt: 0, monthlyPayment: 0, monthsOwned: 0, condition: 100 } });
      return true;
    }
    if (id === 'public') {
      set({ vehicle: { id, tenure: 'public', purchasePrice: 0, marketValue: 0, debt: 0, monthlyPayment: 0, monthsOwned: 0, condition: 100 } });
      return true;
    }
    const upfront = tenure === 'owned' ? car.price : tenure === 'finance' ? car.price * 0.15 : car.price * 0.05;
    if (compare(state.money, upfront) < 0) return false;
    const debt = tenure === 'finance' ? car.price - upfront : 0;
    const payment = tenure === 'finance' ? mortgagePayment(debt, 0.07, 60) : tenure === 'lease' ? car.price * 0.018 : 0;
    set({ money: subtract(state.money, upfront), totalSpent: add(state.totalSpent, upfront), vehicle: { id, tenure, purchasePrice: car.price, marketValue: tenure === 'lease' ? 0 : car.price, debt, monthlyPayment: payment, monthsOwned: 0, condition: 100 }, celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  sellVehicle: () => {
    const state = get();
    if (state.vehicle.id === 'public' || state.vehicle.id === 'walk') return false;
    const proceeds = state.vehicle.tenure === 'lease' ? 0 : Math.max(0, state.vehicle.marketValue * 0.92 - state.vehicle.debt);
    set({ money: add(state.money, proceeds), vehicle: { id: 'walk', tenure: 'walk', purchasePrice: 0, marketValue: 0, debt: 0, monthlyPayment: 0, monthsOwned: 0, condition: 100 } });
    return true;
  },
  setFoodPlan: (foodPlanId) => { if (FOOD_PLANS.some((item) => item.id === foodPlanId)) set({ foodPlanId }); },
  setHealthPlan: (healthPlanId) => { if (HEALTH_PLANS.some((item) => item.id === healthPlanId)) set({ healthPlanId }); },
  meetPartner: () => {
    const state = get();
    if (state.partner) return;
    if (state.datingCandidate) return;
    set({ datingCandidate: createDatingCandidate(Date.now() + state.marketSeed + state.gameMonth * 7_919, state.age) });
  },
  acceptDatingCandidate: () => {
    const state = get();
    const candidate = state.datingCandidate;
    if (!candidate || state.partner) return false;
    const { id: _id, age, ...profile } = candidate;
    set({
      partner: {
        ...profile,
        birthMonth: state.gameMonth - age * 12,
        stage: 'dating',
        affection: 42,
        happiness: 70,
        monthsTogether: 0,
        stayAtHome: false,
        careMonths: {},
      },
      datingCandidate: null,
      happiness: Math.min(100, state.happiness + 2),
    });
    return true;
  },
  skipDatingCandidate: () => {
    const state = get();
    if (state.partner) return;
    const priorSeed = Number(state.datingCandidate?.id.replace('match-', '') ?? 0);
    set({ datingCandidate: createDatingCandidate(Date.now() + state.marketSeed + priorSeed + 104_729, state.age) });
  },
  relationshipAction: (action) => {
    const state = get();
    const partner = state.partner;
    if (!partner) return false;
    const charm = state.character.traits.includes('charming') ? 1.25 : 1;
    if (action === 'talk' || action === 'date' || action === 'gift' || action === 'weekend' || action === 'vacation' || action === 'family') {
      if (partner.careMonths[action] === state.gameMonth) return false;
      const effects: Record<PartnerCareAction, { cost: number; affection: number; partnerHappiness: number; playerHappiness: number; stress: number }> = {
        talk: { cost: 0, affection: 2, partnerHappiness: 4, playerHappiness: 1, stress: 1 },
        date: { cost: 120, affection: 7, partnerHappiness: 8, playerHappiness: 3, stress: 2 },
        gift: { cost: 600, affection: 10, partnerHappiness: 12, playerHappiness: 2, stress: 0 },
        weekend: { cost: 1_500, affection: 12, partnerHappiness: 18, playerHappiness: 5, stress: 6 },
        vacation: { cost: 5_000, affection: 16, partnerHappiness: 28, playerHappiness: 10, stress: 12 },
        family: { cost: 800, affection: 5, partnerHappiness: 12, playerHappiness: 5, stress: 3 },
      };
      const effect = effects[action];
      const cost = effect.cost;
      if (compare(state.money, cost) < 0) return false;
      set({
        money: subtract(state.money, cost),
        totalSpent: add(state.totalSpent, cost),
        partner: {
          ...partner,
          affection: Math.min(100, partner.affection + effect.affection * charm),
          happiness: Math.min(100, partner.happiness + effect.partnerHappiness),
          careMonths: { ...partner.careMonths, [action]: state.gameMonth },
        },
        children: action === 'family' ? state.children.map((child) => ({ ...child, happiness: Math.min(100, child.happiness + 12) })) : state.children,
        happiness: Math.min(100, state.happiness + effect.playerHappiness),
        stress: Math.max(0, state.stress - effect.stress),
      });
      return true;
    }
    if (action === 'propose') {
      if (nextRelationshipStage(partner.stage, partner.affection, partner.monthsTogether) !== 'engaged' || compare(state.money, 3_000) < 0) return false;
      set({ money: subtract(state.money, 3_000), totalSpent: add(state.totalSpent, 3_000), partner: { ...partner, stage: 'engaged', affection: Math.min(100, partner.affection + 8) }, celebrationNonce: state.celebrationNonce + 1 });
      return true;
    }
    if (action === 'marry') {
      if (nextRelationshipStage(partner.stage, partner.affection, partner.monthsTogether) !== 'married' || compare(state.money, 10_000) < 0) return false;
      set({ money: subtract(state.money, 10_000), totalSpent: add(state.totalSpent, 10_000), partner: { ...partner, stage: 'married', affection: 100 }, happiness: Math.min(100, state.happiness + 12), celebrationNonce: state.celebrationNonce + 1 });
      return true;
    }
    if (action === 'breakup' && partner.stage !== 'married') {
      set({ partner: null, happiness: Math.max(0, state.happiness - 12) });
      return true;
    }
    if (action === 'divorce' && partner.stage === 'married') {
      const assets = Math.max(0, toNumber(calculateLifeNetWorth(state)));
      const debts = state.loans.reduce((sum, loan) => sum + loan.balance, 0) + state.housing.mortgageBalance + state.vehicle.debt;
      const split = divorceSplit(assets, debts);
      set({ money: subtract(state.money, Math.min(toNumber(state.money), split.spouseSettlement)), partner: null, happiness: Math.max(0, state.happiness - 25), children: state.children.map((child) => ({ ...child, happiness: Math.max(0, child.happiness - 12) })) });
      return true;
    }
    return false;
  },
  haveChild: () => {
    const state = get();
    if (!state.partner || (state.partner.stage !== 'married' && state.partner.monthsTogether < 12) || state.partner.affection < 75 || compare(state.money, 1_500) < 0) return false;
    const child: ChildState = { id: `child-${Date.now()}`, name: `Child ${state.children.length + 1}`, birthMonth: state.gameMonth, happiness: 80, education: 0, privateSchool: false, collegeFund: 0 };
    set({ money: subtract(state.money, 1_500), totalSpent: add(state.totalSpent, 1_500), children: [...state.children, child], energy: Math.max(0, state.energy - 12), happiness: Math.min(100, state.happiness + 10), celebrationNonce: state.celebrationNonce + 1 });
    return true;
  },
  toggleNanny: () => set((state) => ({ nanny: !state.nanny })),
  togglePrivateSchool: (childId) => set((state) => ({ children: state.children.map((child) => child.id === childId ? { ...child, privateSchool: !child.privateSchool } : child) })),
  addCollegeFund: (childId, amount) => {
    const state = get();
    if (amount <= 0 || compare(state.money, amount) < 0 || !state.children.some((child) => child.id === childId)) return false;
    set({ money: subtract(state.money, amount), totalSpent: add(state.totalSpent, amount), children: state.children.map((child) => child.id === childId ? { ...child, collegeFund: child.collegeFund + amount } : child) });
    return true;
  },
  takeLoan: (amount) => {
    const state = get();
    const offer = loanOfferFor(state);
    if (!offer.eligible || amount < 500 || amount > offer.maxAmount) return false;
    const monthlyPayment = mortgagePayment(amount, offer.annualRate, offer.termMonths);
    const currentPayments = state.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    const salary = monthlyIncomeBreakdown(state).salary;
    if (currentPayments + monthlyPayment > salary * LOAN_MAX_PAYMENT_SHARE) return false;
    const loan: BankLoan = { id: `loan-${Date.now()}`, originalAmount: amount, balance: amount, annualRate: offer.annualRate, monthlyPayment, monthsRemaining: offer.termMonths };
    set({ money: add(state.money, amount), loans: [...state.loans, loan] });
    return true;
  },
  togglePartnerWork: () => set((state) => ({ partner: state.partner ? { ...state.partner, stayAtHome: !state.partner.stayAtHome } : null })),
  lifestyleSpend: (kind) => {
    const state = get();
    const cost = kind === 'vacation' ? 2_500 : 400;
    if (compare(state.money, cost) < 0) return false;
    set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), happiness: Math.min(100, state.happiness + (kind === 'vacation' ? 12 : 4)), stress: Math.max(0, state.stress - (kind === 'vacation' ? 18 : 4)), partner: state.partner ? { ...state.partner, affection: Math.min(100, state.partner.affection + (kind === 'vacation' ? 5 : 1)) } : null });
    return true;
  },
  setTimeSpeed: (timeSpeed) => set({ timeSpeed }),
  dismissMonthlySummary: () => set({ monthlySummary: null }),
}));

export function selectLifePersistedState(state: LifeStore): LifePersistedState {
  const { hydrated: _hydrated, runtimeNow: _runtimeNow, offlineEarnings: _offlineEarnings, offlineSeconds: _offlineSeconds, offlineSummary: _offlineSummary, monthlySummary: _monthlySummary, activeLifeEvent: _activeLifeEvent, celebrationNonce: _celebrationNonce, ...persistedAndActions } = state;
  return Object.fromEntries(Object.entries(persistedAndActions).filter(([, value]) => typeof value !== 'function')) as unknown as LifePersistedState;
}
