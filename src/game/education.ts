export type ExamInputs = {
  intelligence: number;
  studyProgress: number;
  health: number;
  happiness: number;
  attempts: number;
};

export function examSuccessChance(inputs: ExamInputs): number {
  const study = Math.max(0, Math.min(100, inputs.studyProgress));
  const wellness = (Math.max(0, inputs.health) + Math.max(0, inputs.happiness)) / 2;
  const chance = 0.22 + study * 0.005 + inputs.intelligence * 0.012 + wellness * 0.0015 + inputs.attempts * 0.04;
  return Math.max(0.1, Math.min(0.95, chance));
}

export function studyGain(intelligence: number, energy: number): number {
  const energyFactor = Math.max(0.35, Math.min(1, energy / 70));
  return Math.max(4, Math.min(18, (7 + intelligence * 0.35) * energyFactor));
}

export function interviewSuccessChance(charisma: number, skillFit: number, experienceMonths: number): number {
  return Math.max(0.15, Math.min(0.94, 0.42 + charisma * 0.018 + skillFit * 0.012 + Math.min(0.18, experienceMonths * 0.01)));
}
