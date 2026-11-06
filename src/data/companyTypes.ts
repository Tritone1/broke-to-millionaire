export type CompanyTypeDefinition = {
  id: string;
  name: string;
  emoji: string;
  startupCost: number;
  baseRevenuePerSecond: number;
  employeeBaseSalary: number;
};

export const COMPANY_TYPES: CompanyTypeDefinition[] = [
  { id: 'cafe', name: 'Cafe', emoji: '☕', startupCost: 5_000, baseRevenuePerSecond: 6, employeeBaseSalary: 1.2 },
  { id: 'barbershop', name: 'Barbershop', emoji: '✂️', startupCost: 15_000, baseRevenuePerSecond: 16, employeeBaseSalary: 2 },
  { id: 'onlineStore', name: 'Online Store', emoji: '📦', startupCost: 50_000, baseRevenuePerSecond: 55, employeeBaseSalary: 4 },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍽️', startupCost: 180_000, baseRevenuePerSecond: 170, employeeBaseSalary: 7 },
  { id: 'gameStudio', name: 'Game Studio', emoji: '🎮', startupCost: 750_000, baseRevenuePerSecond: 620, employeeBaseSalary: 18 },
  { id: 'hotel', name: 'Hotel', emoji: '🏨', startupCost: 3_000_000, baseRevenuePerSecond: 2_200, employeeBaseSalary: 35 },
  { id: 'factory', name: 'Factory', emoji: '🏭', startupCost: 12_000_000, baseRevenuePerSecond: 8_500, employeeBaseSalary: 80 },
  { id: 'airline', name: 'Airline', emoji: '✈️', startupCost: 80_000_000, baseRevenuePerSecond: 42_000, employeeBaseSalary: 250 },
  { id: 'techStartup', name: 'Tech Startup', emoji: '🚀', startupCost: 350_000_000, baseRevenuePerSecond: 180_000, employeeBaseSalary: 700 },
];

export function companyTypeById(id: string): CompanyTypeDefinition {
  const result = COMPANY_TYPES.find((item) => item.id === id);
  if (!result) throw new Error(`Unknown company type: ${id}`);
  return result;
}
