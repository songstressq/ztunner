import type { IngameEffect } from "@/types/IngameEffect";
import { agents } from "./agents";
import { wEngines } from "./wengines";
import discSets from "./discSets.json";
import gameModesData from "./gameModes.json";

export const ingameEffectsRegistry: Record<string, IngameEffect> = {};

export function initializeEffectsRegistry() {
  agents.forEach((agent) => {
    if (agent.ingameEffects) {
      agent.ingameEffects.forEach((effect) => {
        ingameEffectsRegistry[effect.id] = {
          ...effect,
          source: effect.source || "core",
          sourceId: effect.sourceId || agent.id,
        };
      });
    }
  });

  wEngines.forEach((engine) => {
    if (engine.ingameEffects) {
      engine.ingameEffects.forEach((effect) => {
        ingameEffectsRegistry[effect.id] = {
          ...effect,
          source: effect.source || "wEngine",
          sourceId: effect.sourceId || engine.id,
        };
      });
    }
  });

  discSets.forEach((set) => {
    if (set.ingameEffects) {
      set.ingameEffects.forEach((effect) => {
        ingameEffectsRegistry[effect.id] = {
          ...effect,
          source: effect.source || "discSet",
          sourceId: effect.sourceId || set.id,
        };
      });
    }
  });
}

initializeEffectsRegistry();

function registerGameModeEffects() {
  const data = gameModesData as any;
  if (!data.modes) return;

  const registerEffects = (effects: any[] | undefined) => {
    if (!effects) return;
    for (const effect of effects) {
      ingameEffectsRegistry[effect.id] = {
        ...effect,
        source: "gameMode",
        sourced: effect.id,
        target: "team",
        ownerAgentId: undefined,
        ownerDisplayName: undefined,
      };
    }
  };

  for (const mode of data.modes) {
    // Rooms (efecto primario)
    if (mode.rooms) {
      for (const room of mode.rooms) {
        registerEffects(room.effects);
      }
    }
    // Buffs (sección extra de Deadly Assault)
    if (mode.buffs) {
      for (const buff of mode.buffs) {
        registerEffects(buff.effects);
      }
    }
    // Fallback legacy (modo con effects directos sin rooms)
    if (mode.effects) {
      registerEffects(mode.effects);
    }
  }
}

registerGameModeEffects();

export function getEffectById(effectId: string): IngameEffect | null {
  return ingameEffectsRegistry[effectId] || null;
}

export function getAllTeamEffects(): IngameEffect[] {
  return Object.values(ingameEffectsRegistry).filter(
    (e) => e.target === "team",
  );
}
