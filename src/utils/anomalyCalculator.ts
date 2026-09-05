import type { UnifiedStats } from "@/types/Agent";
import type { Enemy } from "@/types/Enemy";
import {
  ANOMALY_DEFINITIONS,
  type AttributeType,
  type AnomalyCalculationResult,
} from "@/types/Anomaly";
import type { CollectedBonuses } from "./damageBonusCollector";
import type { AnomalyBonuses } from "@/types/AnomalyBonuses";

export interface SourceBonuses {
  global: number;
  elements: Record<string, number>;
  skillTypes: Record<string, number>;
  anomalyDmgBonus: number;
  anomalyTypeDmg: Record<string, number>;
}

export interface DisorderSlotBonuses {
  disorderDmgBonus: number;
  disorderMultiplierBonus: number;
}

export interface VortexSlotBonuses {
  vortexDmgBonus: number;
  vortexMultiplierBonus: number;
}

const BUFF_LEVEL_MULTIPLIER = 2.0;

export function calculateAnomalyDamage({
  attribute,
  stats,
  enemy,
  totalBonusDamage,
  anomalyBonuses,
  stunMultiplier,
  calculateRealDamage,
  skillId = "anomaly",
  damageBonuses,
  refringeCoefficient = 0,
}: {
  attribute: AttributeType;
  stats: UnifiedStats;
  enemy: Enemy | null;
  totalBonusDamage: number;
  anomalyBonuses?: AnomalyBonuses;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    ...args: any[]
  ) => number;
  skillId?: string;
  damageBonuses?: CollectedBonuses;
  refringeCoefficient?: number;
}): AnomalyCalculationResult {
  const definition = ANOMALY_DEFINITIONS[attribute];
  if (!definition) {
    return {
      baseDamage: 0,
      withAP: 0,
      withBuffLevel: 0,
      withBonuses: 0,
      realDamage: 0,
    };
  }

  const baseDamage = stats.atk * definition.baseMultiplier;
  const apMultiplier = stats.anomalyProficiency / 100;
  const damageWithAP = baseDamage * apMultiplier;
  const damageWithBuffLevel = damageWithAP * BUFF_LEVEL_MULTIPLIER;
  const dmgMod = 1 + totalBonusDamage;
  const typeBonus = anomalyBonuses?.perAnomalyType?.[definition.anomalyType];
  const buffMod =
    1 +
    (anomalyBonuses?.anomalyDmgBonus || 0) +
    (typeBonus?.dmgBonus || 0) +
    refringeCoefficient;

  const damageWithBonuses = damageWithBuffLevel * dmgMod * buffMod;
  const damageAfterStun = damageWithBonuses * (1 + stunMultiplier / 100);

  let realDamage = 0;
  let realCritDamage = 0;
  let assaultCritDmgTotal = 0;

  if (attribute === "physical" && damageBonuses?.assaultCritDmgTotal) {
    assaultCritDmgTotal = damageBonuses.assaultCritDmgTotal;

    realDamage = calculateRealDamage(
      Math.round(damageAfterStun),
      attribute,
      undefined,
      skillId,
      "anomaly",
      0,
      `${definition.anomalyType} Anomaly`,
      0,
      0,
      true,
      false,
      undefined,
      undefined,
      false,
      true,
    );

    realCritDamage = calculateRealDamage(
      Math.round(damageAfterStun * (1 + assaultCritDmgTotal)),
      attribute,
      undefined,
      skillId,
      "anomaly",
      0,
      `${definition.anomalyType} Anomaly (CRIT)`,
      0,
      0,
      true,
      false,
      undefined,
      undefined,
      false,
      true,
    );
  } else {
    realDamage = calculateRealDamage(
      Math.round(damageAfterStun),
      attribute,
      undefined,
      skillId,
      "anomaly",
      0,
      `${definition.anomalyType} Anomaly`,
      0,
      0,
      true,
      false,
      undefined,
      undefined,
      false,
      true,
    );
  }

  return {
    baseDamage: Math.round(baseDamage),
    withAP: Math.round(damageWithAP),
    withBuffLevel: Math.round(damageWithBuffLevel),
    withBonuses: Math.round(damageWithBonuses),
    realDamage,
    realCritDamage,
    assaultCritDmgTotal,
    dmgMod,
    buffMod,
  };
}

export function calculateDisorderDamage({
  previousAttribute,
  slotAttribute,
  timePassed,
  stats,
  enemy,
  sourceBonuses,
  slotBonuses,
  stunMultiplier,
  calculateRealDamage,
  skillId,
}: {
  previousAttribute: AttributeType;
  slotAttribute: AttributeType;
  timePassed: number;
  stats: UnifiedStats;
  enemy: Enemy | null;
  sourceBonuses: SourceBonuses;
  slotBonuses: DisorderSlotBonuses;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    ...args: any[]
  ) => number;
  skillId?: string;
}): { multiplier: number; damage: number; realDamage: number } {
  const def = ANOMALY_DEFINITIONS[slotAttribute];
  if (!def) {
    return { multiplier: 0, damage: 0, realDamage: 0 };
  }

  if (slotAttribute === "wind") {
    return { multiplier: 0, damage: 0, realDamage: 0 };
  }

  const baseMultiplier = def.disorderFormula.baseMultiplier;
  const perSecondBonus = def.disorderFormula.perSecondFormula(timePassed);

  let multiplierBonus = slotBonuses.disorderMultiplierBonus || 0;

  const totalMultiplier = baseMultiplier + perSecondBonus + multiplierBonus;

  const baseDamage = stats.atk * totalMultiplier;
  const damageWithAP = baseDamage * (stats.anomalyProficiency / 100);
  const damageWithBuffLevel = damageWithAP * BUFF_LEVEL_MULTIPLIER;

  const dmgMod =
    1 +
    sourceBonuses.global +
    Object.values(sourceBonuses.elements).reduce((a, b) => a + b, 0) +
    Object.values(sourceBonuses.skillTypes).reduce((a, b) => a + b, 0);

  const buffMod = 1 + slotBonuses.disorderDmgBonus;

  const damageWithBonuses = damageWithBuffLevel * dmgMod * buffMod;
  const damageAfterStun = damageWithBonuses * (1 + stunMultiplier / 100);

  const realDamage = calculateRealDamage(
    Math.round(damageAfterStun),
    previousAttribute,
    undefined,
    skillId || "disorder",
    "anomaly",
    0,
    `Disorder (${def.anomalyType})`,
    undefined,
    undefined,
    true,
    false,
    stats.penRatio || 0,
    stats.pen || 0,
    false,
    true,
  );

  return {
    multiplier: totalMultiplier,
    damage: Math.round(damageAfterStun),
    realDamage,
    dmgMod,
    buffMod,
  };
}

export function calculateVortexDamage({
  attribute,
  slotAttribute,
  timeRemaining,
  stats,
  enemy,
  sourceBonuses,
  slotBonuses,
  stunMultiplier,
  calculateRealDamage,
  additionalMV = 0,
  isVortex = false,
}: {
  attribute: AttributeType;
  slotAttribute: AttributeType;
  timeRemaining: number;
  stats: UnifiedStats;
  enemy: Enemy | null;
  sourceBonuses: SourceBonuses;
  slotBonuses: VortexSlotBonuses;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    ...args: any[]
  ) => number;
  additionalMV?: number;
  isVortex?: boolean;
}): { multiplier: number; damage: number; realDamage: number } {
  let def = ANOMALY_DEFINITIONS[attribute];
  if (!def?.vortexFormula) {
    def = ANOMALY_DEFINITIONS[slotAttribute];
    if (!def?.vortexFormula) {
      return { multiplier: 0, damage: 0, realDamage: 0 };
    }
  }

  const { base, perSecond, perTick } = def.vortexFormula;
  let bonusFromTime = 0;
  if (perTick) {
    const ticks = Math.floor(timeRemaining / 0.5);
    bonusFromTime = ticks * perTick;
  } else if (perSecond) {
    bonusFromTime = timeRemaining * perSecond;
  }

  const vortexMultiplierBonus = slotBonuses.vortexMultiplierBonus || 0;
  const totalMultiplier =
    base + additionalMV + bonusFromTime + vortexMultiplierBonus;

  const baseDamage = stats.atk * totalMultiplier;
  const damageWithAP = baseDamage * (stats.anomalyProficiency / 100);
  const damageWithBuffLevel = damageWithAP * BUFF_LEVEL_MULTIPLIER;

  const dmgMod =
    1 +
    sourceBonuses.global +
    Object.values(sourceBonuses.elements).reduce((a, b) => a + b, 0) +
    Object.values(sourceBonuses.skillTypes).reduce((a, b) => a + b, 0);

  const buffMod = 1 + (slotBonuses.vortexDmgBonus || 0);

  const damageWithBonuses = damageWithBuffLevel * dmgMod * buffMod;
  const damageAfterStun = damageWithBonuses * (1 + stunMultiplier / 100);

  const realDamage = calculateRealDamage(
    Math.round(damageAfterStun),
    attribute,
    undefined,
    "vortex",
    "anomaly",
    0,
    `Vortex (${def.anomalyType})`,
    undefined,
    undefined,
    true,
    isVortex,
    stats.penRatio || 0,
    stats.pen || 0,
    false,
    true,
  );

  return {
    multiplier: totalMultiplier,
    damage: Math.round(damageAfterStun),
    realDamage,
    dmgMod,
    buffMod,
  };
}

export function calculatePolarityDisorderDamage({
  stats,
  preCalculatedDisorderDamage,
  totalBonusDamage,
  anomalyBonuses,
  previousAttribute,
  stunMultiplier,
  calculateRealDamage,
  disorderPercent = 0.15,
  includeAPContribution = true,
}: {
  stats: UnifiedStats;
  preCalculatedDisorderDamage: number;
  totalBonusDamage: number;
  anomalyBonuses?: AnomalyBonuses;
  previousAttribute: AttributeType;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    ...args: any[]
  ) => number;
  disorderPercent?: number;
  includeAPContribution?: boolean;
}) {
  const disorderContribution = preCalculatedDisorderDamage * disorderPercent;
  const apContribution = includeAPContribution
    ? stats.anomalyProficiency * 7.25
    : 0;

  let totalDamage = disorderContribution + apContribution;

  const dmgMod = 1 + totalBonusDamage;

  const typeBonus =
    anomalyBonuses?.perAnomalyType?.[
      ANOMALY_DEFINITIONS[previousAttribute]?.anomalyType
    ];
  const buffMod =
    1 +
    (anomalyBonuses?.disorderDmgBonus || 0) +
    (typeBonus?.disorderBonus || 0);

  totalDamage = totalDamage * dmgMod * buffMod;
  totalDamage *= 1 + stunMultiplier / 100;

  const realDamage = calculateRealDamage(
    Math.round(totalDamage),
    previousAttribute,
    undefined,
    "polarity-disorder",
    "anomaly",
    0,
    "Polarity Disorder",
    undefined,
    undefined,
    true,
    false,
    undefined,
    undefined,
    false,
    true,
  );

  return {
    damage: Math.round(totalDamage),
    realDamage,
    basedOnDisorder: Math.round(disorderContribution),
    apContribution: Math.round(apContribution),
  };
}

export function calculatePolarizedAssaultDamage({
  timePassed,
  stats,
  enemy,
  totalBonusDamage,
  anomalyBonuses,
  stunMultiplier,
  calculateRealDamage,
  existingAnomalyOnEnemy,
  damageBonuses,
  preCalculatedDisorder,
}: {
  timePassed?: number;
  stats: UnifiedStats;
  enemy: Enemy | null;
  totalBonusDamage: number;
  anomalyBonuses?: AnomalyBonuses;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    ...args: any[]
  ) => number;
  existingAnomalyOnEnemy?: AttributeType;
  damageBonuses?: CollectedBonuses;
  preCalculatedDisorder?: { damage: number; realDamage: number };
}) {
  const assaultResult = calculateAnomalyDamage({
    attribute: "physical",
    stats,
    enemy,
    totalBonusDamage,
    anomalyBonuses,
    stunMultiplier,
    calculateRealDamage,
    skillId: "polarized-assault",
    damageBonuses,
  });

  const assaultDamage = assaultResult.realDamage;
  const assaultCritDamage =
    assaultResult.realCritDamage ?? assaultResult.realDamage;

  const triggersDisorder = !!existingAnomalyOnEnemy;
  let disorderDamage: number | undefined;
  let disorderRealDamage: number | undefined;

  if (triggersDisorder && existingAnomalyOnEnemy) {
    if (preCalculatedDisorder) {
      disorderDamage = preCalculatedDisorder.damage;
      disorderRealDamage = preCalculatedDisorder.realDamage;
    } else {
      const disorderResult = calculateDisorderDamage({
        previousAttribute: existingAnomalyOnEnemy,
        slotAttribute: "physical",
        timePassed: timePassed ?? 0,
        stats,
        enemy,
        sourceBonuses: {
          global: 0,
          elements: {},
          skillTypes: {},
          anomalyDmgBonus: anomalyBonuses?.anomalyDmgBonus ?? 0,
          anomalyTypeDmg: anomalyBonuses?.perAnomalyType ?? {},
        },
        slotBonuses: {
          disorderDmgBonus: anomalyBonuses?.disorderDmgBonus ?? 0,
          disorderMultiplierBonus: anomalyBonuses?.disorderMultiplierBonus ?? 0,
        },
        stunMultiplier,
        calculateRealDamage,
      });
      disorderDamage = disorderResult.damage;
      disorderRealDamage = disorderResult.realDamage;
    }
  }

  return {
    assaultDamage: assaultResult.withBonuses,
    assaultRealDamage: assaultDamage,
    assaultCritDamage: assaultCritDamage,
    assaultCritRealDamage: assaultResult.realCritDamage ?? assaultDamage,
    disorderDamage,
    disorderRealDamage,
    triggersDisorder,
  };
}
