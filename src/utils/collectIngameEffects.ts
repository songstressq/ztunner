import type { Agent } from "@/types/Agent";
import type { WEngine } from "@/types/WEngine";
import type { DriveDisc } from "@/types/DriveDisc";
import type { IngameEffect } from "@/types/IngameEffect";
import discSets from "@/data/discSets.json";
import { getActiveSets } from "@/utils/setDetection";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";

interface Params {
  agent: Agent;
  engine: WEngine | null;
  discs: Record<number, DriveDisc>;
  teamEffects?: Record<
    string,
    { enabled: boolean; stacks: number; sourceSlot: number }
  >;
  activeMindscapes?: string[];
}

export function collectIngameEffects({
  agent,
  engine,
  discs,
  teamEffects = {},
  activeMindscapes = [],
}: Params): IngameEffect[] {
  const effects: IngameEffect[] = [];

  if ((agent as any).ingameEffects) {
    const agentEffects = (agent as any).ingameEffects as IngameEffect[];
    effects.push(
      ...agentEffects
        .filter((effect) => {
          if (effect.source === "mindscape") {
            return activeMindscapes.includes(effect.id);
          }
          return true;
        })
        .map((effect) => ({
          ...effect,
          ownerAgentId: agent.id,
          ownerDisplayName: agent.displayName || agent.name,
        })),
    );
  }

  if (engine && (engine as any).ingameEffects) {
    effects.push(...((engine as any).ingameEffects as IngameEffect[]));
  }
  const activeSets = getActiveSets(discs);
  for (const set of activeSets) {
    const setData = (discSets as any[]).find((d) => d.id === set.setId);
    if (!setData?.ingameEffects) continue;

    for (const effect of setData.ingameEffects) {
      if (
        (effect.id.includes("_4") && !set.effect4) ||
        (effect.id.includes("_2") && !set.effect2)
      ) {
        continue;
      }
      effects.push({
        ...effect,
        ownerAgentId: agent.id,
        ownerDisplayName: agent.displayName || agent.name,
      });
    }
  }

  Object.entries(teamEffects).forEach(([effectId, effectState]) => {
    if (effects.some((e) => e.id === effectId)) return;
    const effectFromRegistry = ingameEffectsRegistry[effectId];
    if (effectFromRegistry && effectState.enabled) {
      effects.push({
        ...effectFromRegistry,
        ownerAgentId: effectState.ownerAgentId,
        ownerDisplayName: effectState.ownerDisplayName,
      });
    }
  });

  return effects;
}
