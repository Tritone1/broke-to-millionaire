export type WellnessActionId = 'sleep' | 'healthyMeal' | 'exercise' | 'hobby' | 'friends' | 'doctor';

export type WellnessEffects = {
  energy: number;
  health: number;
  happiness: number;
  stress: number;
};

export type WellnessActionDefinition = {
  id: WellnessActionId;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  effects: WellnessEffects;
};

export const WELLNESS_ACTIONS: WellnessActionDefinition[] = [
  { id: 'sleep', name: 'Full Night Sleep', emoji: '🌙', description: 'Recover naturally and clear work stress.', cost: 0, effects: { energy: 35, health: 1, happiness: 1, stress: -15 } },
  { id: 'healthyMeal', name: 'Healthy Meal', emoji: '🥗', description: 'A nutritious meal gives a quick physical boost.', cost: 25, effects: { energy: 15, health: 4, happiness: 3, stress: -2 } },
  { id: 'exercise', name: 'Exercise', emoji: '🏃', description: 'Spend energy now to strengthen long-term health.', cost: 10, effects: { energy: -10, health: 7, happiness: 5, stress: -10 } },
  { id: 'hobby', name: 'Enjoy a Hobby', emoji: '🎨', description: 'Make time for yourself and reset your mood.', cost: 40, effects: { energy: 5, health: 0, happiness: 12, stress: -12 } },
  { id: 'friends', name: 'Meet Friends', emoji: '🫶', description: 'Social time strongly improves happiness.', cost: 60, effects: { energy: -5, health: 0, happiness: 16, stress: -10 } },
  { id: 'doctor', name: 'Doctor Visit', emoji: '🩺', description: 'Treat health problems before they become serious.', cost: 100, effects: { energy: 0, health: 18, happiness: 1, stress: -5 } },
];

export function wellnessActionById(id: WellnessActionId): WellnessActionDefinition {
  return WELLNESS_ACTIONS.find((action) => action.id === id) ?? WELLNESS_ACTIONS[0]!;
}
