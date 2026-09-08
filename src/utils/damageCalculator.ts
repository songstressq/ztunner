import type { Agent } from "@/types/Agent";
import type { DamageSkill, SkillLevel } from "@/types/DamageSkill";
import type { UnifiedStats } from "@/types/Agent";
import type { IngameEffect } from "@/types/IngameEffect";

export interface DamageResult {
  normal: number[];
  critical: number[];
  average: number[];
  totalNormal: number;
  totalCritical: number;
  totalAverage: number;
}

export interface DamageBonusSources {
  global: number;
  element: number;
  skillType: number;
  exclusive: number;
}

export interface SkillCalculationOptions {
  skillLevel: number;
  isCrit: boolean;
  includeBonuses: boolean;
  targetDefense?: number;
  targetResistance?: number;
}

export class DamageCalculator {
  static getDamageBonuses(
    effects: IngameEffect[],
    skill: DamageSkill,
    unifiedStats: UnifiedStats,
  ): DamageBonusSources {
    const bonuses: DamageBonusSources = {
      global: 0,
      element: 0,
      skillType: 0,
      exclusive: 0,
    };

    for (const effect of effects) {
      if (effect.flat?.attributeDmgBonus) {
        if (typeof effect.flat.attributeDmgBonus === "object") {
          const elementBonus =
            effect.flat.attributeDmgBonus[
              skill.damageType as keyof typeof effect.flat.attributeDmgBonus
            ];
          if (elementBonus) bonuses.element += elementBonus;
        }
      }
      if (
        effect.exclusiveBonuses?.critDmg &&
        effect.exclusiveBonuses.appliesTo?.includes(skill.id)
      ) {
        bonuses.exclusive += effect.exclusiveBonuses.critDmg;
      }
      if (
        effect.exclusiveBonuses?.dmgBonus &&
        effect.exclusiveBonuses.appliesTo?.includes(skill.id)
      ) {
        bonuses.exclusive += effect.exclusiveBonuses.dmgBonus;
      }
    }

    bonuses.element += unifiedStats.attributeDmgBonus[skill.damageType] || 0;

    return bonuses;
  }

  static calculateBaseDamage(
    multiplier: number,
    stat: number,
    bonuses: DamageBonusSources,
  ): number {
    const totalBonus =
      1 +
      (bonuses.global +
        bonuses.element +
        bonuses.skillType +
        bonuses.exclusive);
    return multiplier * stat * totalBonus;
  }

  static calculateCriticalDamage(
    baseDamage: number,
    critDmg: number,
    exclusiveCritDmg: number = 0,
  ): number {
    const totalCritDmg = 1 + critDmg + exclusiveCritDmg;
    return baseDamage * totalCritDmg;
  }

  static calculateAverageDamage(
    baseDamage: number,
    critDamage: number,
    critRate: number,
  ): number {
    return baseDamage * (1 - critRate) + critDamage * critRate;
  }

  static calculateSkillDamage(
    skill: DamageSkill,
    skillLevel: number,
    unifiedStats: UnifiedStats,
    effects: IngameEffect[],
    options: SkillCalculationOptions = {
      skillLevel: 1,
      isCrit: false,
      includeBonuses: true,
    },
  ): DamageResult {
    const levelData =
      skill.levels.find((l) => l.level === skillLevel) || skill.levels[0];
    if (!levelData)
      throw new Error(
        `Nivel ${skillLevel} no encontrado para habilidad ${skill.id}`,
      );

    const baseStat = unifiedStats[skill.statBase] || unifiedStats.atk;
    const critRate = unifiedStats.critRate;
    const critDmg = unifiedStats.critDmg;

    const bonuses = options.includeBonuses
      ? this.getDamageBonuses(effects, skill, unifiedStats)
      : { global: 0, element: 0, skillType: 0, exclusive: 0 };

    const results: DamageResult = {
      normal: [],
      critical: [],
      average: [],
      totalNormal: 0,
      totalCritical: 0,
      totalAverage: 0,
    };

    for (let i = 0; i < levelData.multipliers.length; i++) {
      const multiplier = levelData.multipliers[i] / 100;

      const baseDamage = this.calculateBaseDamage(
        multiplier,
        baseStat,
        bonuses,
      );
      results.normal.push(baseDamage);

      const critDamage = this.calculateCriticalDamage(
        baseDamage,
        critDmg,
        bonuses.exclusive,
      );
      results.critical.push(critDamage);

      const avgDamage = this.calculateAverageDamage(
        baseDamage,
        critDamage,
        critRate,
      );
      results.average.push(avgDamage);
    }

    results.totalNormal = results.normal.reduce((sum, dmg) => sum + dmg, 0);
    results.totalCritical = results.critical.reduce((sum, dmg) => sum + dmg, 0);
    results.totalAverage = results.average.reduce((sum, dmg) => sum + dmg, 0);

    return results;
  }

  static calculateAllSkills(
    agent: Agent,
    unifiedStats: UnifiedStats,
    effects: IngameEffect[],
    skillLevel: number = 1,
  ): Record<string, DamageResult> {
    const results: Record<string, DamageResult> = {};

    for (const skill of agent.skills.basicAttacks) {
      results[skill.id] = this.calculateSkillDamage(
        skill,
        skillLevel,
        unifiedStats,
        effects,
      );
    }

    for (const skill of agent.skills.exSkills) {
      results[skill.id] = this.calculateSkillDamage(
        skill,
        skillLevel,
        unifiedStats,
        effects,
      );
    }

    if (agent.skills.ultimate) {
      results[agent.skills.ultimate.id] = this.calculateSkillDamage(
        agent.skills.ultimate,
        skillLevel,
        unifiedStats,
        effects,
      );
    }

    return results;
  }
}
