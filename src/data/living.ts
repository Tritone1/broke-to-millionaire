export type BackgroundId = 'middle' | 'poor-smart' | 'rich' | 'street';
export type TraitId = 'hard-worker' | 'lucky' | 'frugal' | 'charming' | 'risk-taker' | 'genius';

export const ETHNICITIES = [
  { id: 'african', name: 'African' },
  { id: 'east-asian', name: 'East Asian' },
  { id: 'south-asian', name: 'South Asian' },
  { id: 'european', name: 'European' },
  { id: 'middle-eastern', name: 'Middle Eastern' },
  { id: 'latin-american', name: 'Latin American' },
] as const;

export type EthnicityId = typeof ETHNICITIES[number]['id'];

export type BackgroundDefinition = {
  id: BackgroundId;
  name: string;
  description: string;
  startingMoney: number;
  skillBonus: Partial<Record<'intelligence' | 'business' | 'finance' | 'tech' | 'charisma', number>>;
};

export const BACKGROUNDS: BackgroundDefinition[] = [
  { id: 'middle', name: 'Middle class', description: 'A balanced start with a small safety net.', startingMoney: 2_500, skillBonus: { business: 4, charisma: 4 } },
  { id: 'poor-smart', name: 'Poor but smart', description: 'Very little cash, exceptional learning potential.', startingMoney: 250, skillBonus: { intelligence: 18, tech: 8 } },
  { id: 'rich', name: 'Rich family', description: 'A large head start, but fewer hard-earned skills.', startingMoney: 25_000, skillBonus: { finance: 5 } },
  { id: 'street', name: 'Street smart', description: 'A hustler with business instincts and charm.', startingMoney: 800, skillBonus: { business: 12, charisma: 10 } },
];

export const TRAITS: { id: TraitId; name: string; description: string }[] = [
  { id: 'hard-worker', name: 'Hard Worker', description: '+15% active work rewards and slower energy drain.' },
  { id: 'lucky', name: 'Lucky', description: 'Better windfalls and occasional bill discounts.' },
  { id: 'frugal', name: 'Frugal', description: '8% lower recurring living costs.' },
  { id: 'charming', name: 'Charming', description: 'Affection grows 25% faster.' },
  { id: 'risk-taker', name: 'Risk Taker', description: '+8% company income, with more stress.' },
  { id: 'genius', name: 'Genius', description: 'Courses finish 20% faster.' },
];

export type HousingDefinition = {
  id: string;
  name: string;
  emoji: string;
  purchasePrice: number;
  rent: number;
  utilities: number;
  upkeep: number;
  comfort: number;
  status: number;
  capacity: number;
};

export const HOUSING: HousingDefinition[] = [
  { id: 'homeless', name: 'Homeless', emoji: '🌙', purchasePrice: 0, rent: 0, utilities: 0, upkeep: 0, comfort: 0, status: 0, capacity: 1 },
  { id: 'hostel', name: 'Hostel Bed', emoji: '🛌', purchasePrice: 0, rent: 65, utilities: 10, upkeep: 0, comfort: 8, status: 1, capacity: 1 },
  { id: 'shared', name: 'Shared Room', emoji: '🛏️', purchasePrice: 0, rent: 120, utilities: 30, upkeep: 0, comfort: 15, status: 2, capacity: 1 },
  { id: 'studio', name: 'Studio', emoji: '🏠', purchasePrice: 0, rent: 350, utilities: 60, upkeep: 0, comfort: 28, status: 6, capacity: 2 },
  { id: 'one-bedroom', name: 'One-Bedroom Flat', emoji: '🏢', purchasePrice: 0, rent: 560, utilities: 85, upkeep: 0, comfort: 36, status: 10, capacity: 2 },
  { id: 'apartment', name: 'Apartment', emoji: '🏙️', purchasePrice: 0, rent: 850, utilities: 110, upkeep: 0, comfort: 45, status: 14, capacity: 4 },
  { id: 'house', name: 'Small House', emoji: '🏡', purchasePrice: 90_000, rent: 0, utilities: 200, upkeep: 130, comfort: 60, status: 24, capacity: 5 },
  { id: 'townhouse', name: 'Townhouse', emoji: '🏘️', purchasePrice: 240_000, rent: 0, utilities: 300, upkeep: 280, comfort: 68, status: 36, capacity: 6 },
  { id: 'villa', name: 'Villa', emoji: '🏛️', purchasePrice: 650_000, rent: 0, utilities: 650, upkeep: 800, comfort: 76, status: 48, capacity: 7 },
  { id: 'luxury-condo', name: 'Luxury Condo', emoji: '🌇', purchasePrice: 1_800_000, rent: 0, utilities: 1_200, upkeep: 1_600, comfort: 85, status: 62, capacity: 5 },
  { id: 'mansion', name: 'Mansion', emoji: '🏰', purchasePrice: 6_000_000, rent: 0, utilities: 3_000, upkeep: 5_000, comfort: 92, status: 80, capacity: 10 },
  { id: 'estate', name: 'Private Estate', emoji: '🌳', purchasePrice: 15_000_000, rent: 0, utilities: 5_500, upkeep: 9_000, comfort: 97, status: 92, capacity: 14 },
  { id: 'penthouse', name: 'Penthouse', emoji: '🌆', purchasePrice: 35_000_000, rent: 0, utilities: 9_000, upkeep: 16_000, comfort: 100, status: 100, capacity: 8 },
];

export type VehicleDefinition = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  fuel: number;
  insurance: number;
  maintenance: number;
  reliability: number;
  status: number;
};

export const VEHICLES: VehicleDefinition[] = [
  { id: 'walk', name: 'Walk', emoji: '🚶', price: 0, fuel: 0, insurance: 0, maintenance: 0, reliability: 55, status: 0 },
  { id: 'public', name: 'Public Transport', emoji: '🚌', price: 0, fuel: 45, insurance: 0, maintenance: 0, reliability: 75, status: 2 },
  { id: 'used', name: 'Used Car', emoji: '🚙', price: 4_000, fuel: 70, insurance: 35, maintenance: 45, reliability: 58, status: 5 },
  { id: 'compact', name: 'Compact Hatchback', emoji: '🚗', price: 9_000, fuel: 55, insurance: 42, maintenance: 28, reliability: 78, status: 8 },
  { id: 'economy', name: 'Economy Car', emoji: '🚗', price: 16_000, fuel: 60, insurance: 55, maintenance: 30, reliability: 88, status: 12 },
  { id: 'hybrid', name: 'Hybrid Sedan', emoji: '🔋', price: 28_000, fuel: 35, insurance: 78, maintenance: 42, reliability: 92, status: 18 },
  { id: 'suv', name: 'Family SUV', emoji: '🚙', price: 42_000, fuel: 120, insurance: 95, maintenance: 70, reliability: 84, status: 22 },
  { id: 'executive', name: 'Executive Sedan', emoji: '🚘', price: 75_000, fuel: 140, insurance: 170, maintenance: 130, reliability: 87, status: 36 },
  { id: 'sport', name: 'Sports Car', emoji: '🏎️', price: 130_000, fuel: 220, insurance: 280, maintenance: 250, reliability: 72, status: 48 },
  { id: 'electric-luxury', name: 'Luxury EV', emoji: '⚡', price: 220_000, fuel: 45, insurance: 480, maintenance: 210, reliability: 89, status: 58 },
  { id: 'luxury', name: 'Luxury Car', emoji: '🚘', price: 420_000, fuel: 550, insurance: 1_300, maintenance: 1_600, reliability: 80, status: 68 },
  { id: 'supercar', name: 'Supercar', emoji: '🏁', price: 2_400_000, fuel: 1_800, insurance: 8_000, maintenance: 12_000, reliability: 62, status: 92 },
  { id: 'jet', name: 'Private Jet', emoji: '✈️', price: 65_000_000, fuel: 120_000, insurance: 55_000, maintenance: 180_000, reliability: 90, status: 100 },
];

export const FOOD_PLANS = [
  { id: 'survival', name: 'Community meals', cost: 0, happiness: -5, health: -4 },
  { id: 'budget', name: 'Budget groceries', cost: 90, happiness: -3, health: -1 },
  { id: 'balanced', name: 'Balanced meals', cost: 180, happiness: 2, health: 2 },
  { id: 'premium', name: 'Chef & organic', cost: 650, happiness: 6, health: 5 },
] as const;

export const HEALTH_PLANS = [
  { id: 'none', name: 'No health cover', cost: 0, health: 0 },
  { id: 'basic', name: 'Basic cover', cost: 40, health: 1 },
  { id: 'good', name: 'Full healthcare', cost: 180, health: 3 },
  { id: 'elite', name: 'Concierge care', cost: 900, health: 6 },
] as const;

export const PARTNER_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Avery', 'Riley', 'Casey', 'Skyler', 'Mina', 'Leyla', 'Noah', 'Kai', 'Zara', 'Emil', 'Sofia', 'Mateo'];

export function housingById(id: string) {
  return HOUSING.find((item) => item.id === id) ?? HOUSING[0]!;
}

export function vehicleById(id: string) {
  return VEHICLES.find((item) => item.id === id) ?? VEHICLES[0]!;
}
