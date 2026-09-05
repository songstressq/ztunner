import type { IngameEffect } from "@/types/IngameEffect";
import type { UnifiedStats } from "@/types/Agent";

export interface DefenseBonusSource {
  id: string;
  name: string;
  value: number;
  stacks: number;
  type:
    | "defShred"
    | "resShred"
    | "skillTypeDefShred"
    | "aftershockDefShred"
    | "allResShred";
  element?: string;
  skillType?: string;
  source: "core" | "wEngine" | "discSet" | "mindscape" | "unknown";
  sourceId: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

export interface CollectedDefenseBonuses {
  totalDefShred: number;
  totalAftershockDefShred: number;
  resShreds: Record<string, { total: number; sources: DefenseBonusSource[] }>;
  skillTypeDefShred: Record<
    string,
    { total: number; sources: DefenseBonusSource[] }
  >;
  allResShred: { total: number; sources: DefenseBonusSource[] };
  sources: DefenseBonusSource[];
}

function getEffectOwner(
  effect: any,
  currentAgentId?: string,
): { ownerAgentId?: string; ownerDisplayName?: string } {
  if (effect.ownerAgentId) {
    return {
      ownerAgentId: effect.ownerAgentId,
      ownerDisplayName: effect.ownerDisplayName || effect.ownerAgentId,
    };
  }
  if (effect.target === "self" && currentAgentId) {
    return { ownerAgentId: currentAgentId, ownerDisplayName: currentAgentId };
  }
  if (effect.sourceId) {
    const agentMatch = effect.sourceId.match(/^([a-zA-Z]+)-/);
    if (agentMatch) {
      const agentId = agentMatch[1];
      return { ownerAgentId: agentId, ownerDisplayName: agentId };
    }
  }
  return {};
}

export function collectDefenseBonuses(
  effects: IngameEffect[] | undefined | null,
  activeEffects: Record<
    string,
    { enabled: boolean; stacks: number; skillLevel?: number }
  >,
  skillLevels: Record<string, number> = {},
  overclockLevels: Record<string, number> = {},
  unifiedStats?: UnifiedStats,
  initialStats?: {
    hp?: number;
    atk?: number;
    def?: number;
    energyRegen?: number;
  },
  teamEffects?: Record<string, any>,
  currentAgentId?: string,
): CollectedDefenseBonuses {
  const result: CollectedDefenseBonuses = {
    totalDefShred: 0,
    totalAftershockDefShred: 0,
    resShreds: {},
    skillTypeDefShred: {},
    allResShred: { total: 0, sources: [] },
    sources: [],
  };

  if (!effects) return result;

  const elements = ["fire", "ice", "electric", "physical", "ether", "wind"];
  elements.forEach((el) => {
    result.resShreds[el] = { total: 0, sources: [] };
  });

  const addSource = (
    value: number,
    type: DefenseBonusSource["type"],
    effect: any,
    stacks: number,
    element?: string,
    skillType?: string,
  ) => {
    if (value === 0) return;
    const owner = getEffectOwner(effect, currentAgentId);
    const source: DefenseBonusSource = {
      id: effect.id,
      name: effect.label,
      value,
      stacks,
      type,
      element,
      skillType,
      source: effect.source || "unknown",
      sourceId: effect.sourceId || effect.id,
      ownerAgentId: owner.ownerAgentId,
      ownerDisplayName: owner.ownerDisplayName,
    };
    result.sources.push(source);

    switch (type) {
      case "defShred":
        result.totalDefShred += value;
        break;
      case "aftershockDefShred":
        result.totalAftershockDefShred += value;
        break;
      case "allResShred":
        result.allResShred.total += value;
        result.allResShred.sources.push(source);
        break;
      case "resShred":
        if (element) {
          if (!result.resShreds[element]) {
            result.resShreds[element] = { total: 0, sources: [] };
          }
          result.resShreds[element].total += value;
          result.resShreds[element].sources.push(source);
        }
        break;
      case "skillTypeDefShred":
        if (skillType) {
          if (!result.skillTypeDefShred[skillType]) {
            result.skillTypeDefShred[skillType] = { total: 0, sources: [] };
          }
          result.skillTypeDefShred[skillType].total += value;
          result.skillTypeDefShred[skillType].sources.push(source);
        }
        break;
    }
  };

  for (const effect of effects) {
    const state = activeEffects[effect.id];
    if (!state?.enabled) continue;
    const stacks = state.stacks || 1;
    const resKeys = [
      "fireResShred",
      "iceResShred",
      "electricResShred",
      "physicalResShred",
      "etherResShred",
      "windResShred",
    ];
    const getResValues = (source: any): number[] => {
      return resKeys.map((k) => (source?.[k] ?? 0) * stacks);
    };

    if (effect.flat) {
      const flatValues = getResValues(effect.flat);
      const allSame =
        flatValues.every((v) => v === flatValues[0]) && flatValues[0] > 0;
      if (allSame && flatValues[0] > 0) {
        addSource(flatValues[0], "allResShred", effect, stacks);
      } else {
        resKeys.forEach((key, idx) => {
          const val = (effect.flat as any)[key];
          if (val && val * stacks > 0) {
            const element = key.replace("ResShred", "").toLowerCase();
            addSource(val * stacks, "resShred", effect, stacks, element);
          }
        });
      }
      if (effect.flat.defShred) {
        addSource(effect.flat.defShred * stacks, "defShred", effect, stacks);
      }
      if ((effect as any).aftershockDefShred) {
        addSource(
          (effect as any).aftershockDefShred * stacks,
          "aftershockDefShred",
          effect,
          stacks,
        );
      }
    }

    if (effect.perStack) {
      const perStackValues = getResValues(effect.perStack);
      const allSame =
        perStackValues.every((v) => v === perStackValues[0]) &&
        perStackValues[0] > 0;
      if (allSame && perStackValues[0] > 0) {
        addSource(perStackValues[0], "allResShred", effect, stacks);
      } else {
        resKeys.forEach((key, idx) => {
          const val = (effect.perStack as any)[key];
          if (val && val * stacks > 0) {
            const element = key.replace("ResShred", "").toLowerCase();
            addSource(val * stacks, "resShred", effect, stacks, element);
          }
        });
      }

      if (effect.perStack.defShred) {
        addSource(
          effect.perStack.defShred * stacks,
          "defShred",
          effect,
          stacks,
        );
      }
    }

    if (effect.wEngineOverclock) {
      const ocLevel = overclockLevels[effect.id] || 1;
      const currentLevel =
        effect.wEngineOverclock.levels.find((l: any) => l.level === ocLevel) ||
        effect.wEngineOverclock.levels[0];
      if (currentLevel) {
        const processStats = (stats: any) => {
          if (!stats) return;
          const allResKeys = resKeys.map((k) => stats[k] ?? 0);
          const allSame =
            allResKeys.every((v) => v === allResKeys[0]) && allResKeys[0] > 0;
          if (allSame && allResKeys[0] > 0) {
            addSource(allResKeys[0] * stacks, "allResShred", effect, stacks);
          } else {
            resKeys.forEach((key) => {
              const val = stats[key];
              if (val && val * stacks > 0) {
                const element = key.replace("ResShred", "").toLowerCase();
                addSource(val * stacks, "resShred", effect, stacks, element);
              }
            });
          }
          if (stats.defShred) {
            addSource(stats.defShred * stacks, "defShred", effect, stacks);
          }
        };
        processStats(currentLevel.stats);
        processStats(currentLevel.baseStats);
      }
    }

    if (effect.exclusiveStatBonuses) {
      for (const bonus of effect.exclusiveStatBonuses) {
        const value = bonus.value * stacks;
        if (value === 0) continue;
        const stat = bonus.stat;
        const element = stat.replace("ResShred", "").toLowerCase();
        if (
          ["fire", "ice", "electric", "physical", "ether", "wind"].includes(
            element,
          )
        ) {
          addSource(value, "resShred", effect, stacks, element);
        }
      }
    }
  }

  Object.keys(result.resShreds).forEach((el) => {
    if (result.resShreds[el].sources.length === 0) {
      delete result.resShreds[el];
    }
  });

  return result;
}
