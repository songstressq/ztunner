import type { IngameEffect, DamageBonus } from "@/types/IngameEffect";
import type { UnifiedStats } from "@/types/Agent";

export interface BonusSource {
  id: string;
  name: string;
  type:
    | "global"
    | "element"
    | "skillType"
    | "exclusive"
    | "stat"
    | "hitExclusive"
    | "hitStatExclusive"
    | "skillTypeElemental"
    | "skillTypeStat"
    | "skillTypeElementalSheer"
    | "critDamageElementalBonus"
    | "elementSheerDmg"
    | "sheerDmg";
  value: number;
  element?: string;
  skillType?: string;
  skillId?: string;
  hitName?: string;
  stat?: string;
  stacks?: number;
  source: "core" | "wEngine" | "discSet" | "mindscape" | "unknown";
  sourceId: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

export interface CollectedBonuses {
  global: number;
  elements: Record<string, number>;
  skillTypes: Record<string, number>;
  exclusive: Record<string, number>;
  skillTypeElemental?: Record<string, Record<string, number>>;
  skillTypeElementalSheer?: Record<string, Record<string, number>>;
  skillTypeStats?: Record<string, Record<string, number>>;
  critDamageElementalBonus?: Record<string, number>;
  _defShredBySkillType?: Record<string, number>;
  sheerDmgBonus: number;
  elementSheerDmgBonus: Record<string, number>;
  exclusiveSheerDmg: Record<string, number>;
  exclusiveElementSheerDmg: Record<string, Record<string, number>>;
  statBonuses: Record<string, Record<string, number>>;
  elementExclusive: Record<string, Record<string, number>>;
  hitExclusive: Record<string, Record<string, number>>;
  hitStatExclusive: Record<string, Record<string, Record<string, number>>>;
  elementStatBonuses?: Record<string, Record<string, number>>;
  sheerDmgFlat?: number;
  assaultCritDmgTotal?: number;
  sources: BonusSource[];
  breakdown: {
    dmgMod: {
      global: number;
      elements: Record<string, number>;
      skillTypes: Record<string, number>;
      exclusive: Record<string, number>;
      total: number;
      sources: BonusSource[];
    };
    sheerMod: {
      general: number;
      elements: Record<string, number>;
      total: number;
      sources: BonusSource[];
    };
    statBonuses: Record<
      string,
      {
        total: number;
        sources: BonusSource[];
      }
    >;
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

function calculateConditionalBonus(
  effect: any,
  initialStat: number,
  skillLevel: number = 1,
): number {
  if (
    !effect.conditional ||
    effect.conditional.type !== "initialStatBasedDamageBonus"
  ) {
    return 0;
  }

  const {
    basedOn,
    maxStat = Infinity,
    baseBonus = 0,
    perUnit = 1,
    skillLevels,
    threshold = 0,
  } = effect.conditional;

  if (skillLevels && skillLevels.length > 0) {
    const currentLevel =
      skillLevels.find((l: any) => l.level === skillLevel) || skillLevels[0];
    if (!currentLevel) return baseBonus;

    const levelBaseBonus =
      currentLevel.baseBonus !== undefined ? currentLevel.baseBonus : baseBonus;
    const perUnitBonus = currentLevel.perUnitBonus || 0;

    let excessStat = Math.max(0, initialStat - threshold);
    if (maxStat !== Infinity) {
      excessStat = Math.min(excessStat, maxStat);
    }

    const units = Math.floor(excessStat / perUnit);
    const fromStat = units * perUnitBonus;
    const total = levelBaseBonus + fromStat;
    const final =
      currentLevel.maxBonus !== undefined
        ? Math.min(total, currentLevel.maxBonus)
        : total;
    return final;
  }

  let excessStat = Math.max(0, initialStat - threshold);
  if (maxStat !== Infinity) {
    excessStat = Math.min(excessStat, maxStat);
  }

  const units = Math.floor(excessStat / perUnit);
  const fromStat = units * (effect.conditional.perUnitBonus || 0);
  const total = baseBonus + fromStat;

  return effect.conditional.maxBonus !== undefined
    ? Math.min(total, effect.conditional.maxBonus)
    : total;
}

export function collectDamageBonuses(
  effects: IngameEffect[],
  activeEffects: Record<string, { enabled: boolean; stacks: number }>,
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
): CollectedBonuses {
  const bonuses: CollectedBonuses = {
    global: 0,
    elements: {
      fire: 0,
      ice: 0,
      electric: 0,
      physical: 0,
      ether: 0,
      wind: 0,
      aftershock: 0,
    },
    skillTypes: {},
    exclusive: {},
    skillTypeElemental: {},
    skillTypeStats: {},
    sheerDmgBonus: 0,
    elementSheerDmgBonus: {
      fire: 0,
      ice: 0,
      electric: 0,
      physical: 0,
      ether: 0,
      wind: 0,
    },
    exclusiveSheerDmg: {},
    exclusiveElementSheerDmg: {},
    statBonuses: {},
    elementExclusive: {},
    hitExclusive: {},
    hitStatExclusive: {},
    elementStatBonuses: {},
    sheerDmgFlat: 0,
    sources: [],
    breakdown: {
      dmgMod: {
        global: 0,
        elements: {},
        skillTypes: {},
        exclusive: {},
        total: 0,
        sources: [],
      },
      sheerMod: {
        general: 0,
        elements: {},
        total: 0,
        sources: [],
      },
      statBonuses: {},
    },
  };

  for (const effect of effects) {
    const isActive = activeEffects[effect.id]?.enabled;
    if (!isActive) continue;

    const stacks = activeEffects[effect.id]?.stacks || 1;
    const owner = getEffectOwner(effect, currentAgentId);

    if ((effect as any).assaultCritDmgBase) {
      bonuses.assaultCritDmgTotal =
        (bonuses.assaultCritDmgTotal || 0) +
        (effect as any).assaultCritDmgBase * stacks;
    }

    let effectInitialStats = initialStats;
    if (
      effect.target === "team" &&
      teamEffects?.[effect.id]?.ownerInitialStats
    ) {
      effectInitialStats = teamEffects[effect.id].ownerInitialStats;
    }

    if (effect.conditional?.type === "initialStatBasedDamageBonus") {
      const basedOn = effect.conditional.basedOn;
      const initialValue =
        effectInitialStats?.[basedOn as keyof typeof effectInitialStats] || 0;
      const conditionalBonus = calculateConditionalBonus(
        effect,
        initialValue,
        skillLevels[effect.id] || 1,
      );

      const damageBonus: DamageBonus = {
        type: effect.conditional.damageBonusType || "global",
        value: conditionalBonus,
      };

      if (damageBonus.type === "exclusive") {
        if (effect.conditional.damageBonusSkillId) {
          damageBonus.appliesTo = [effect.conditional.damageBonusSkillId];
        } else if (effect.conditional.damageBonusAppliesTo) {
          damageBonus.appliesTo = effect.conditional.damageBonusAppliesTo;
        }
      }

      if (effect.conditional.damageBonusElement) {
        damageBonus.element = effect.conditional.damageBonusElement;
      }

      if (effect.conditional.damageBonusSkillType) {
        damageBonus.skillType = effect.conditional.damageBonusSkillType;
      }

      if (effect.conditional.damageBonusAnomalyType) {
        (damageBonus as any).anomalyType =
          effect.conditional.damageBonusAnomalyType;
      }

      processDamageBonus(
        effect,
        damageBonus,
        conditionalBonus,
        stacks,
        bonuses,
        owner,
      );
    }

    if (effect.damageBonuses) {
      for (const bonus of effect.damageBonuses) {
        const totalValue = (bonus.value || 0) * stacks;
        const sourceType = effect.source || "unknown";
        const sourceId = effect.sourceId || effect.id;

        const baseSource: BonusSource = {
          id: effect.id,
          name: effect.label,
          type: bonus.type as any,
          value: totalValue,
          stacks,
          source: sourceType,
          sourceId,
          ownerAgentId: owner.ownerAgentId,
          ownerDisplayName: owner.ownerDisplayName,
        };

        switch (bonus.type) {
          case "global":
            bonuses.global += totalValue;
            bonuses.breakdown.dmgMod.global += totalValue;
            bonuses.sources.push({ ...baseSource, type: "global" });
            bonuses.breakdown.dmgMod.sources.push({
              ...baseSource,
              type: "global",
            });
            break;

          case "element":
            if (bonus.element) {
              const totalValue = (bonus.value || 0) * stacks;
              bonuses.elements[bonus.element] =
                (bonuses.elements[bonus.element] || 0) + totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "element",
                element: bonus.element,
              });
              bonuses.breakdown.dmgMod.elements[bonus.element] =
                (bonuses.breakdown.dmgMod.elements[bonus.element] || 0) +
                totalValue;
            }
            break;

          case "skillType":
            if (bonus.skillType) {
              bonuses.skillTypes[bonus.skillType] =
                (bonuses.skillTypes[bonus.skillType] || 0) + totalValue;
              bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] =
                (bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] || 0) +
                totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "skillType",
                skillType: bonus.skillType,
              });
              bonuses.breakdown.dmgMod.sources.push({
                ...baseSource,
                type: "skillType",
                skillType: bonus.skillType,
              });
            }
            break;

          case "exclusive":
            if (bonus.appliesTo) {
              if (bonus.exclusiveType === "sheerDmg") {
                for (const skillId of bonus.appliesTo) {
                  bonuses.exclusiveSheerDmg[skillId] =
                    (bonuses.exclusiveSheerDmg[skillId] || 0) + totalValue;
                  bonuses.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                  });
                  bonuses.breakdown.sheerMod.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                  });
                }
              } else if (
                bonus.exclusiveType === "elementSheerDmg" &&
                bonus.element
              ) {
                for (const skillId of bonus.appliesTo) {
                  if (!bonuses.exclusiveElementSheerDmg[skillId]) {
                    bonuses.exclusiveElementSheerDmg[skillId] = {};
                  }
                  bonuses.exclusiveElementSheerDmg[skillId][bonus.element] =
                    (bonuses.exclusiveElementSheerDmg[skillId][bonus.element] ||
                      0) + totalValue;
                  bonuses.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                    element: bonus.element,
                  });
                  bonuses.breakdown.sheerMod.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                    element: bonus.element,
                  });
                }
              } else {
                for (const skillId of bonus.appliesTo) {
                  bonuses.exclusive[skillId] =
                    (bonuses.exclusive[skillId] || 0) + totalValue;
                  bonuses.breakdown.dmgMod.exclusive[skillId] =
                    (bonuses.breakdown.dmgMod.exclusive[skillId] || 0) +
                    totalValue;
                  bonuses.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                  });
                  bonuses.breakdown.dmgMod.sources.push({
                    ...baseSource,
                    type: "exclusive",
                    skillId,
                  });
                }
              }
            }
            break;

          case "sheerDmg":
            bonuses.sheerDmgBonus += totalValue;
            bonuses.breakdown.sheerMod.general += totalValue;
            bonuses.sources.push({ ...baseSource, type: "sheerDmg" });
            bonuses.breakdown.sheerMod.sources.push({
              ...baseSource,
              type: "sheerDmg",
            });
            break;

          case "elementSheerDmg":
            if (bonus.element) {
              bonuses.elementSheerDmgBonus[bonus.element] =
                (bonuses.elementSheerDmgBonus[bonus.element] || 0) + totalValue;
              bonuses.breakdown.sheerMod.elements[bonus.element] =
                (bonuses.breakdown.sheerMod.elements[bonus.element] || 0) +
                totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "elementSheerDmg",
                element: bonus.element,
              });
              bonuses.breakdown.sheerMod.sources.push({
                ...baseSource,
                type: "elementSheerDmg",
                element: bonus.element,
              });
            }
            break;

          case "elementExclusive":
            if (bonus.appliesTo && bonus.element) {
              for (const skillId of bonus.appliesTo) {
                if (!bonuses.elementExclusive[skillId]) {
                  bonuses.elementExclusive[skillId] = {};
                }
                bonuses.elementExclusive[skillId][bonus.element] =
                  (bonuses.elementExclusive[skillId][bonus.element] || 0) +
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "exclusive",
                  skillId,
                  element: bonus.element,
                });
                bonuses.breakdown.dmgMod.sources.push({
                  ...baseSource,
                  type: "exclusive",
                  skillId,
                  element: bonus.element,
                });
              }
            }
            break;

          case "hitExclusive":
            if (bonus.skillId) {
              const hitsToApply = bonus.hitName
                ? [bonus.hitName]
                : bonus.hitNames || [];
              for (const hitName of hitsToApply) {
                if (!bonuses.hitExclusive[bonus.skillId]) {
                  bonuses.hitExclusive[bonus.skillId] = {};
                }
                bonuses.hitExclusive[bonus.skillId][hitName] =
                  (bonuses.hitExclusive[bonus.skillId][hitName] || 0) +
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "hitExclusive",
                  skillId: bonus.skillId,
                  hitName: hitName,
                });
              }
            }
            break;

          case "hitStatExclusive":
            let statSkillIds: string[] = [];
            if (bonus.skillId) {
              statSkillIds = [bonus.skillId];
            } else if (bonus.appliesTo && Array.isArray(bonus.appliesTo)) {
              statSkillIds = bonus.appliesTo;
            }
            if (statSkillIds.length === 0 || !bonus.stat) break;

            const statHitsToApply = bonus.hitName
              ? [bonus.hitName]
              : bonus.hitNames || [];
            for (const skillId of statSkillIds) {
              for (const hitName of statHitsToApply) {
                if (!bonuses.hitStatExclusive[skillId]) {
                  bonuses.hitStatExclusive[skillId] = {};
                }
                if (!bonuses.hitStatExclusive[skillId][hitName]) {
                  bonuses.hitStatExclusive[skillId][hitName] = {};
                }
                const statName = bonus.stat;
                bonuses.hitStatExclusive[skillId][hitName][statName] =
                  (bonuses.hitStatExclusive[skillId][hitName][statName] || 0) +
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "hitStatExclusive",
                  skillId,
                  hitName,
                  stat: statName,
                });
              }
            }
            break;

          case "skillTypeElemental":
            if (bonus.element && bonus.skillType) {
              if (!bonuses.skillTypeElemental) {
                bonuses.skillTypeElemental = {};
              }
              if (!bonuses.skillTypeElemental[bonus.skillType]) {
                bonuses.skillTypeElemental[bonus.skillType] = {
                  fire: 0,
                  ice: 0,
                  electric: 0,
                  physical: 0,
                  ether: 0,
                  aftershock: 0,
                };
              }
              bonuses.skillTypeElemental[bonus.skillType][bonus.element] +=
                totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "skillTypeElemental",
                element: bonus.element,
                skillType: bonus.skillType,
              });
            }
            break;

          case "skillTypeStat":
            if (bonus.skillType && bonus.stat) {
              if (!bonuses.skillTypeStats) {
                bonuses.skillTypeStats = {};
              }
              if (!bonuses.skillTypeStats[bonus.skillType]) {
                bonuses.skillTypeStats[bonus.skillType] = {};
              }
              bonuses.skillTypeStats[bonus.skillType][bonus.stat] =
                (bonuses.skillTypeStats[bonus.skillType][bonus.stat] || 0) +
                totalValue;

              if (bonus.stat === "defShred") {
                if (!bonuses._defShredBySkillType) {
                  bonuses._defShredBySkillType = {};
                }
                if (!bonuses._defShredBySkillType[bonus.skillType]) {
                  bonuses._defShredBySkillType[bonus.skillType] = 0;
                }
                bonuses._defShredBySkillType[bonus.skillType] += totalValue;
              }

              bonuses.sources.push({
                ...baseSource,
                type: "skillTypeStat",
                skillType: bonus.skillType,
                stat: bonus.stat,
              });
            }
            break;

          case "skillTypeElementalSheer":
            if (bonus.element && bonus.skillType) {
              if (!bonuses.skillTypeElementalSheer) {
                bonuses.skillTypeElementalSheer = {};
              }
              if (!bonuses.skillTypeElementalSheer[bonus.skillType]) {
                bonuses.skillTypeElementalSheer[bonus.skillType] = {};
              }
              bonuses.skillTypeElementalSheer[bonus.skillType][bonus.element] =
                (bonuses.skillTypeElementalSheer[bonus.skillType]?.[
                  bonus.element
                ] || 0) + totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "skillTypeElementalSheer",
                element: bonus.element,
                skillType: bonus.skillType,
              });
            }
            break;

          case "critDamageElementalBonus":
            if (bonus.element) {
              if (!bonuses.critDamageElementalBonus) {
                bonuses.critDamageElementalBonus = {};
              }
              bonuses.critDamageElementalBonus[bonus.element] =
                (bonuses.critDamageElementalBonus[bonus.element] || 0) +
                totalValue;
              bonuses.sources.push({
                ...baseSource,
                type: "critDamageElementalBonus",
                element: bonus.element,
              });
            }
            break;

          case "assaultCritDmgBonus":
            bonuses.assaultCritDmgTotal =
              (bonuses.assaultCritDmgTotal || 0) + totalValue;
            break;
        }
      }
    }

    if (effect.flat?.sheerDmgFlat) {
      bonuses.sheerDmgFlat += effect.flat.sheerDmgFlat * stacks;
    }

    if (effect.dynamicStatBonuses && unifiedStats) {
      for (const dynamicBonus of effect.dynamicStatBonuses) {
        const baseStatValue = (unifiedStats[dynamicBonus.stat] as number) || 0;
        let bonusValue = baseStatValue * dynamicBonus.multiplier * stacks;
        if (dynamicBonus.maxValue) {
          bonusValue = Math.min(bonusValue, dynamicBonus.maxValue);
        }
        if (dynamicBonus.targetStat === "critDmg") {
          if (dynamicBonus.appliesTo.element) {
            const elementKey = dynamicBonus.appliesTo.element;
            if (!bonuses.elementStatBonuses[elementKey]) {
              bonuses.elementStatBonuses[elementKey] = {};
            }
            bonuses.elementStatBonuses[elementKey].critDmg =
              (bonuses.elementStatBonuses[elementKey].critDmg || 0) +
              bonusValue;
          }
          if (dynamicBonus.appliesTo.skillIds) {
            for (const skillId of dynamicBonus.appliesTo.skillIds) {
              if (!bonuses.statBonuses[skillId]) {
                bonuses.statBonuses[skillId] = {};
              }
              bonuses.statBonuses[skillId].critDmg =
                (bonuses.statBonuses[skillId].critDmg || 0) + bonusValue;
            }
          }
        }
      }
    }

    if (
      effect.conditional?.type === "skillLevelBased" &&
      effect.conditional.skillBonusTable
    ) {
      const skillLevel = skillLevels[effect.id] || 1;
      const exactLevel = effect.conditional.skillBonusTable.find(
        (l) => l.level === skillLevel,
      );
      const levelData =
        exactLevel ||
        effect.conditional.skillBonusTable[
          effect.conditional.skillBonusTable.length - 1
        ] ||
        effect.conditional.skillBonusTable[0];

      if (levelData?.damageBonuses) {
        for (const bonus of levelData.damageBonuses) {
          const totalValue = bonus.value * stacks;
          const sourceType = effect.source || "unknown";
          const sourceId = effect.sourceId || effect.id;

          const baseSource: BonusSource = {
            id: effect.id,
            name: effect.label,
            type: bonus.type as any,
            value: totalValue,
            stacks,
            source: sourceType,
            sourceId,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          };

          switch (bonus.type) {
            case "global":
              bonuses.global += totalValue;
              bonuses.sources.push({ ...baseSource, type: "global" });
              break;
            case "element":
              if (bonus.element) {
                bonuses.elements[bonus.element] += totalValue;
              }
              break;
            case "skillType":
              if (bonus.skillType) {
                bonuses.skillTypes[bonus.skillType] += totalValue;
              }
              break;
            case "exclusive":
              if (bonus.appliesTo) {
                if (bonus.exclusiveType === "sheerDmg") {
                  for (const skillId of bonus.appliesTo) {
                    bonuses.exclusiveSheerDmg[skillId] =
                      (bonuses.exclusiveSheerDmg[skillId] || 0) + totalValue;
                  }
                } else if (
                  bonus.exclusiveType === "elementSheerDmg" &&
                  bonus.element
                ) {
                  for (const skillId of bonus.appliesTo) {
                    if (!bonuses.exclusiveElementSheerDmg[skillId]) {
                      bonuses.exclusiveElementSheerDmg[skillId] = {};
                    }
                    bonuses.exclusiveElementSheerDmg[skillId][bonus.element] =
                      (bonuses.exclusiveElementSheerDmg[skillId][
                        bonus.element
                      ] || 0) + totalValue;
                  }
                } else {
                  for (const skillId of bonus.appliesTo) {
                    bonuses.exclusive[skillId] =
                      (bonuses.exclusive[skillId] || 0) + totalValue;
                    bonuses.breakdown.dmgMod.exclusive[skillId] =
                      (bonuses.breakdown.dmgMod.exclusive[skillId] || 0) +
                      totalValue;
                  }
                }
              }
              break;
            case "elementExclusive":
              if (bonus.appliesTo && bonus.element) {
                for (const skillId of bonus.appliesTo) {
                  if (!bonuses.elementExclusive[skillId]) {
                    bonuses.elementExclusive[skillId] = {};
                  }
                  bonuses.elementExclusive[skillId][bonus.element] =
                    (bonuses.elementExclusive[skillId][bonus.element] || 0) +
                    totalValue;
                }
              }
              break;
            case "hitExclusive":
              if (bonus.skillId) {
                const hitsToApply = bonus.hitName
                  ? [bonus.hitName]
                  : bonus.hitNames || [];
                for (const hitName of hitsToApply) {
                  if (!bonuses.hitExclusive[bonus.skillId]) {
                    bonuses.hitExclusive[bonus.skillId] = {};
                  }
                  bonuses.hitExclusive[bonus.skillId][hitName] =
                    (bonuses.hitExclusive[bonus.skillId][hitName] || 0) +
                    totalValue;
                }
              }
              break;
          }
        }
      }
    }

    if (effect.wEngineOverclock) {
      const overclockLevel = overclockLevels[effect.id] || 1;
      const currentLevel =
        effect.wEngineOverclock.levels.find(
          (l) => l.level === overclockLevel,
        ) || effect.wEngineOverclock.levels[0];

      if (currentLevel?.damageBonuses) {
        for (const bonus of currentLevel.damageBonuses) {
          const totalValue = bonus.value * stacks;
          const sourceType = effect.source || "wEngine";
          const sourceId = effect.sourceId || effect.id;

          const baseSource: BonusSource = {
            id: effect.id,
            name: effect.label,
            type: bonus.type as any,
            value: totalValue,
            stacks,
            source: sourceType,
            sourceId,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          };

          switch (bonus.type) {
            case "global":
              bonuses.global += totalValue;
              bonuses.breakdown.dmgMod.global += totalValue;
              bonuses.sources.push({ ...baseSource, type: "global" });
              bonuses.breakdown.dmgMod.sources.push({
                ...baseSource,
                type: "global",
              });
              break;

            case "element":
              if (bonus.element) {
                const totalValue = bonus.value * stacks;
                bonuses.elements[bonus.element] =
                  (bonuses.elements[bonus.element] || 0) + totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "element",
                  element: bonus.element,
                });
                bonuses.breakdown.dmgMod.elements[bonus.element] =
                  (bonuses.breakdown.dmgMod.elements[bonus.element] || 0) +
                  totalValue;
              }
              break;

            case "skillType":
              if (bonus.skillType) {
                bonuses.skillTypes[bonus.skillType] =
                  (bonuses.skillTypes[bonus.skillType] || 0) + totalValue;
                bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] =
                  (bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] || 0) +
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "skillType",
                  skillType: bonus.skillType,
                });
                bonuses.breakdown.dmgMod.sources.push({
                  ...baseSource,
                  type: "skillType",
                  skillType: bonus.skillType,
                });
              }
              break;

            case "skillTypeElemental":
              if (bonus.element && bonus.skillType) {
                if (!bonuses.skillTypeElemental) {
                  bonuses.skillTypeElemental = {};
                }

                if (!bonuses.skillTypeElemental[bonus.skillType]) {
                  bonuses.skillTypeElemental[bonus.skillType] = {
                    fire: 0,
                    ice: 0,
                    electric: 0,
                    physical: 0,
                    ether: 0,
                    aftershock: 0,
                  };
                }

                bonuses.skillTypeElemental[bonus.skillType][bonus.element] +=
                  totalValue;

                bonuses.sources.push({
                  ...baseSource,
                  type: "skillTypeElemental",
                  element: bonus.element,
                  skillType: bonus.skillType,
                });
              }
              break;

            case "skillTypeStat":
              if (bonus.skillType && bonus.stat) {
                if (!bonuses.skillTypeStats) {
                  bonuses.skillTypeStats = {};
                }
                if (!bonuses.skillTypeStats[bonus.skillType]) {
                  bonuses.skillTypeStats[bonus.skillType] = {};
                }
                bonuses.skillTypeStats[bonus.skillType][bonus.stat] =
                  (bonuses.skillTypeStats[bonus.skillType][bonus.stat] || 0) +
                  totalValue;

                if (bonus.stat === "defShred") {
                  if (!bonuses._defShredBySkillType) {
                    bonuses._defShredBySkillType = {};
                  }
                  if (!bonuses._defShredBySkillType[bonus.skillType]) {
                    bonuses._defShredBySkillType[bonus.skillType] = 0;
                  }
                  bonuses._defShredBySkillType[bonus.skillType] += totalValue;
                }

                bonuses.sources.push({
                  ...baseSource,
                  type: "skillTypeStat",
                  skillType: bonus.skillType,
                  stat: bonus.stat,
                });
              }
              break;

            case "exclusive":
              if (bonus.appliesTo) {
                if (bonus.exclusiveType === "sheerDmg") {
                  for (const skillId of bonus.appliesTo) {
                    bonuses.exclusiveSheerDmg[skillId] =
                      (bonuses.exclusiveSheerDmg[skillId] || 0) + totalValue;
                  }
                } else if (
                  bonus.exclusiveType === "elementSheerDmg" &&
                  bonus.element
                ) {
                  for (const skillId of bonus.appliesTo) {
                    if (!bonuses.exclusiveElementSheerDmg[skillId]) {
                      bonuses.exclusiveElementSheerDmg[skillId] = {};
                    }
                    bonuses.exclusiveElementSheerDmg[skillId][bonus.element] =
                      (bonuses.exclusiveElementSheerDmg[skillId][
                        bonus.element
                      ] || 0) + totalValue;
                  }
                } else {
                  for (const skillId of bonus.appliesTo) {
                    bonuses.exclusive[skillId] =
                      (bonuses.exclusive[skillId] || 0) + totalValue;
                    bonuses.breakdown.dmgMod.exclusive[skillId] =
                      (bonuses.breakdown.dmgMod.exclusive[skillId] || 0) +
                      totalValue;
                  }
                }
              }
              break;

            case "sheerDmg":
              bonuses.sheerDmgBonus += totalValue;
              bonuses.breakdown.sheerMod.general += totalValue;
              bonuses.sources.push({ ...baseSource, type: "sheerDmg" });
              break;

            case "elementSheerDmg":
              if (bonus.element) {
                bonuses.elementSheerDmgBonus[bonus.element] += totalValue;
                bonuses.breakdown.sheerMod.elements[bonus.element] +=
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "elementSheerDmg",
                  element: bonus.element,
                });
              }
              break;

            case "skillTypeElementalSheer":
              if (bonus.element && bonus.skillType) {
                if (!bonuses.skillTypeElementalSheer) {
                  bonuses.skillTypeElementalSheer = {};
                }
                if (!bonuses.skillTypeElementalSheer[bonus.skillType]) {
                  bonuses.skillTypeElementalSheer[bonus.skillType] = {};
                }
                bonuses.skillTypeElementalSheer[bonus.skillType][
                  bonus.element
                ] =
                  (bonuses.skillTypeElementalSheer[bonus.skillType]?.[
                    bonus.element
                  ] || 0) + totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "skillTypeElementalSheer",
                  element: bonus.element,
                  skillType: bonus.skillType,
                });
              }
              break;

            case "critDamageElementalBonus":
              if (bonus.element) {
                if (!bonuses.critDamageElementalBonus) {
                  bonuses.critDamageElementalBonus = {};
                }
                bonuses.critDamageElementalBonus[bonus.element] =
                  (bonuses.critDamageElementalBonus[bonus.element] || 0) +
                  totalValue;
                bonuses.sources.push({
                  ...baseSource,
                  type: "critDamageElementalBonus",
                  element: bonus.element,
                });
              }
              break;
          }
        }
      }
    }

    if (effect.exclusiveStatBonuses) {
      for (const statBonus of effect.exclusiveStatBonuses) {
        const totalValue = statBonus.value * stacks;
        for (const skillId of statBonus.appliesTo) {
          if (!bonuses.statBonuses[skillId]) {
            bonuses.statBonuses[skillId] = {};
          }
          if (!bonuses.breakdown.statBonuses[skillId]) {
            bonuses.breakdown.statBonuses[skillId] = {
              total: 0,
              sources: [],
            };
          }

          bonuses.statBonuses[skillId][statBonus.stat] =
            (bonuses.statBonuses[skillId][statBonus.stat] || 0) + totalValue;

          const statSource: BonusSource = {
            id: effect.id,
            name: effect.label,
            type: "stat",
            value: totalValue,
            stat: statBonus.stat,
            skillId,
            stacks,
            source: effect.source || "unknown",
            sourceId: effect.sourceId || effect.id,
            ownerAgentId: owner.ownerAgentId,
            ownerDisplayName: owner.ownerDisplayName,
          };

          bonuses.sources.push(statSource);
          bonuses.breakdown.statBonuses[skillId].sources.push(statSource);
          bonuses.breakdown.statBonuses[skillId].total += totalValue;
        }
      }
    }
  }

  bonuses.breakdown.dmgMod.total =
    bonuses.global +
    Object.values(bonuses.elements).reduce((a, b) => a + b, 0) +
    Object.values(bonuses.skillTypes).reduce((a, b) => a + b, 0);

  bonuses.breakdown.sheerMod.total =
    bonuses.sheerDmgBonus +
    Object.values(bonuses.elementSheerDmgBonus).reduce((a, b) => a + b, 0);

  return bonuses;
}

function processDamageBonus(
  effect: any,
  bonus: DamageBonus,
  value: number,
  stacks: number,
  bonuses: CollectedBonuses,
  owner: { ownerAgentId?: string; ownerDisplayName?: string },
) {
  const totalValue = value * stacks;
  const sourceType = effect.source || "unknown";
  const sourceId = effect.sourceId || effect.id;

  const baseSource: BonusSource = {
    id: effect.id,
    name: effect.label,
    type: bonus.type as any,
    value: totalValue,
    stacks,
    source: sourceType,
    sourceId,
    ownerAgentId: owner.ownerAgentId,
    ownerDisplayName: owner.ownerDisplayName,
  };

  switch (bonus.type) {
    case "global":
      bonuses.global += totalValue;
      bonuses.breakdown.dmgMod.global += totalValue;
      bonuses.sources.push({ ...baseSource, type: "global" });
      bonuses.breakdown.dmgMod.sources.push({ ...baseSource, type: "global" });
      break;

    case "element":
      if (bonus.element) {
        bonuses.elements[bonus.element] =
          (bonuses.elements[bonus.element] || 0) + totalValue;
        bonuses.sources.push({
          ...baseSource,
          type: "element",
          element: bonus.element,
        });
        bonuses.breakdown.dmgMod.elements[bonus.element] =
          (bonuses.breakdown.dmgMod.elements[bonus.element] || 0) + totalValue;
      }
      break;

    case "skillType":
      if (bonus.skillType) {
        bonuses.skillTypes[bonus.skillType] =
          (bonuses.skillTypes[bonus.skillType] || 0) + totalValue;
        bonuses.sources.push({
          ...baseSource,
          type: "skillType",
          skillType: bonus.skillType,
        });
        bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] =
          (bonuses.breakdown.dmgMod.skillTypes[bonus.skillType] || 0) +
          totalValue;
      }
      break;

    case "exclusive":
      if (bonus.appliesTo) {
        for (const skillId of bonus.appliesTo) {
          bonuses.exclusive[skillId] =
            (bonuses.exclusive[skillId] || 0) + totalValue;
          bonuses.sources.push({
            ...baseSource,
            type: "exclusive",
            skillId,
          });
          bonuses.breakdown.dmgMod.exclusive[skillId] =
            (bonuses.breakdown.dmgMod.exclusive[skillId] || 0) + totalValue;
          bonuses.breakdown.dmgMod.sources.push({
            ...baseSource,
            type: "exclusive",
            skillId,
          });
        }
      }
      break;

    default:
  }
}
