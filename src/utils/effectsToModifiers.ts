import type { IngameEffect } from "@/types/IngameEffect";
import type { StatModifier } from "@/types/StatModifier";

export function effectToModifier(effect?: IngameEffect): StatModifier | null {
  if (!effect) return null;

  const modifier: StatModifier = {
    target: effect.target ?? "self",
    flat: effect.flat ?? {},
    percent: effect.percent ?? {},
    stacks: effect.stacks ?? 1,
  };

  return modifier;
}
