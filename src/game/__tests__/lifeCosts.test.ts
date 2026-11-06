import { calculateMonthlyBills, childMonthlyCost, divorceSplit, mortgagePayment, nextRelationshipStage } from '../lifeCosts';

describe('monthly living costs', () => {
  it('adds itemized bills and applies the frugal discount', () => {
    const result = calculateMonthlyBills({ housingId: 'shared', housingTenure: 'rent', mortgagePayment: 0, vehicleId: 'public', vehicleTenure: 'public', vehiclePayment: 0, foodPlanId: 'balanced', healthPlanId: 'basic', childAges: [], privateSchoolCount: 0, nanny: false, lifestyleUpkeep: 0, loanPayments: 0, frugal: true });
    expect(result.lines.map((line) => line.id)).toEqual(['housing', 'transport', 'food', 'health']);
    expect(result.total).toBeCloseTo(415 * 0.92, 5);
  });

  it('starts with no housing, food, transport, or healthcare bill', () => {
    const result = calculateMonthlyBills({ housingId: 'homeless', housingTenure: 'homeless', mortgagePayment: 0, vehicleId: 'walk', vehicleTenure: 'walk', vehiclePayment: 0, foodPlanId: 'survival', healthPlanId: 'none', childAges: [], privateSchoolCount: 0, nanny: false, lifestyleUpkeep: 0, loanPayments: 0, frugal: false });
    expect(result.lines).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('adds age-based child and private school costs', () => {
    expect(childMonthlyCost(1)).toBe(260);
    expect(childMonthlyCost(8, true)).toBe(490);
    expect(childMonthlyCost(15)).toBe(290);
  });
});

describe('financing and relationships', () => {
  it('uses the amortized mortgage formula', () => {
    expect(mortgagePayment(144_000, 0.055, 360)).toBeCloseTo(817.63, 1);
    expect(mortgagePayment(12_000, 0, 12)).toBe(1_000);
  });

  it('enforces affection and time for relationship transitions', () => {
    expect(nextRelationshipStage('dating', 69, 12)).toBeNull();
    expect(nextRelationshipStage('dating', 70, 3)).toBe('engaged');
    expect(nextRelationshipStage('engaged', 85, 6)).toBe('married');
  });

  it('splits net assets and debts on divorce', () => {
    expect(divorceSplit(200_000, 40_000)).toEqual({ playerAssets: 120_000, spouseSettlement: 80_000, playerDebt: 20_000 });
  });
});
