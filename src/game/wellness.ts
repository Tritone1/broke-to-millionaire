export const BASE_LIFESPAN_YEARS = 100;
export const MIN_LIFESPAN_YEARS = 55;
export const MAX_LIFESPAN_YEARS = 120;

type WellnessVitals = {
  health: number;
  happiness: number;
  stress: number;
};

export function estimatedLifespanYears(vitals: WellnessVitals): number {
  const healthAdjustment = (vitals.health - 75) * 0.35;
  const happinessAdjustment = (vitals.happiness - 65) * 0.2;
  const stressAdjustment = Math.max(0, vitals.stress) * 0.1;
  const estimate = BASE_LIFESPAN_YEARS + healthAdjustment + happinessAdjustment - stressAdjustment;
  return Math.round(Math.max(MIN_LIFESPAN_YEARS, Math.min(MAX_LIFESPAN_YEARS, estimate)));
}

export function vitalityLabel(value: number): string {
  if (value >= 80) return 'Thriving';
  if (value >= 60) return 'Stable';
  if (value >= 35) return 'Struggling';
  return 'Critical';
}
