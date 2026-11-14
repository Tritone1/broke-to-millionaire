import { FOOD_PLANS, HEALTH_PLANS, housingById, vehicleById } from '../data/living';

export type RelationshipStage = 'single' | 'dating' | 'engaged' | 'married';
export type ChildStage = 'baby' | 'child' | 'teen';

export type MonthlyCostInput = {
  housingId: string;
  housingTenure: 'homeless' | 'rent' | 'owned' | 'mortgage';
  mortgagePayment: number;
  vehicleId: string;
  vehicleTenure: 'walk' | 'public' | 'owned' | 'lease' | 'finance';
  vehiclePayment: number;
  foodPlanId: string;
  healthPlanId: string;
  childAges: number[];
  privateSchoolCount: number;
  nanny: boolean;
  lifestyleUpkeep: number;
  loanPayments: number;
  frugal: boolean;
};

export type BillLine = { id: string; label: string; amount: number };

export function costOfLivingMultiplier(gameMonth: number): number {
  const monthsAfterGracePeriod = Math.max(0, Math.floor(gameMonth) - 12);
  return 1 + Math.min(1.25, monthsAfterGracePeriod * 0.004);
}

export function progressiveMonthlyTax(income: number): number {
  const safeIncome = Math.max(0, income);
  const taxable10 = Math.min(1_500, Math.max(0, safeIncome - 1_000));
  const taxable18 = Math.min(2_500, Math.max(0, safeIncome - 2_500));
  const taxable28 = Math.min(5_000, Math.max(0, safeIncome - 5_000));
  const taxable38 = Math.min(40_000, Math.max(0, safeIncome - 10_000));
  const taxable45 = Math.max(0, safeIncome - 50_000);
  return taxable10 * 0.1 + taxable18 * 0.18 + taxable28 * 0.28 + taxable38 * 0.38 + taxable45 * 0.45;
}

export function progressiveWealthUpkeep(netWorth: number): number {
  const safeWorth = Math.max(0, netWorth);
  const emerging = Math.min(900_000, Math.max(0, safeWorth - 100_000));
  const wealthy = Math.min(99_000_000, Math.max(0, safeWorth - 1_000_000));
  const ultraWealthy = Math.max(0, safeWorth - 100_000_000);
  return emerging * 0.0015 + wealthy * 0.003 + ultraWealthy * 0.005;
}

export function careerOperatingCost(monthlySalary: number, jobRank: number): number {
  if (monthlySalary <= 0 || jobRank <= 0) return 0;
  const rates = [0, 0.04, 0.015, 0.09, 0.13, 0.18];
  return monthlySalary * (rates[Math.min(5, Math.max(1, Math.floor(jobRank)))] ?? 0.18);
}

export function annualFeesAndRepairs(gameMonth: number, monthlyIncome: number, regularBills: number): number {
  const nextMonthNumber = Math.max(1, Math.floor(gameMonth) + 1);
  if (nextMonthNumber % 12 !== 0 || monthlyIncome <= 0) return 0;
  return monthlyIncome * 0.55 + regularBills * 0.5;
}

export function mortgagePayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = Math.max(0, annualRate) / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = (1 + monthlyRate) ** months;
  return principal * monthlyRate * factor / (factor - 1);
}

export function childStage(ageYears: number): ChildStage {
  if (ageYears < 3) return 'baby';
  if (ageYears < 13) return 'child';
  return 'teen';
}

export function childMonthlyCost(ageYears: number, privateSchool = false): number {
  const base = childStage(ageYears) === 'baby' ? 260 : childStage(ageYears) === 'child' ? 190 : 290;
  return base + (privateSchool ? 300 : 0);
}

export function calculateMonthlyBills(input: MonthlyCostInput): { lines: BillLine[]; total: number } {
  const housing = housingById(input.housingId);
  const vehicle = vehicleById(input.vehicleId);
  const food = FOOD_PLANS.find((item) => item.id === input.foodPlanId) ?? FOOD_PLANS[0];
  const healthcare = HEALTH_PLANS.find((item) => item.id === input.healthPlanId) ?? HEALTH_PLANS[0];
  const rawLines: BillLine[] = [
    { id: 'housing', label: input.housingTenure === 'homeless' ? 'Housing' : input.housingTenure === 'rent' ? 'Rent & utilities' : 'Home payment & upkeep', amount: input.housingTenure === 'homeless' ? 0 : (input.housingTenure === 'rent' ? housing.rent : input.mortgagePayment + housing.upkeep) + housing.utilities },
    { id: 'transport', label: 'Transport, fuel & insurance', amount: input.vehiclePayment + vehicle.fuel + vehicle.insurance + vehicle.maintenance },
    { id: 'food', label: food.name, amount: food.cost },
    { id: 'health', label: healthcare.name, amount: healthcare.cost },
    { id: 'children', label: 'Children & education', amount: input.childAges.reduce((sum, age, index) => sum + childMonthlyCost(age, index < input.privateSchoolCount), 0) },
    { id: 'nanny', label: 'Nanny', amount: input.nanny ? 600 : 0 },
    { id: 'lifestyle', label: 'Lifestyle upkeep', amount: input.lifestyleUpkeep },
    { id: 'loans', label: 'Loan payments', amount: input.loanPayments },
  ].filter((line) => line.amount > 0);
  const discount = input.frugal ? 0.92 : 1;
  const lines = rawLines.map((line) => ({ ...line, amount: line.amount * discount }));
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total };
}

export function nextRelationshipStage(stage: RelationshipStage, affection: number, monthsTogether: number): RelationshipStage | null {
  if (stage === 'single') return 'dating';
  if (stage === 'dating' && affection >= 70 && monthsTogether >= 3) return 'engaged';
  if (stage === 'engaged' && affection >= 85 && monthsTogether >= 6) return 'married';
  return null;
}

export function divorceSplit(totalAssets: number, totalDebts: number, hasPrenup = false) {
  const net = totalAssets - totalDebts;
  const spouseRate = hasPrenup ? 0.15 : 0.5;
  const spouseSettlement = Math.max(0, net * spouseRate);
  return { playerAssets: Math.max(0, totalAssets - spouseSettlement), spouseSettlement, playerDebt: totalDebts * (hasPrenup ? 0.85 : 0.5) };
}
