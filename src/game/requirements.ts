import { compare, formatBig, type BigValue } from './BigNumber';

export type RequirementKind =
  | 'cash'
  | 'fee'
  | 'monthlyFee'
  | 'skill'
  | 'degree'
  | 'experience'
  | 'age'
  | 'health'
  | 'energy'
  | 'item'
  | 'housing'
  | 'food'
  | 'vehicle'
  | 'relationship'
  | 'reputation'
  | 'netWorth';

export type Requirement = {
  kind: RequirementKind;
  amount?: number;
  key?: string;
  label?: string;
  how?: string;
};

export type RequirementSnapshot = {
  cash: BigValue;
  monthlySurplus: number;
  skills: Record<string, number>;
  degrees: string[];
  experienceMonths: Record<string, number>;
  age: number;
  health: number;
  energy: number;
  ownedItems: string[];
  housingStatus: number;
  foodLevel: number;
  vehicleStatus: number;
  relationshipStage: string;
  reputation: number;
  netWorth: BigValue;
};

export type RequirementResult = Requirement & {
  met: boolean;
  current: string;
  target: string;
  displayLabel: string;
  shortcut: string;
};

const MONEY_KINDS = new Set<RequirementKind>(['cash', 'fee', 'netWorth']);

function currentValue(requirement: Requirement, state: RequirementSnapshot): number | BigValue | string {
  switch (requirement.kind) {
    case 'cash':
    case 'fee': return state.cash;
    case 'monthlyFee': return state.monthlySurplus;
    case 'skill': return state.skills[requirement.key ?? ''] ?? 0;
    case 'degree': return state.degrees.includes(requirement.key ?? '') ? 1 : 0;
    case 'experience': return state.experienceMonths[requirement.key ?? ''] ?? 0;
    case 'age': return state.age;
    case 'health': return state.health;
    case 'energy': return state.energy;
    case 'item': return state.ownedItems.includes(requirement.key ?? '') ? 1 : 0;
    case 'housing': return state.housingStatus;
    case 'food': return state.foodLevel;
    case 'vehicle': return state.vehicleStatus;
    case 'relationship': return state.relationshipStage;
    case 'reputation': return state.reputation;
    case 'netWorth': return state.netWorth;
  }
}

function defaultLabel(requirement: Requirement): string {
  const key = requirement.key?.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
  switch (requirement.kind) {
    case 'cash': return 'Cash balance';
    case 'fee': return 'One-time fee';
    case 'monthlyFee': return 'Monthly surplus';
    case 'skill': return `${key ?? 'Skill'} skill`;
    case 'degree': return key ?? 'Required degree';
    case 'experience': return `${key ?? 'Job'} experience`;
    case 'age': return 'Minimum age';
    case 'health': return 'Health';
    case 'energy': return 'Energy';
    case 'item': return key ?? 'Required item';
    case 'housing': return 'Housing standard';
    case 'food': return 'Food plan';
    case 'vehicle': return 'Transport standard';
    case 'relationship': return 'Relationship';
    case 'reputation': return 'Reputation';
    case 'netWorth': return 'Net worth';
  }
}

function defaultShortcut(kind: RequirementKind): string {
  if (kind === 'skill' || kind === 'degree') return 'Go to Study';
  if (kind === 'experience') return 'Go to Work';
  if (kind === 'item') return 'Go to Shop';
  if (kind === 'housing' || kind === 'food' || kind === 'vehicle') return 'Improve Lifestyle';
  if (kind === 'relationship') return 'Go to Dating';
  if (kind === 'health' || kind === 'energy') return 'Go Home';
  return 'Earn Money';
}

export function evaluateRequirement(requirement: Requirement, state: RequirementSnapshot): RequirementResult {
  const amount = requirement.amount ?? 1;
  const value = currentValue(requirement, state);
  const met = requirement.kind === 'relationship'
    ? value === requirement.key
    : compare(value as BigValue | number, amount) >= 0;
  const current = MONEY_KINDS.has(requirement.kind)
    ? `$${formatBig(value as BigValue, 2)}`
    : requirement.kind === 'degree' || requirement.kind === 'item'
      ? (met ? 'Owned' : 'Missing')
      : String(value);
  const target = MONEY_KINDS.has(requirement.kind) || requirement.kind === 'monthlyFee'
    ? `$${formatBig(amount, 2)}`
    : requirement.kind === 'relationship'
      ? String(requirement.key ?? '')
      : String(amount);
  return {
    ...requirement,
    met,
    current,
    target,
    displayLabel: requirement.label ?? defaultLabel(requirement),
    shortcut: requirement.how ?? defaultShortcut(requirement.kind),
  };
}

export function evaluateRequirements(requirements: Requirement[], state: RequirementSnapshot): RequirementResult[] {
  return requirements.map((requirement) => evaluateRequirement(requirement, state));
}

export function allRequirementsMet(requirements: Requirement[], state: RequirementSnapshot): boolean {
  return evaluateRequirements(requirements, state).every((result) => result.met);
}
