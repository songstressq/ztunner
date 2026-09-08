import type { Enemy } from "@/types/Enemy";
import type { UnifiedStats } from "@/types/Agent";

export interface DefenseCalculationResult {
  baseDefense: number;
  defReduction: number;
  penRatio: number;
  penFlat: number;
  effectivePen: number;
  effectiveDefense: number;
  defMultiplier: number;
}

export function calculateEffectiveDefense(
  enemy: Enemy,
  attackerStats: UnifiedStats,
  defReduction: number = 0,
  additionalPenRatio: number = 0,
  additionalPenFlat: number = 0,
): DefenseCalculationResult {
  const baseDefense = enemy.stats.def;

  const defenseAfterReduction = baseDefense * (1 - defReduction);
  const totalPenRatio = (attackerStats.penRatio || 0) + additionalPenRatio;
  const totalPenFlat = (attackerStats.pen || 0) + additionalPenFlat;
  const defenseAfterPenRatio = defenseAfterReduction * (1 - totalPenRatio);
  let effectiveDefense = defenseAfterPenRatio - totalPenFlat;
  effectiveDefense = Math.max(0, effectiveDefense);
  const effectivePen = baseDefense - effectiveDefense;

  return {
    baseDefense,
    defReduction,
    penRatio: totalPenRatio,
    penFlat: totalPenFlat,
    effectivePen,
    effectiveDefense,
    defMultiplier: 0,
  };
}

export function calculateDefenseMultiplier(
  effectiveDefense: number,
  attackerLevelCoeff: number,
): number {
  return attackerLevelCoeff / (attackerLevelCoeff + effectiveDefense);
}

export function calculateElementalResistance(
  damageType: string,
  enemy: Enemy,
): number {
  const resistanceMap: Record<string, number> = {
    fire: enemy.stats.fireResistance,
    ice: enemy.stats.iceResistance,
    electric: enemy.stats.electricResistance,
    physical: enemy.stats.physicalResistance,
    ether: enemy.stats.etherResistance,
  };

  return resistanceMap[damageType.toLowerCase()] || 0;
}

export function getALCByLevel(level: number): number {
  const ALC_TABLE: Record<number, number> = {
    60: 794,
    70: 1027,
    80: 1291,
  };

  return ALC_TABLE[level] || 794;
}
