import { IngameEffect } from "@/types/IngameEffect";

export function resolveEffect(effect: IngameEffect, stacks: number) {
  const result: Record<string, number> = {};

  if (effect.perStack) {
    for (const stat in effect.perStack) {
      result[stat] =
        (effect.perStack[stat as keyof typeof effect.perStack] ?? 0) * stacks;
    }
  }

  if (effect.flat) {
    for (const stat in effect.flat) {
      result[stat] = (result[stat] ?? 0) + effect.flat[stat]!;
    }
  }

  return result;
}
