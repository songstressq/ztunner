export interface WEngine {
  id: string;
  name: string;
  rarity: string;
  specialty: string;

  baseStatType: string;
  advancedStatType: string;

  stats: {
    base: number;
    advanced: number;
  };
}
