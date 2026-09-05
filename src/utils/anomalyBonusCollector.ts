import type { IngameEffect } from "@/types/IngameEffect";
import type { UnifiedStats } from "@/types/Agent";
import { ANOMALY_DEFINITIONS } from "@/types/Anomaly";
export interface AnomalyBonusSource {
  id: string;
  label: string;
  value: number;
  stacks: number;
  type: "anomaly" | "disorder";
  source: "wEngine" | "core" | "discSet" | "mindscape" | "unknown";
  sourceId: string;
  anomalyType?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}
export interface AnomalyBonuses {
  anomalyDmgBonus: number;
  disorderDmgBonus: number;
  disorderMultiplierBonus: number;
  vortexDmgBonus: number;
  vortexMultiplierBonus: number;
  anomalySources: AnomalyBonusSource[];
  disorderSources: AnomalyBonusSource[];
  disorderMultiplierSources: AnomalyBonusSource[];
  vortexMultiplierSources: AnomalyBonusSource[];
  vortexDmgSources: AnomalyBonusSource[];
  refringeSources: AnomalyBonusSource[];
  perAnomalyType: Record<string, { dmgBonus: number; disorderBonus: number }>;
  currentStatBonuses: Array<{
    source: string;
    label: string;
    currentValue: number;
    bonusValue: number;
    maxBonus: number;
    appliesTo: {
      anomaly?: boolean;
      disorder?: boolean;
      anomalyType?: string[];
    };
    basedOn?: string;
    ownerAgentId?: string;
    ownerDisplayName?: string;
  }>;
  breakdown: {
    totalAnomalyBonus: number;
    totalDisorderBonus: number;
    totalDisorderMultiplier: number;
    totalVortexDmgBonus: number;
    totalVortexMultiplier: number;
    totalRefringe: number;
  };
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
    return {
      ownerAgentId: currentAgentId,
      ownerDisplayName: currentAgentId,
    };
  }
  if (effect.sourceId) {
    const agentMatch = effect.sourceId.match(/^([a-zA-Z]+)-/);
    if (agentMatch) {
      const agentId = agentMatch[1];
      return {
        ownerAgentId: agentId,
        ownerDisplayName: agentId,
      };
    }
  }
  return {};
}

export function collectAnomalyBonuses(
  effects: IngameEffect[] | undefined | null,
  activeEffects: Record<
    string,
    { enabled: boolean; stacks: number; skillLevel?: number }
  >,
  unifiedStats: UnifiedStats,
  currentStats: UnifiedStats,
  teamOwnerStats: Record<string, UnifiedStats> = {},
  realTimeOwnerStats: Record<string, UnifiedStats> = {},
  currentAgentId?: string,
  previousAttribute?: AttributeType,
): AnomalyBonuses {
  if (!effects || !Array.isArray(effects)) {
    return {
      anomalyDmgBonus: 0,
      disorderDmgBonus: 0,
      disorderMultiplierBonus: 0,
      perAnomalyType: {},
      currentStatBonuses: [],
      breakdown: {
        totalAnomalyBonus: 0,
        totalDisorderBonus: 0,
        totalDisorderMultiplier: 0,
      },
    };
  }
  const bonuses: AnomalyBonuses = {
    anomalyDmgBonus: 0,
    disorderDmgBonus: 0,
    vortexDmgBonus: 0,
    disorderMultiplierBonus: 0,
    vortexMultiplierBonus: 0,
    anomalySources: [],
    disorderSources: [],
    vortexDmgSources: [],
    disorderMultiplierSources: [],
    vortexMultiplierSources: [],
    refringeSources: [],
    perAnomalyType: {},
    currentStatBonuses: [],
    breakdown: {
      totalAnomalyBonus: 0,
      totalDisorderBonus: 0,
      totalDisorderMultiplier: 0,
      totalVortexDmgBonus: 0,
      totalVortexMultiplier: 0,
      totalRefringe: 0,
    },
  };
  for (const effect of effects) {
    const state = activeEffects[effect.id];
    if (!state?.enabled) {
      continue;
    }
    if (effect.condition?.requiresDisorderAttribute) {
      const previousBaseAttribute =
        ANOMALY_DEFINITIONS[previousAttribute]?.attribute || previousAttribute;
      if (
        previousBaseAttribute !== effect.condition.requiresDisorderAttribute
      ) {
        continue;
      }
    }
    const stacks = state.stacks || 1;
    const skillLevel = state.skillLevel || 1;
    const overclockLevel = (state as any).overclockLevel || 1;
    const owner = getEffectOwner(effect, currentAgentId);
    if (effect.flat) {
      if (effect.flat.anomalyDmgBonus) {
        const value = effect.flat.anomalyDmgBonus * stacks;
        bonuses.anomalyDmgBonus += value;
        bonuses.anomalySources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "anomaly",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.flat.disorderDmgBonus) {
        const value = effect.flat.disorderDmgBonus * stacks;
        bonuses.disorderDmgBonus += value;
        bonuses.disorderSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "disorder",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.flat.disorderMultiplierBonus) {
        const value = effect.flat.disorderMultiplierBonus * stacks;
        bonuses.disorderMultiplierBonus += value;
        bonuses.disorderMultiplierSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.flat.vortexDmgBonus) {
        const value = effect.flat.vortexDmgBonus * stacks;
        bonuses.vortexDmgBonus += value;
        bonuses.vortexDmgSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "anomaly",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.flat.refringeCoefficient) {
        const value = effect.flat.refringeCoefficient * stacks;
        bonuses.refringeSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "anomaly",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
        bonuses.breakdown.totalRefringe += value;
      }
    }

    if (effect.perStack) {
      if (effect.perStack.anomalyDmgBonus) {
        const value = effect.perStack.anomalyDmgBonus * stacks;
        bonuses.anomalyDmgBonus += value;
        bonuses.anomalySources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "anomaly",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.perStack.disorderDmgBonus) {
        const value = effect.perStack.disorderDmgBonus * stacks;
        bonuses.disorderDmgBonus += value;
        bonuses.disorderSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "disorder",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.perStack.disorderMultiplierBonus) {
        const value = effect.perStack.disorderMultiplierBonus * stacks;
        bonuses.disorderMultiplierBonus += value;
        bonuses.disorderMultiplierSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.perStack.refringeCoefficient) {
        const value = effect.perStack.refringeCoefficient * stacks;
        bonuses.refringeSources.push({
          id: effect.id,
          label: effect.label,
          value,
          stacks,
          type: "anomaly",
          source: effect.source ?? "unknown",
          sourceId: effect.sourceId ?? effect.id,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
        bonuses.breakdown.totalRefringe += value;
      }
    }
    if (effect.conditional?.type === "currentStatBased") {
      const basedOn = effect.conditional.basedOn;
      const perUnit = effect.conditional.perUnit || 1;
      const perUnitBonus = effect.conditional.perUnitBonus || 0;
      const maxBonus = effect.conditional.maxBonus || Infinity;
      const threshold = effect.conditional.threshold || 0;
      const isTeamEffect = effect.target === "team";
      const isOwner = effect.ownerAgentId === currentAgentId;
      let statsToUse = currentStats;
      if (isTeamEffect && !isOwner && teamOwnerStats[effect.id]) {
        statsToUse = teamOwnerStats[effect.id];
      }
      let currentStatValue = 0;
      switch (basedOn) {
        case "anomalyMastery":
          currentStatValue = statsToUse.anomalyMastery;
          break;
        case "anomalyProficiency":
          currentStatValue = statsToUse.anomalyProficiency;
          break;
        case "hp":
          currentStatValue = statsToUse.hp;
          break;
        case "atk":
          currentStatValue = statsToUse.atk;
          break;
        case "def":
          currentStatValue = statsToUse.def;
          break;
        case "impact":
          currentStatValue = statsToUse.impact;
          break;
        case "critRate":
          currentStatValue = statsToUse.critRate * 100;
          break;
        case "energyRegen":
          currentStatValue = statsToUse.energyRegen;
          break;
        case "penRatio":
          currentStatValue = statsToUse.penRatio * 100;
          break;
        default:
          currentStatValue = 0;
      }
      const excess = Math.max(0, currentStatValue - threshold);
      const units = Math.floor(excess / perUnit);
      let bonusValue = units * perUnitBonus;
      if (maxBonus !== Infinity) {
        bonusValue = Math.min(bonusValue, maxBonus);
      }
      const appliesTo = {
        anomaly: effect.conditional.affectsAnomaly ?? true,
        disorder: effect.conditional.affectsDisorder ?? false,
        anomalyType: effect.conditional.anomalyType
          ? [effect.conditional.anomalyType]
          : [],
      };
      const anomalyBonusKeys = [
        "anomalyDmgBonus",
        "disorderDmgBonus",
        "disorderMultiplierBonus",
        "vortexDmgBonus",
        "vortexMultiplierBonus",
        "refringeCoefficient",
      ];
      const isAnomalyBonusEffect =
        effect.conditional.affectedStats?.some((stat) =>
          anomalyBonusKeys.includes(stat),
        ) ?? false;

      if (!isAnomalyBonusEffect) {
        continue;
      }

      const hasRefringe = effect.conditional.affectedStats?.includes(
        "refringeCoefficient",
      );
      if (!hasRefringe) {
        bonuses.currentStatBonuses.push({
          source: effect.id,
          label: effect.label,
          currentValue: currentStatValue,
          bonusValue,
          maxBonus,
          appliesTo,
          basedOn: effect.conditional.basedOn,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        });
      }
      if (effect.conditional.affectedStats) {
        effect.conditional.affectedStats.forEach((stat) => {
          switch (stat) {
            case "anomalyDmgBonus":
              bonuses.anomalyDmgBonus += bonusValue;
              break;
            case "disorderDmgBonus":
              bonuses.disorderDmgBonus += bonusValue;
              break;
            case "disorderMultiplierBonus":
              bonuses.disorderMultiplierBonus += bonusValue;
              break;
            case "refringeCoefficient":
              bonuses.refringeSources.push({
                id: effect.id,
                label: effect.label,
                value: bonusValue,
                stacks,
                type: "anomaly",
                source: effect.source ?? "unknown",
                sourceId: effect.sourceId ?? effect.id,
                ownerAgentId: owner.ownerAgentId,
                ownerDisplayName: owner.ownerDisplayName,
              });
              bonuses.breakdown.totalRefringe += bonusValue;
              break;
          }
        });
      }
    }
    if (effect.damageBonuses) {
      effect.damageBonuses.forEach((bonus) => {
        const totalValue = bonus.value * stacks;
        if (bonus.type === "anomalyDmgBonus") {
          bonuses.anomalyDmgBonus += totalValue;
          bonuses.anomalySources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            type: "anomaly",
            source: effect.source || "unknown",
            sourceId: effect.sourceId || effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "vortexDmg") {
          const totalValue = bonus.value * stacks;
          bonuses.vortexDmgBonus += totalValue;
          bonuses.vortexDmgSources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            stacks,
            type: "anomaly",
            source: effect.source ?? "unknown",
            sourceId: effect.sourceId ?? effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "disorderDmgBonus") {
          bonuses.disorderDmgBonus += totalValue;
          bonuses.disorderSources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            type: "disorder",
            source: effect.source || "unknown",
            sourceId: effect.sourceId || effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "disorderMultiplier") {
          const totalValue = bonus.value * stacks;
          bonuses.disorderMultiplierBonus += totalValue;
          bonuses.disorderMultiplierSources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            stacks,
            source: effect.source ?? "unknown",
            sourceId: effect.sourceId ?? effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "anomalyTypeDmg" && bonus.anomalyType) {
          if (!bonuses.perAnomalyType[bonus.anomalyType]) {
            bonuses.perAnomalyType[bonus.anomalyType] = {
              dmgBonus: 0,
              disorderBonus: 0,
            };
          }
          bonuses.perAnomalyType[bonus.anomalyType].dmgBonus += totalValue;
          bonuses.anomalySources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            stacks,
            type: "anomaly",
            anomalyType: bonus.anomalyType,
            source: effect.source ?? "unknown",
            sourceId: effect.sourceId ?? effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "disorderTypeDmg" && bonus.anomalyType) {
          if (!bonuses.perAnomalyType[bonus.anomalyType]) {
            bonuses.perAnomalyType[bonus.anomalyType] = {
              dmgBonus: 0,
              disorderBonus: 0,
            };
          }
          bonuses.perAnomalyType[bonus.anomalyType].disorderBonus += totalValue;
          bonuses.disorderSources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            stacks,
            type: "disorder",
            anomalyType: bonus.anomalyType,
            source: effect.source ?? "unknown",
            sourceId: effect.sourceId ?? effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
        if (bonus.type === "vortexMultiplierBonus") {
          const totalValue = (bonus.value || 0) * stacks;
          bonuses.vortexMultiplierBonus += totalValue;
          bonuses.vortexMultiplierSources.push({
            id: effect.id,
            label: effect.label,
            value: totalValue,
            stacks,
            type: "anomaly",
            source: effect.source ?? "unknown",
            sourceId: effect.sourceId ?? effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          });
        }
      });
    }
    if (effect.wEngineOverclock) {
      const currentLevel =
        effect.wEngineOverclock.levels.find(
          (l) => l.level === overclockLevel,
        ) || effect.wEngineOverclock.levels[0];
      if (currentLevel?.damageBonuses) {
        currentLevel.damageBonuses.forEach((bonus) => {
          const totalValue = bonus.value * stacks;
          if (bonus.type === "disorderDmgBonus") {
            bonuses.disorderDmgBonus += totalValue;
            bonuses.disorderSources.push({
              id: effect.id,
              label: effect.label,
              value: totalValue,
              type: "disorder",
              source: effect.source || "wEngine",
              sourceId: effect.sourceId || effect.id,
              ownerAgentId: owner.ownerAgentId,
              ownerDisplayName: owner.ownerDisplayName,
            });
          }
          if (bonus.type === "anomalyDmgBonus") {
            bonuses.anomalyDmgBonus += totalValue;
            bonuses.anomalySources.push({
              id: effect.id,
              label: effect.label,
              value: totalValue,
              stacks,
              type: "anomaly",
              source: effect.source ?? "wEngine",
              sourceId: effect.sourceId ?? effect.id,
              ownerAgentId: owner.ownerAgentId,
              ownerDisplayName: owner.ownerDisplayName,
            });
          }
          if (bonus.type === "disorderMultiplier") {
            bonuses.disorderMultiplierBonus += totalValue;
            bonuses.disorderMultiplierSources.push({
              id: effect.id,
              label: effect.label,
              value: totalValue,
              stacks,
              source: effect.source ?? "wEngine",
              sourceId: effect.sourceId ?? effect.id,
              ownerAgentId: owner.ownerAgentId,
              ownerDisplayName: owner.ownerDisplayName,
            });
          }
        });
      }
    }
  }
  bonuses.breakdown = {
    totalAnomalyBonus: bonuses.anomalyDmgBonus,
    totalDisorderBonus: bonuses.disorderDmgBonus,
    totalDisorderMultiplier: bonuses.disorderMultiplierBonus,
    totalRefringe: bonuses.breakdown.totalRefringe,
  };
  return bonuses;
}
