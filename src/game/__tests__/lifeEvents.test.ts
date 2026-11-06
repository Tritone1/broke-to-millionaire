import { LIFE_EVENTS } from '../../data/lifeEvents';

describe('data-driven life events', () => {
  it('ships at least 60 unique, complete scene events', () => {
    expect(LIFE_EVENTS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(LIFE_EVENTS.map((event) => event.id)).size).toBe(LIFE_EVENTS.length);
    for (const event of LIFE_EVENTS) {
      expect(event.dialogue.length).toBeGreaterThan(20);
      expect(event.choices).toHaveLength(2);
      expect(event.choices.every((choice) => choice.label.length > 0 && choice.result.length > 0)).toBe(true);
    }
  });
});
