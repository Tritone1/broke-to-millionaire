export type RankDefinition = {
  title: string;
  threshold: number;
  avatar: string;
  colors: [string, string];
};

export const RANKS: RankDefinition[] = [
  { title: 'Broke', threshold: 0, avatar: '🧍', colors: ['#171A18', '#242925'] },
  { title: 'Hustler', threshold: 1_000, avatar: '🧢', colors: ['#13241A', '#1D5834'] },
  { title: 'Entrepreneur', threshold: 100_000, avatar: '💼', colors: ['#142431', '#245071'] },
  { title: 'Millionaire', threshold: 1_000_000, avatar: '🕶️', colors: ['#2B2410', '#77601B'] },
  { title: 'Tycoon', threshold: 100_000_000, avatar: '🎩', colors: ['#301D16', '#824B22'] },
  { title: 'Billionaire', threshold: 1_000_000_000, avatar: '👑', colors: ['#291D36', '#7A3D9D'] },
  { title: 'Mogul', threshold: 1_000_000_000_000, avatar: '🏛️', colors: ['#241B09', '#A17D1B'] },
  { title: 'Galactic Mogul', threshold: 1_000_000_000_000_000, avatar: '🪐', colors: ['#09142A', '#2448A1'] },
];
