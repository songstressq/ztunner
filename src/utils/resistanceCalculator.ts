import type { Enemy } from "@/types/Enemy";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";

export interface ResistanceCalculation {
  baseResistance: number;
  resShred: number;
  finalResistance: number;
  damageMultiplier: number;
}

export function calculateElementalResistance(
  enemy: Enemy,
  damageType: string,
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
  skillId?: string,
  skillType?: string,
  isAnomaly: boolean = false,
  isVortex: boolean = false,
  isLuminize: boolean = false,
): ResistanceCalculation {
  let totalResShred = 0;
  let baseResistance = 0;

  switch (damageType.toLowerCase()) {
    case "fire":
      baseResistance = enemy.stats.fireResistance;
      break;
    case "ice":
      baseResistance = enemy.stats.iceResistance;
      break;
    case "electric":
      baseResistance = enemy.stats.electricResistance;
      break;
    case "physical":
      baseResistance = enemy.stats.physicalResistance;
      break;
    case "ether":
      baseResistance = enemy.stats.etherResistance;
      break;
    case "wind":
      baseResistance = enemy.stats.windResistance ?? 0;
      break;
  }

  const isDisorder = skillId === "disorder";

  Object.entries(activeEffects).forEach(([effectId, state]) => {
    if (!state.enabled) return;
    const effect = ingameEffectsRegistry[effectId];
    if (!effect) return;
    const stacks = state.stacks || 1;
    if (
      effect.condition?.appliesToAnomalyOnly &&
      effect.condition?.appliesToDisorderOnly
    ) {
      if (!isAnomaly && !isDisorder) return;
    } else {
      if (effect.condition?.appliesToAnomalyOnly && !isAnomaly) return;
      if (effect.condition?.appliesToDisorderOnly && !isDisorder) return;
      if (effect.condition?.appliesToVortexOnly && !isVortex) return;
    }
    if (effect.condition?.appliesToLuminize && !isLuminize) return;
    if (effect.condition) {
      if (
        effect.condition.skillTypes &&
        skillType &&
        !effect.condition.skillTypes.includes(skillType)
      ) {
        return;
      }
      if (
        effect.condition.damageType &&
        effect.condition.damageType !== damageType
      ) {
        return;
      }
    }

    if (effect.exclusiveStatBonuses && skillId) {
      let exclusiveResShred = 0;
      effect.exclusiveStatBonuses.forEach((bonus) => {
        if (!bonus.appliesTo.includes(skillId)) return;
        switch (bonus.stat) {
          case "fireResShred":
            if (damageType === "fire") {
              exclusiveResShred += bonus.value * stacks;
            }
            break;
          case "iceResShred":
            if (damageType === "ice") {
              exclusiveResShred += bonus.value * stacks;
            }
            break;
          case "electricResShred":
            if (damageType === "electric") {
              exclusiveResShred += bonus.value * stacks;
            }
            break;
          case "physicalResShred":
            if (damageType === "physical") {
              exclusiveResShred += bonus.value * stacks;
            }
            break;
          case "etherResShred":
            if (damageType === "ether") {
              exclusiveResShred += bonus.value * stacks;
            }
            break;
        }
      });
      if (exclusiveResShred !== 0) {
        totalResShred += exclusiveResShred;
        return;
      }
    }

    switch (damageType.toLowerCase()) {
      case "fire":
        if (effect.flat?.fireResShred)
          totalResShred += effect.flat.fireResShred * stacks;
        if (effect.perStack?.fireResShred)
          totalResShred += effect.perStack.fireResShred * stacks;
        break;
      case "ice":
        if (effect.flat?.iceResShred)
          totalResShred += effect.flat.iceResShred * stacks;
        if (effect.perStack?.iceResShred)
          totalResShred += effect.perStack.iceResShred * stacks;
        break;
      case "electric":
        if (effect.flat?.electricResShred)
          totalResShred += effect.flat.electricResShred * stacks;
        if (effect.perStack?.electricResShred)
          totalResShred += effect.perStack.electricResShred * stacks;
        break;
      case "physical":
        if (effect.flat?.physicalResShred)
          totalResShred += effect.flat.physicalResShred * stacks;
        if (effect.perStack?.physicalResShred)
          totalResShred += effect.perStack.physicalResShred * stacks;
        break;
      case "ether":
        if (effect.flat?.etherResShred)
          totalResShred += effect.flat.etherResShred * stacks;
        if (effect.perStack?.etherResShred)
          totalResShred += effect.perStack.etherResShred * stacks;
        break;
      case "wind":
        if (effect.flat?.windResShred)
          totalResShred += effect.flat.windResShred * stacks;
        if (effect.perStack?.windResShred)
          totalResShred += effect.perStack.windResShred * stacks;
        break;
    }
  });

  const finalResistance = baseResistance - totalResShred;
  const damageMultiplier = 1 - finalResistance;

  return {
    baseResistance,
    resShred: totalResShred,
    finalResistance,
    damageMultiplier,
  };
}

export function getResShredForElement(
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
  element: string,
): number {
  let total = 0;
  Object.entries(activeEffects).forEach(([effectId, state]) => {
    if (!state.enabled) return;
    const effect = ingameEffectsRegistry[effectId];
    if (!effect) return;
    const stacks = state.stacks || 1;
    switch (element.toLowerCase()) {
      case "fire":
        if (effect.flat?.fireResShred)
          total += effect.flat.fireResShred * stacks;
        if (effect.perStack?.fireResShred)
          total += effect.perStack.fireResShred * stacks;
        break;
      case "ice":
        if (effect.flat?.iceResShred) total += effect.flat.iceResShred * stacks;
        if (effect.perStack?.iceResShred)
          total += effect.perStack.iceResShred * stacks;
        break;
      case "electric":
        if (effect.flat?.electricResShred)
          total += effect.flat.electricResShred * stacks;
        if (effect.perStack?.electricResShred)
          total += effect.perStack.electricResShred * stacks;
        break;
      case "physical":
        if (effect.flat?.physicalResShred)
          total += effect.flat.physicalResShred * stacks;
        if (effect.perStack?.physicalResShred)
          total += effect.perStack.physicalResShred * stacks;
        break;
      case "ether":
        if (effect.flat?.etherResShred)
          total += effect.flat.etherResShred * stacks;
        if (effect.perStack?.etherResShred)
          total += effect.perStack.etherResShred * stacks;
        break;
      case "wind":
        if (effect.flat?.windResShred)
          total += effect.flat.windResShred * stacks;
        if (effect.perStack?.windResShred)
          total += effect.perStack.windResShred * stacks;
        break;
    }
  });
  return Math.max(-1, Math.min(total, 1));
}
