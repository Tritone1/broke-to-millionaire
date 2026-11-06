import { big } from '../BigNumber';
import { allRequirementsMet, evaluateRequirements, type RequirementSnapshot } from '../requirements';

const snapshot: RequirementSnapshot = {
  cash: big(5_000), monthlySurplus: 900, skills: { tech: 8 }, degrees: ['coding'],
  experienceMonths: { juniorDev: 4 }, age: 21, health: 75, energy: 60,
  ownedItems: ['laptop'], relationshipStage: 'dating', reputation: 12, netWorth: big(20_000),
  housingStatus: 14, foodLevel: 1, vehicleStatus: 5,
};

describe('requirement engine', () => {
  it('evaluates money, skill, education, experience, wellness and ownership together', () => {
    const results = evaluateRequirements([
      { kind: 'fee', amount: 2_000 }, { kind: 'skill', key: 'tech', amount: 7 },
      { kind: 'degree', key: 'coding' }, { kind: 'experience', key: 'juniorDev', amount: 3 },
      { kind: 'health', amount: 70 }, { kind: 'item', key: 'laptop' },
    ], snapshot);
    expect(results.filter((result) => !result.met)).toEqual([]);
    expect(results[0]?.current).toBe('$5K');
  });

  it('reports unmet requirements without consuming resources', () => {
    const requirements = [{ kind: 'age' as const, amount: 25 }, { kind: 'netWorth' as const, amount: 100_000 }];
    expect(allRequirementsMet(requirements, snapshot)).toBe(false);
    expect(evaluateRequirements(requirements, snapshot).filter((result) => !result.met)).toHaveLength(2);
  });

  it('supports affordability, relationship and reputation gates', () => {
    const results = evaluateRequirements([
      { kind: 'monthlyFee', amount: 800 },
      { kind: 'relationship', key: 'dating' },
      { kind: 'reputation', amount: 10 },
    ], snapshot);
    expect(results.every((result) => result.met)).toBe(true);
  });
});
