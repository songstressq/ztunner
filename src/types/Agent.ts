import type { DamageSkill } from "./DamageSkill";

export interface AttributeBonus {
  fire: number;
  ice: number;
  electric: number;
  physical: number;
  ether: number;
  wind: number;
  lumiflux: number;
}

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
}

export interface CombatBaseStats {
  impact: number;
  critRate: number;
  critDmg: number;
  anomalyProficiency: number;
  anomalyMastery: number;
  penRatio: number;
  pen: number;
  energyRegen: number;

  attributeDmgBonus: AttributeBonus;
}

export interface CoreEnhancementStats {
  hpFlat?: number;
  atkFlat?: number;
  defFlat?: number;
  critRate?: number;
  critDmg?: number;
  atkPercent?: number;
  defPercent?: number;
  hpPercent?: number;
}

export interface CoreEnhancementEntry {
  level: number;
  stats: CoreEnhancementStats;
}

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  faction: string;
  attribute: string;
  anomalyAttribute?: {
    type: "frost" | "auricInk" | "honedEdge";
    parentAttribute: "ice" | "ether" | "physical";
    baseMultiplier: number;
    disorderFormula: {
      baseMultiplier: number;
      perSecondFormula: (timePassed: number) => number;
    };
  };
  rarity: string;

  fullName?: string;
  displayName?: string;
  attributeIcon?: string;

  baseStats: BaseStats;
  combatBase: CombatBaseStats;

  coreEnhancement: CoreEnhancementEntry[];
}

export interface AgentSkills {
  basicAttacks: DamageSkill[];
  dashAttacks: DamageSkill[];
  dodgeCounters: DamageSkill[];
  exSkills: DamageSkill[];
  ultimate: DamageSkill[];
  chainAttacks: DamageSkill[];
  quickAssists: DamageSkill[];
  perfectAssists: DamageSkill[];
  assistFollowup: DamageSkill[];
  specialAttacks: DamageSkill[];
  mindscapeAbilities: DamageSkill[];
}

export interface BasicAttackSkill {
  id: string;
  name: string;
  description: string;
  skillType: "basic";
  statBase: "atk" | "hp" | "def" | "anomalyMastery";
  hits: Hit[];
  levels: SkillLevel[];
}

export interface Hit {
  name: string;
  damageType:
    | "fire"
    | "ice"
    | "electric"
    | "physical"
    | "ether"
    | "wind"
    | "aftershock";
  damageSubtype?: "aftershock" | "other";
}

export interface DamageType {
  type: "fire" | "ice" | "electric" | "physical" | "ether" | "wind";
  ratio: number;
}

export interface SkillLevel {
  level: number;
  multipliers: number[];
}

export interface UnifiedStats {
  hp: number;
  atk: number;
  def: number;

  hpPercent?: number;
  atkPercent?: number;
  defPercent?: number;

  impact: number;
  critRate: number;
  critDmg: number;
  anomalyProficiency: number;
  anomalyMastery: number;
  penRatio: number;
  pen: number;
  energyRegen: number;

  sheerForce: number;

  attributeDmgBonus: AttributeBonus;
  assaultCritDmg?: number;

  _atkFlatRaw?: number;
  _atkPercentRaw?: number;
  _hpFlatRaw?: number;
  _hpPercentRaw?: number;
  _defFlatRaw?: number;
  _defPercentRaw?: number;

  _resShred?: Array<{
    element: "fire" | "ice" | "electric" | "physical" | "ether" | "wind";
    value: number;
    condition?: {
      skillTypes?: string[];
      damageType?: string;
      requiresSpecialty?: string;
    } | null;
  }>;

  _anomalyBonuses?: {
    anomalyDmgBonus: number;
    disorderDmgBonus: number;
  };
  _defShredBonus?: number;
  _impactBaseRawBonus?: number;
  _impactPercentAdditive?: number;
  _energyRegenRawBonus?: number;
  _energyRegenPercentRawBonus?: number;
  _anomalyMasteryRawBonus?: number;

  _refringeCoefficient?: number;
  _luminizeMultiplierBonus?: number;
}
