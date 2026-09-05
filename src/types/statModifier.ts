export type StatModifier = {
  atk?: number;
  atkPercent?: number;
  hp?: number;
  hpPercent?: number;
  def?: number;
  defPercent?: number;

  critRate?: number;
  critDmg?: number;

  impact?: number;
  impactPercent?: number;

  anomalyProficiency?: number;
  anomalyMastery?: number;
  penRatio?: number;
  pen?: number;
  energyRegen?: number;

  attributeDmgBonus?: Partial<{
    fire: number;
    ice: number;
    electric: number;
    physical: number;
    ether: number;
  }>;
};
