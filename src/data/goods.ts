export type ConsumerGoodCategory = 'Phone' | 'Laptop' | 'Timepiece' | 'Art';

export type ConsumerGood = {
  id: string;
  name: string;
  emoji: string;
  category: ConsumerGoodCategory;
  price: number;
  happiness: number;
  resaleRate: number;
  description: string;
};

export const CONSUMER_GOODS: ConsumerGood[] = [
  { id: 'budget-phone', name: 'Budget Smartphone', emoji: '📱', category: 'Phone', price: 250, happiness: 1, resaleRate: 0.35, description: 'Reliable calls, maps, and job applications.' },
  { id: 'flagship-phone', name: 'Flagship Smartphone', emoji: '📲', category: 'Phone', price: 1_200, happiness: 3, resaleRate: 0.45, description: 'A premium daily device and small status boost.' },
  { id: 'basic-laptop', name: 'Study Laptop', emoji: '💻', category: 'Laptop', price: 700, happiness: 2, resaleRate: 0.4, description: 'Useful for courses, applications, and coding practice.' },
  { id: 'pro-laptop', name: 'Professional Laptop', emoji: '🧑‍💻', category: 'Laptop', price: 2_400, happiness: 4, resaleRate: 0.45, description: 'A fast workstation for demanding technical work.' },
  { id: 'desk-clock', name: 'Art Deco Clock', emoji: '🕰️', category: 'Timepiece', price: 450, happiness: 2, resaleRate: 0.5, description: 'A tasteful clock for a first proper home.' },
  { id: 'mechanical-watch', name: 'Mechanical Watch', emoji: '⌚', category: 'Timepiece', price: 8_000, happiness: 5, resaleRate: 0.6, description: 'A collectible timepiece with lasting value.' },
  { id: 'local-painting', name: 'Local Artist Painting', emoji: '🖼️', category: 'Art', price: 1_500, happiness: 4, resaleRate: 0.55, description: 'Original art that makes a home feel personal.' },
  { id: 'gallery-painting', name: 'Gallery Masterpiece', emoji: '🎨', category: 'Art', price: 75_000, happiness: 9, resaleRate: 0.75, description: 'A serious collectible for a wealthy household.' },
];

export function consumerGoodById(id: string): ConsumerGood | undefined {
  return CONSUMER_GOODS.find((item) => item.id === id);
}
