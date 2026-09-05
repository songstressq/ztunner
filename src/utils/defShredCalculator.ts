import type { IngameEffect } from "@/types/IngameEffect";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";

export function calculateTotalDefShred(
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
  isAnomaly: boolean = false,
): number {
  let totalDefShred = 0;
  Object.entries(activeEffects).forEach(([effectId, state]) => {
    if (!state.enabled) return;
    const effect = ingameEffectsRegistry[effectId];
    if (!effect) return;

    if (effect.condition?.appliesToAnomalyOnly && !isAnomaly) {
      return;
    }

    const stacks = state.stacks || 1;
    if (effect.flat?.defShred) {
      totalDefShred += effect.flat.defShred * stacks;
    }
    if (effect.perStack?.defShred) {
      totalDefShred += effect.perStack.defShred * stacks;
    }
  });
  return Math.max(0, Math.min(totalDefShred, 1));
}

export function getDefShredBySource(
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
  sourceType: "team" | "self" | "all" = "all",
): number {
  let totalDefShred = 0;
  Object.entries(activeEffects).forEach(([effectId, state]) => {
    if (!state.enabled) return;
    const effect = ingameEffectsRegistry[effectId];
    if (!effect) return;
    if (sourceType !== "all" && effect.target !== sourceType) return;
    const stacks = state.stacks || 1;
    if (effect.flat?.defShred) {
      totalDefShred += effect.flat.defShred * stacks;
    }
    if (effect.perStack?.defShred) {
      totalDefShred += effect.perStack.defShred * stacks;
    }
  });
  return Math.max(0, Math.min(totalDefShred, 1));
}

export function hasDefShredAccess(
  agentId: string,
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
): boolean {
  return Object.entries(activeEffects).some(([effectId, state]) => {
    if (!state.enabled) return false;
    const effect = ingameEffectsRegistry[effectId];
    if (!effect?.flat?.defShred && !effect?.perStack?.defShred) return false;
    return effect.ownerAgentId === agentId || effect.target === "team";
  });
}
