import type { StatModifier } from "@/types/StatModifier";

export function applyModifiers(stats: any, modifiers: StatModifier[]) {
  const result = structuredClone(stats);

  for (const mod of modifiers) {
    for (const key in mod) {
      if (key === "attributeDmgBonus") {
        for (const attr in mod.attributeDmgBonus) {
          result.attributeDmgBonus[attr] += mod.attributeDmgBonus[attr]!;
        }
      } else {
        result[key] += mod[key]!;
      }
    }
  }

  return result;
}
