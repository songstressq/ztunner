export type EffectTarget = "self" | "team";
export type EffectStat =
  | "atk"
  | "atkFlat"
  | "atkPercent"
  | "atkFlatRaw"
  | "atkPercentRaw"
  | "hp"
  | "hpFlat"
  | "hpPercent"
  | "hpFlatRaw"
  | "hpPercentRaw"
  | "def"
  | "defFlat"
  | "defPercent"
  | "defFlatRaw"
  | "defPercentRaw"
  | "critRate"
  | "critDmg"
  | "impact"
  | "impactPercent"
  | "impactBaseRaw"
  | "impactPercentRaw"
  | "impactFlatRaw"
  | "energyRegen"
  | "energyRegenPercentRaw"
  | "energyRegenRaw"
  | "penRatio"
  | "attributeDmgBonus"
  | "sheerForce"
  | "anomalyMastery"
  | "anomalyMasteryRaw"
  | "anomalyMasteryPercent"
  | "defShred"
  | "fireResShred"
  | "iceResShred"
  | "electricResShred"
  | "physicalResShred"
  | "etherResShred"
  | "windResShred"
  | "sheerForce"
  | "sheerDmgBonus"
  | "sheerDmgFlat"
  | "anomalyDmgBonus"
  | "disorderDmgBonus"
  | "anomalyDmgBonusFlat"
  | "disorderDmgBonusFlat"
  | "anomalyDmgBonusPerStat"
  | "disorderMultiplierBonus";

export interface WEngineOverclockLevel {
  level: number;
  label?: string;
  stats: Partial<Record<EffectStat, number>>;
  baseStats?: Partial<Record<EffectStat, number>>;
  damageBonuses?: DamageBonus[];
}

export interface WEngineOverclock {
  levels: WEngineOverclockLevel[];
  maxStacks?: number;
  stackMultiplier?: boolean;
}

export interface DamageBonus {
  type:
    | "global"
    | "element"
    | "skillType"
    | "exclusive"
    | "elementExclusive"
    | "hitExclusive"
    | "sheerDmg"
    | "elementSheerDmg"
    | "skillTypeElemental"
    | "skillTypeStat"
    | "skillTypeElementalSheer"
    | "critDamageElementalBonus";
  value: number;
  element?:
    | "fire"
    | "ice"
    | "electric"
    | "physical"
    | "ether"
    | "wind"
    | "aftershock";
  skillType?:
    | "basic"
    | "dash"
    | "counter"
    | "ex"
    | "ultimate"
    | "chain"
    | "quickAssist"
    | "perfectAssist"
    | "followup"
    | "special"
    | "mindscape";
  stat?: "critRate" | "critDmg" | "atkPercent" | "impact";
  exclusiveType?: "dmg" | "sheerDmg" | "elementSheerDmg";
  appliesTo?: string[];
  hitName?: string;
  hitNames?: string[];
  skillId?: string;
}

export interface ConditionalEffect {
  type:
    | "initialStatBased"
    | "skillLevelBased"
    | "currentStatBased"
    | "initialStatBasedDamageBonus";

  basedOn?:
    | "hp"
    | "atk"
    | "def"
    | "anomalyProficiency"
    | "anomalyMastery"
    | "impact"
    | "critRate"
    | "energyRegen"
    | "penRatio";

  maxStat?: number;
  baseBonus?: number;
  perUnit?: number;
  perUnitBonus?: number;
  maxBonus?: number;

  skillLevels?: Array<{
    level: number;
    maxBonus: number;
    perUnitBonus: number;
    baseBonus?: number;
  }>;

  skillBonusTable?: Array<{
    level: number;
    critDmg?: number;
    dmgBonus?: number;
    atkPercent?: number;
    attributeDmgBonus?: Record<string, number>;
    damageBonuses?: DamageBonus[];
  }>;

  affectedStats: EffectStat[];

  damageBonusType?:
    | "global"
    | "element"
    | "skillType"
    | "anomalyDmgBonus"
    | "anomalyTypeDmg";
  damageBonusElement?:
    | "fire"
    | "ice"
    | "electric"
    | "physical"
    | "ether"
    | "wind";
  damageBonusSkillType?: string;
  damageBonusAnomalyType?: string;
  damageBonusSkillId?: string;
  damageBonusAppliesTo?: string[];
  affectsAnomaly?: boolean;
  affectsDisorder?: boolean;
  anomalyType?: string;
}

export interface Condition {
  minAnomalyMastery?: number;
  requiresSpecialty?: string;
  requiresAgent?: string;
  attributeDmgTypes?: string[];
  skillTypes?: string[];
  damageType?: string;
  appliesToAnomalyOnly?: boolean;
  appliesToDisorderOnly?: boolean; 
  appliesToVortexOnly?: boolean; 
  appliesToLuminize?: boolean;
  requiresDisorderAttribute?: AttributeType;
}

export interface ExclusiveStatBonus {
  stat:
    | "critDmg"
    | "critRate"
    | "atkPercent"
    | "impact"
    | "anomalyMastery"
    | "fireResShred"
    | "iceResShred"
    | "electricResShred"
    | "physicalResShred"
    | "etherResShred"
    | "windResShred";
  value: number;
  appliesTo: string[];
}

export interface DynamicStatBonus {
  stat: "critDmg" | "atk" | "critRate" | "dmgBonus";
  multiplier: number;
  targetStat: "critDmg" | "dmgBonus";
  appliesTo: {
    skillIds?: string[];
    element?: string;
    hitNames?: string[];
  };
  maxValue?: number;
}

export interface ReferenceStatEffect {
  type: "referenceStat";
  referenceSlot: "previous" | "next" | "specific";
  specificSlot?: number;
  statToRead: "atk" | "sheerForce";
  multiplier: number;
  appliesTo: {
    skillIds: string[];
    hitNames?: string[];
  };

  specialtyMultipliers?: Record<string, number>;
  specialtyStats?: Record<string, "atk" | "sheerForce">;
}

export interface IngameEffect {
  id: string;
  source: "discSet" | "wEngine" | "core" | "mindscape" | "exSkill" | "gameMode";;
  sourceId: string; 
  label: string;
  description: string;
  shortDescription?: string;
  target: EffectTarget;
  maxStacks?: number;
  perStack?: Partial<Record<EffectStat, number>>;
  flat?: Partial<Record<EffectStat, number>>;
  ownerAgentId?: string;
  ownerDisplayName?: string;
  infoOnly?: boolean;
  linkedEffects?: string[];

  wEngineOverclock?: WEngineOverclock;

  conditional?: ConditionalEffect;
  basedOn:
    | "hp"
    | "atk"
    | "def"
    | "anomalyProficiency"
    | "anomalyMastery"
    | "impact"
    | "critRate"
    | "energyRegen"
    | "penRatio";
  maxStat: number;
  baseBonus?: number;
  perUnit?: number;
  perUnitBonus?: number;
  skillLevels?: Array<{
    level: number;
    maxBonus: number;
    perUnitBonus: number;
    baseBonus?: number;
  }>;
  affectedStats: EffectStat[];

  condition?: {
    minAnomalyMastery?: number;
    requiresSpecialty?: string;
    requiresAgent?: string;
    attributeDmgTypes?: string[];
  };

  damageBonuses?: DamageBonus[];
  exclusiveStatBonuses?: ExclusiveStatBonus[];
  aftershockDefShred?: number;

  dynamicStatBonuses?: DynamicStatBonus[];

  referenceStatEffect?: ReferenceStatEffect;

  stunMultiplier?: number;
  stunMultiplierFlat?: number;

  baseStats?: Partial<Record<EffectStat, number>>;
  conditionalStats?: {
    stats: Partial<Record<EffectStat, number>>;
    requiresBuff?: string;
    requiresState?: string;
    requiresStacks?: number;
  };
}

export interface AnomalyBonusesAccumulator {
  anomalyDmgBonus: number;
  disorderDmgBonus: number;
}

declare module "@/types/Agent" {
  interface UnifiedStats {
    _anomalyBonuses?: AnomalyBonusesAccumulator;
  }
}
