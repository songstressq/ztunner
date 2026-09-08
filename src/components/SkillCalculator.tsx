import { useState, useEffect, useMemo } from "react";
import type { Agent } from "@/types/Agent";
import type { UnifiedStats } from "@/types/Agent";
import type { IngameEffect } from "@/types/IngameEffect";
import { collectDamageBonuses } from "@/utils/damageBonusCollector";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";
import enemiesData from "@/data/enemies/enemies.json";
import EnemySelector from "@/components/EnemySelector";
import { calculateElementalResistance } from "@/utils/resistanceCalculator";
import { calculateTotalDefShred } from "@/utils/defShredCalculator";
import StunMultiplierInput from "@/components/StunMultiplierInput";
import AnomalyCalculator from "@/components/AnomalyCalculator";
import ActiveBonusesPanel from "@/components/ActiveBonusesPanel";
import HugoTotalizeCalculator from "@/components/HugoTotalizeCalculator";
import type { TotalizeState } from "@/components/HugoTotalizeCalculator";
import NeonSelect from "@/components/NeonSelect";
import DefensesBonusesPanel from "@/components/DefensesBonusesPanel";
import { collectDefenseBonuses } from "@/utils/defensesBonusCollector";
import LuminizeCalculator from "@/components/LuminizeCalculator";
import { collectAnomalyBonuses } from "@/utils/anomalyBonusCollector";
import AnomalyBonusesPanel from "@/components/AnomalyBonusesPanel";
import { ANOMALY_DEFINITIONS } from "@/types/Anomaly";
import { agents } from "@/data/agents";
import {
  useSession,
  defaultCalculatorState,
  type CalculatorUIState,
} from "@/context/SessionContext";
import {
  calculateSheerDamage,
  isSheerDamage,
} from "@/utils/sheerDamageCalculator";

interface SkillCalculatorProps {
  agent: Agent;
  unifiedStats: UnifiedStats;
  activeEffects: Record<
    string,
    { enabled: boolean; stacks: number; overclockLevel?: number }
  >;
  teamEffects?: Record<
    string,
    {
      enabled: boolean;
      stacks: number;
      sourceSlot: number;
      ownerAgentId: string;
      skillLevel?: number;
      overclockLevel?: number;
    }
  >;
  teamSlotsInfo?: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
    stats?: UnifiedStats;
    activeEffects?: Record<string, { enabled: boolean; stacks: number }>;
    agent?: Agent;
  }>;
  targetSlots?: Record<string, number>;
  currentSlotIndex: number;
  initialStats?: {
    hp?: number;
    atk?: number;
    def?: number;
    energyRegen?: number;
    anomalyProficiency?: number;
  };
  theme?: string;
  onAnomalyResultChange?: (result: any) => void;
  slotAnomalyResults?: Record<number, any>;
  calculatorState: CalculatorUIState;
  onCalculatorStateChange: (
    updater: (prev: CalculatorUIState) => CalculatorUIState,
  ) => void;
  skillProfiles?: Record<
    string,
    {
      basic: number;
      dodge: number;
      assist: number;
      special: number;
      chain: number;
    }
  >;
}

interface DamageResult {
  normal: number[];
  critical: number[];
  realNormal: number[];
  realCritical: number[];
  totalNormal: number;
  totalCritical: number;
  totalRealNormal: number;
  totalRealCritical: number;
}

interface AdditionalDamage {
  name: string;
  description: string;
  value: number;
  critValue: number;
  realValue: number;
  realCritValue: number;
  source: string;
  statUsed: string;
  element?: string;
}

const ALC_TABLE: Record<number, number> = {
  60: 794,
};

export default function SkillCalculator({
  agent,
  unifiedStats,
  activeEffects,
  teamEffects,
  teamSlotsInfo,
  targetSlots,
  currentSlotIndex,
  initialStats,
  theme,
  onAnomalyResultChange,
  slotAnomalyResults,
  calculatorState,
  onCalculatorStateChange,
  skillProfiles = {},
}: SkillCalculatorProps) {
  const {
    selectedEnemyId,
    stunMultiplier,
    selectedSkillId,
    skillLevel,
    pyroisTotalizeActive,
    hugoTotalizeActive,
    hugoStunTimeLessThan5,
    hugoStunTimeBetween5And15,
    hugoMindscape6Active,
    hugoTotalizeBonus,
    hugoFinalMultiplier,
    fluxedAttributes,
  } = calculatorState;

  const fluxedAttribute = fluxedAttributes?.[currentSlotIndex] ?? null;

  const setSelectedSkillId = (value: string) => {
    onCalculatorStateChange((prev) => ({ ...prev, selectedSkillId: value }));
  };

  const setSkillLevel = (value: number) => {
    onCalculatorStateChange((prev) => ({ ...prev, skillLevel: value }));
  };

  const setSelectedEnemyId = (value: string) => {
    onCalculatorStateChange((prev) => ({ ...prev, selectedEnemyId: value }));
  };

  const setStunMultiplier = (value: number) => {
    onCalculatorStateChange((prev) => ({ ...prev, stunMultiplier: value }));
  };

  const setPyroisTotalizeActive = (value: boolean) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      pyroisTotalizeActive: value,
    }));
  };

  const setTotalizeState = (state: TotalizeState) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      hugoTotalizeActive: state.isActive,
      hugoStunTimeLessThan5: state.stunTimeLessThan5,
      hugoStunTimeBetween5And15: state.stunTimeBetween5And15,
      hugoMindscape6Active: state.mindscape6Active,
      hugoTotalizeBonus: state.totalizeBonus,
      hugoFinalMultiplier: state.finalMultiplier,
    }));
  };

  const setFluxedAttribute = (slot: number, attr: string | null) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      fluxedAttributes: prev.fluxedAttributes.map((v, i) =>
        i === slot ? attr : v,
      ),
    }));
  };

  const getSkillCategory = (
    skill: any,
  ): keyof (typeof skillProfiles)[string] | null => {
    if (!skill) return null;
    const type = skill.skillType;
    if (type === "basic") return "basic";
    if (type === "dash" || type === "counter") return "dodge";
    if (
      type === "quickAssist" ||
      type === "perfectAssist" ||
      type === "followup"
    )
      return "assist";
    if (type === "special" || type === "ex") return "special";
    if (type === "chain" || type === "ultimate") return "chain";
    return null;
  };

  const [isManualOverride, setIsManualOverride] = useState(false);

  useEffect(() => {
    setIsManualOverride(false);
  }, [agent.id, selectedSkillId]);

  useEffect(() => {
    if (isManualOverride) return;

    const selectedSkill = allAvailableSkills.find(
      (s) => s.id === selectedSkillId,
    );
    if (!selectedSkill) return;
    const category = getSkillCategory(selectedSkill);
    if (!category) return;
    const profile = skillProfiles[agent.id];
    if (!profile) return;
    const profileLevel = profile[category];
    if (!profileLevel) return;
    const maxAvailable = Math.max(...selectedSkill.levels.map((l) => l.level));
    const clampedLevel = Math.min(profileLevel, maxAvailable);
    if (clampedLevel !== skillLevel) {
      setSkillLevel(clampedLevel);
    }
  }, [selectedSkillId, agent.id, skillProfiles, isManualOverride]);

  const totalizeState: TotalizeState = {
    isActive: hugoTotalizeActive,
    selectedSkillId: selectedSkillId,
    stunTimeLessThan5: hugoStunTimeLessThan5,
    stunTimeBetween5And15: hugoStunTimeBetween5And15,
    totalizeBonus: hugoTotalizeBonus,
    finalMultiplier: hugoFinalMultiplier,
    mindscape6Active: hugoMindscape6Active,
  };

  const [calculatorKey, setCalculatorKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEnemy, setSelectedEnemy] = useState<any | null>(null);
  const [showAdditional, setShowAdditional] = useState(true);
  const [showSunnaAdditional, setShowSunnaAdditional] = useState(true);
  const [customHitMultipliers, setCustomHitMultipliers] = useState<
    Record<string, Record<string, number>>
  >({});

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient( to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11 )`,
  };

  const ATTRIBUTE_COLORS: Record<string, string> = {
    physical: "#FFDD35FF",
    fire: "#FF4D25FF",
    ice: "#94F3F3FF",
    electric: "#36A9FCFF",
    ether: "#FF4684FF",
    wind: "#A6C5FD",
    lumiflux: "#FEDBF3",
  };

  const colorizeElementalText = (text: string): string => {
    const elementPatterns: Record<string, string> = {
      "Physical DMG": ATTRIBUTE_COLORS.physical,
      "Polarized Assault": ATTRIBUTE_COLORS.physical,
      "Physical Anomaly Buildup Rate": ATTRIBUTE_COLORS.physical,
      Assault: ATTRIBUTE_COLORS.physical,
      Flinch: ATTRIBUTE_COLORS.physical,
      "Physical Anomaly": ATTRIBUTE_COLORS.physical,
      "Fire DMG": ATTRIBUTE_COLORS.fire,
      "Fire Anomaly Buildup": ATTRIBUTE_COLORS.fire,
      "Fire Anomaly": ATTRIBUTE_COLORS.fire,
      Burn: ATTRIBUTE_COLORS.fire,
      "Fire RES": ATTRIBUTE_COLORS.fire,
      "Ice DMG": ATTRIBUTE_COLORS.ice,
      "Frost DMG": ATTRIBUTE_COLORS.ice,
      Frostbite: ATTRIBUTE_COLORS.ice,
      "Frostburn - Break": ATTRIBUTE_COLORS.ice,
      Frostburn: ATTRIBUTE_COLORS.ice,
      Shatter: ATTRIBUTE_COLORS.ice,
      "Ice Anomaly": ATTRIBUTE_COLORS.ice,
      "Electric DMG": ATTRIBUTE_COLORS.electric,
      "Electric Anomaly": ATTRIBUTE_COLORS.electric,
      "Ether DMG": ATTRIBUTE_COLORS.ether,
      "Ether Anomaly": ATTRIBUTE_COLORS.ether,
      "Auric Ink DMG": ATTRIBUTE_COLORS.ether,
      "Wind DMG": ATTRIBUTE_COLORS.wind,
      "Wind Anomaly": ATTRIBUTE_COLORS.wind,
      "Lumiflux DMG": ATTRIBUTE_COLORS.lumiflux,
      "Lumiflux Buildup": ATTRIBUTE_COLORS.lumiflux,
      Luminize: ATTRIBUTE_COLORS.lumiflux,
      Refringe: ATTRIBUTE_COLORS.lumiflux,
    };

    const EXCEPTIONS: Record<string, string[]> = {
      Assault: [" Mode"],
      Frostbite: [" Points", " Embrace"],
    };

    let result = text;
    for (const [keyword, color] of Object.entries(elementPatterns)) {
      let regex;
      const exceptions = EXCEPTIONS[keyword];
      if (exceptions && exceptions.length > 0) {
        const combinedExceptions = exceptions
          .map((ex) => ex.replace(/\s/g, "\\s+"))
          .join("|");
        regex = new RegExp(
          `(?<![a-zA-Z])${keyword}(?![a-zA-Z])(?!\\s*(${combinedExceptions}))`,
          "g",
        );
      } else {
        regex = new RegExp(`(?<![a-zA-Z])${keyword}(?![a-zA-Z])`, "g");
      }
      result = result.replace(regex, (match) => {
        return `<span style="color: ${color}; font-weight: lighter;">${match}</span>`;
      });
    }
    return result;
  };

  const getSkillDataFromMarker = (
    marker: string,
    agentSpecialty: string,
  ): { icon: string; name: string } | null => {
    const data: Record<string, { icon: string; name: string }> = {
      "[EX]": {
        icon:
          agentSpecialty === "Rupture"
            ? "/ztunner/resources/images/icons/skilltypes/ex_rupture.png"
            : "/ztunner/resources/images/icons/skilltypes/ex.png",
        name: "EX Special Attack",
      },
      "[ULTIMATE]": {
        icon: "/ztunner/resources/images/icons/skilltypes/ultimate.png",
        name: "Ultimate",
      },
      "[CHAIN]": {
        icon: null,
        name: "Chain Attack",
      },
      "[BASIC]": {
        icon: "/ztunner/resources/images/icons/skilltypes/basic.png",
        name: "Basic Attack",
      },
      "[SPECIAL]": {
        icon: "/ztunner/resources/images/icons/skilltypes/special.png",
        name: "Special Attack",
      },
      "[DODGE]": {
        icon: "/ztunner/resources/images/icons/skilltypes/dodge.png",
        name: "Dodge",
      },
      "[COUNTER]": {
        icon: null,
        name: "Perfect Dodge",
      },
      "[QUICK]": {
        icon: "/ztunner/resources/images/icons/skilltypes/quick.png",
        name: "Quick Assist",
      },
      "[PERFECT]": {
        icon: null,
        name: "Defensive Assist",
      },
      "[ASSIST]": {
        icon: "/ztunner/resources/images/icons/skilltypes/assist.png",
        name: "Assist",
      },
    };

    return data[marker] || null;
  };

  const replaceSkillMarkers = (
    text: string,
    agentSpecialty: string,
  ): string => {
    const markers = [
      "[EX]",
      "[ULTIMATE]",
      "[CHAIN]",
      "[BASIC]",
      "[SPECIAL]",
      "[DODGE]",
      "[COUNTER]",
      "[QUICK]",
      "[PERFECT]",
      "[ASSIST]",
    ];

    let result = text;

    for (const marker of markers) {
      const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      result = result.replace(regex, (match) => {
        const data = getSkillDataFromMarker(marker, agentSpecialty);
        if (data) {
          if (!data.icon) {
            return `<span class="skill-type-name">${data.name}</span>`;
          }
          return `<img src="${data.icon}" class="skill-type-icon" alt="${data.name}" /> <span class="skill-type-name">${data.name}</span>`;
        }
        return match;
      });
    }

    return result;
  };

  const wrapAbilityName = (text: string): string => {
    return text.replace(/\/b(.*?)\/\/b/gi, (match, content) => {
      return `<span class="ability-name">${content}</span>`;
    });
  };

  const [generalSettingsOpen, setGeneralSettingsOpen] = useState(true);

  const getAllEffectsWithOverclock = () => {
    const allEffects: Record<
      string,
      {
        enabled: boolean;
        stacks: number;
        overclockLevel?: number;
        skillLevel?: number;
        ownerAgentId?: string;
      }
    > = { ...activeEffects };
    if (teamEffects) {
      Object.entries(teamEffects).forEach(([effectId, state]) => {
        if (state.enabled) {
          allEffects[effectId] = {
            enabled: true,
            stacks: state.stacks || 1,
            overclockLevel: state.overclockLevel || 1,
            skillLevel: state.skillLevel || 1,
            ownerAgentId: state.ownerAgentId,
          };
        }
      });
    }
    return allEffects;
  };

  const collectStunEffects = (): Array<{ name: string; value: number }> => {
    const effects: Array<{ name: string; value: number }> = [];
    const allEffects = getAllEffectsWithOverclock();
    Object.entries(allEffects).forEach(([effectId, state]) => {
      if (!state.enabled) return;
      const effect = ingameEffectsRegistry[effectId];
      if (!effect) return;
      if ((effect as any).stunMultiplier) {
        effects.push({
          name: effect.label,
          value: (effect as any).stunMultiplier * 100,
        });
      }
      if ((effect as any).stunMultiplierFlat) {
        effects.push({
          name: effect.label,
          value: (effect as any).stunMultiplierFlat * 100,
        });
      }
    });
    return effects;
  };

  const getSkillLevels = (): Record<string, number> => {
    const allEffects = getAllEffectsWithOverclock();
    const levels: Record<string, number> = {};
    Object.entries(allEffects).forEach(([effectId, state]) => {
      if (state.enabled && state.skillLevel) {
        levels[effectId] = state.skillLevel;
      }
    });
    return levels;
  };

  const allAvailableSkills = [
    ...(agent.skills?.basicAttacks || []),
    ...(agent.skills?.dashAttacks || []),
    ...(agent.skills?.dodgeCounters || []),
    ...(agent.skills?.exSkills || []),
    ...(agent.skills?.ultimate || []),
    ...(agent.skills?.chainAttacks || []),
    ...(agent.skills?.quickAssists || []),
    ...(agent.skills?.perfectAssists || []),
    ...(agent.skills?.assistFollowup || []),
    ...(agent.skills?.specialAttacks || []),
    ...(agent.skills?.mindscapeAbilities || []),
  ];

  if (allAvailableSkills.length === 0) {
    return null;
  }

  const reloadSkills = () => {
    setIsLoading(true);
    setCalculatorKey((prev) => prev + 1);
    if (allAvailableSkills.length > 0) {
      setSelectedSkillId(allAvailableSkills[0].id);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  useEffect(() => {
    if (
      agent.id === "hugo" &&
      selectedSkillId !== "hugo-ex_special_attack-soul_hunter_punishment" &&
      selectedSkillId !== "hugo-ultimate-blaspheme" &&
      totalizeState.isActive
    ) {
      setTotalizeState({ ...totalizeState, isActive: false });
    }
  }, [selectedSkillId, agent.id]);

  useEffect(() => {
    if (allAvailableSkills.length === 0) {
      return;
    }
    if (
      !selectedSkillId ||
      !allAvailableSkills.some((s) => s.id === selectedSkillId)
    ) {
      setSelectedSkillId(allAvailableSkills[0].id);
    }
  }, [selectedSkillId, allAvailableSkills, agent.id, calculatorKey]);

  useEffect(() => {
    const enemy = enemiesData.enemies.find((e) => e.id === selectedEnemyId);
    setSelectedEnemy(enemy || enemiesData.enemies[0]);
  }, [selectedEnemyId]);

  const selectedSkill = allAvailableSkills.find(
    (skill) => skill.id === selectedSkillId,
  );

  useEffect(() => {
    if (selectedSkill) {
      const maxAvailableLevel = Math.max(
        ...selectedSkill.levels.map((l) => l.level),
      );
      if (skillLevel > maxAvailableLevel) {
        setSkillLevel(maxAvailableLevel);
      }
    }
  }, [selectedSkill]);

  const availableLevels =
    selectedSkill?.levels?.map((level) => level.level) || [];
  if (availableLevels.length === 0) {
    availableLevels.push(1);
  }
  const maxAvailableLevel = Math.max(...availableLevels, 1);
  const dynamicLevels = Array.from(
    { length: maxAvailableLevel },
    (_, i) => i + 1,
  );

  const agentLevel = agent.level || 60;
  const attackerLevelCoeff = ALC_TABLE[agentLevel] || 794;

  const allEffects: IngameEffect[] = [];
  const seenIds = new Set<string>();
  const allActiveEffects = getAllEffectsWithOverclock();
  const slotStatsMap: Record<number, UnifiedStats> = {};
  teamSlotsInfo?.forEach((slot) => {
    if (slot && slot.stats) {
      slotStatsMap[slot.slotIndex] = slot.stats;
    }
  });

  Object.keys(allActiveEffects).forEach((effectId) => {
    if (seenIds.has(effectId)) return;
    const effect = ingameEffectsRegistry[effectId];
    if (effect && allActiveEffects[effectId]?.enabled) {
      const teamEffect = teamEffects?.[effectId];
      if (teamEffect) {
        allEffects.push({
          ...effect,
          ownerAgentId: teamEffect.ownerAgentId,
        });
      } else {
        allEffects.push(effect);
      }
      seenIds.add(effectId);
    }
  });

  const getOverclockLevels = (): Record<string, number> => {
    const allEffects = getAllEffectsWithOverclock();
    const levels: Record<string, number> = {};
    Object.entries(allEffects).forEach(([effectId, state]) => {
      if (state.enabled && state.overclockLevel) {
        levels[effectId] = state.overclockLevel;
      } else if (state.enabled) {
        levels[effectId] = 1;
      }
    });
    return levels;
  };

  const skillLevelsMap = getSkillLevels();
  const overclockLevelsMap = getOverclockLevels();

  const bonuses = collectDamageBonuses(
    allEffects,
    allActiveEffects,
    skillLevelsMap,
    overclockLevelsMap,
    unifiedStats,
    initialStats,
    teamEffects,
    agent.id,
  );

  const effectDefShred = calculateTotalDefShred(allActiveEffects, false);
  const wEngineDefShredOld = (unifiedStats as any)._defShred || 0;
  const wEngineDefShredNew = (unifiedStats as any)._defShredBonus || 0;
  const skillTypeDefShred =
    bonuses._defShredBySkillType?.[selectedSkill.skillType] || 0;
  const wEngineDefShred = wEngineDefShredNew || wEngineDefShredOld;
  const totalDefShred = Math.min(
    effectDefShred + wEngineDefShred + skillTypeDefShred,
    1,
  );

  const calculateAftershockDefShred = (): number => {
    let total = 0;
    Object.entries(allActiveEffects).forEach(([effectId, state]) => {
      if (!state.enabled) return;
      const effect = ingameEffectsRegistry[effectId];
      if (!effect) return;
      if (effect.aftershockDefShred) {
        if (
          effect.condition?.requiresSpecialty &&
          effect.condition.requiresSpecialty !== agent.specialty
        ) {
          return;
        }
        total += effect.aftershockDefShred * (state.stacks || 1);
      }
    });
    return total;
  };

  const aftershockDefShredTotal = calculateAftershockDefShred();

  const getWEngineResShred = (
    damageType: string,
    skillType?: string,
  ): number => {
    if (!unifiedStats._resShred) return 0;
    return unifiedStats._resShred
      .filter((entry) => {
        if (entry.element !== damageType.toLowerCase()) return false;
        const c = entry.condition;
        if (!c) return true;
        if (c.damageType && c.damageType !== damageType.toLowerCase())
          return false;
        if (c.skillTypes && skillType && !c.skillTypes.includes(skillType))
          return false;
        if (c.requiresSpecialty && agent.specialty !== c.requiresSpecialty)
          return false;
        return true;
      })
      .reduce((sum, e) => sum + e.value, 0);
  };

  const getTotalResShred = (
    damageType: string,
    skillId?: string,
    skillType?: string,
    isAnomaly: boolean = false,
    isVortex: boolean = false,
    isLuminize: boolean = false,
  ): number => {
    if (!selectedEnemy) return 0;
    const effectResShred = calculateElementalResistance(
      selectedEnemy,
      damageType,
      allActiveEffects,
      skillId,
      skillType,
      isAnomaly,
      isVortex,
      isLuminize,
    ).resShred;
    const wEngineResShred = getWEngineResShred(damageType, skillType);
    return effectResShred + wEngineResShred;
  };

  const getCombinedResShred = (
    damageType: string,
    skillId?: string,
    skillType?: string,
  ): number => {
    if (!selectedEnemy) return 0;
    const resCalc = calculateElementalResistance(
      selectedEnemy,
      damageType,
      allActiveEffects,
      skillId,
      skillType,
    );
    let wEngineResShred = 0;
    switch (damageType.toLowerCase()) {
      case "fire":
        wEngineResShred = (unifiedStats as any)._fireResShredBonus || 0;
        break;
      case "ice":
        wEngineResShred = (unifiedStats as any)._iceResShredBonus || 0;
        break;
      case "electric":
        wEngineResShred = (unifiedStats as any)._electricResShredBonus || 0;
        break;
      case "physical":
        wEngineResShred = (unifiedStats as any)._physicalResShredBonus || 0;
        break;
      case "ether":
        wEngineResShred = (unifiedStats as any)._etherResShredBonus || 0;
        break;
    }
    return resCalc.resShred + wEngineResShred;
  };

  const defenseBonuses = useMemo(() => {
    return collectDefenseBonuses(
      allEffects,
      allActiveEffects,
      skillLevelsMap,
      overclockLevelsMap,
      unifiedStats,
      initialStats,
      teamEffects,
      agent.id,
    );
  }, [
    allEffects,
    allActiveEffects,
    skillLevelsMap,
    overclockLevelsMap,
    unifiedStats,
    initialStats,
    teamEffects,
    agent.id,
  ]);

  const anomalyBonuses = useMemo(() => {
    return collectAnomalyBonuses(
      allEffects,
      allActiveEffects,
      unifiedStats,
      unifiedStats,
      {},
      {},
      agent.id,
      undefined,
    );
  }, [allEffects, allActiveEffects, unifiedStats, agent.id]);

  const calculateRealDamage = (
    baseDamage: number,
    damageType: string,
    damageSubtype: string | undefined,
    skillId: string,
    skillType: string,
    hitIndex: number,
    hitName: string,
    additionalDefShred: number = 0,
    additionalPenRatio: number = 0,
    isAnomaly: boolean = false,
    isVortex: boolean = false,
    overridePenRatio?: number,
    overridePenFlat?: number,
    isLuminize: boolean = false,
    isAnomalyDefShredOnly: boolean = false,
  ): number => {
    if (!selectedEnemy) return Math.round(baseDamage);
    const enemyDef = selectedEnemy.stats.def;

    let effectDefShredEffective = effectDefShred;
    if (isAnomalyDefShredOnly) {
      effectDefShredEffective = calculateTotalDefShred(allActiveEffects, true);
    }

    const totalDefShredWithBonus = Math.min(
      effectDefShredEffective +
        wEngineDefShred +
        skillTypeDefShred +
        additionalDefShred,
      1,
    );
    let defenseAfterShred = enemyDef * (1 - totalDefShredWithBonus);
    if (damageSubtype === "aftershock" && aftershockDefShredTotal > 0) {
      defenseAfterShred = defenseAfterShred * (1 - aftershockDefShredTotal);
    }

    const penRatio =
      overridePenRatio !== undefined
        ? overridePenRatio
        : (unifiedStats.penRatio || 0) + additionalPenRatio;
    const penFlat =
      overridePenFlat !== undefined ? overridePenFlat : unifiedStats.pen || 0;
    const defenseAfterPen = Math.max(
      0,
      defenseAfterShred * (1 - penRatio) - penFlat,
    );
    const attackerLevelCoeff = ALC_TABLE[agent.level || 60] || 794;
    const defMultiplier =
      attackerLevelCoeff / (attackerLevelCoeff + defenseAfterPen);
    let damage = baseDamage * defMultiplier;

    let baseResistance = 0;
    switch (damageType.toLowerCase()) {
      case "fire":
        baseResistance = selectedEnemy.stats.fireResistance;
        break;
      case "ice":
        baseResistance = selectedEnemy.stats.iceResistance;
        break;
      case "electric":
        baseResistance = selectedEnemy.stats.electricResistance;
        break;
      case "physical":
        baseResistance = selectedEnemy.stats.physicalResistance;
        break;
      case "ether":
        baseResistance = selectedEnemy.stats.etherResistance;
        break;
      case "wind":
        baseResistance = selectedEnemy.stats.windResistance ?? 0;
        break;
    }
    const totalResShred = getTotalResShred(
      damageType,
      skillId,
      skillType,
      isAnomaly,
      isVortex,
      isLuminize,
    );
    const finalResistance = baseResistance - totalResShred;
    const resMultiplier = 1 - finalResistance;
    damage *= resMultiplier;
    return Math.round(damage);
  };

  const calculateDamage = (): DamageResult | null => {
    if (!selectedSkill || !selectedSkill.levels || !selectedSkill.hits) {
      return null;
    }

    const isRuptureSkill =
      agent.specialty === "Rupture" ||
      selectedSkill.skillType === "rupture" ||
      selectedSkill.statBase === "sheerForce";
    if (isRuptureSkill) {
      return calculateRuptureDamage();
    }

    const baseLevelData = selectedSkill.levels.find(
      (level) => level.level === skillLevel,
    );
    if (!baseLevelData) return null;
    let multipliers = [...baseLevelData.multipliers];
    const levelData = { ...baseLevelData, multipliers };

    let referenceDamage = 0;
    let referenceSourceName = "";
    let referenceStatUsed = "";
    let referenceMultiplier = 0;

    const referenceEffect = allEffects.find((e) => e.referenceStatEffect);
    if (referenceEffect && activeEffects[referenceEffect.id]?.enabled) {
      const targetSlot = targetSlots?.[referenceEffect.id];
      if (targetSlot !== undefined && targetSlot !== null) {
        const targetSlotInfo = teamSlotsInfo?.find(
          (s) => s.slotIndex === targetSlot,
        );
        const targetStats = targetSlotInfo?.stats;
        if (targetStats) {
          const refEffect = referenceEffect.referenceStatEffect!;
          let multiplier = refEffect.multiplier;
          if (
            refEffect.specialtyMultipliers &&
            refEffect.specialtyMultipliers[targetSlotInfo.specialty]
          ) {
            multiplier =
              refEffect.specialtyMultipliers[targetSlotInfo.specialty];
          }
          if (targetSlotInfo.specialty === "Attack") {
            referenceDamage = targetStats.atk * multiplier;
            referenceSourceName = targetSlotInfo.agentName;
            referenceStatUsed = `ATK (${Math.round(
              targetStats.atk,
            ).toLocaleString()})`;
            referenceMultiplier = multiplier;
          } else if (targetSlotInfo.specialty === "Rupture") {
            referenceDamage = (targetStats.sheerForce || 0) * multiplier;
            referenceSourceName = targetSlotInfo.agentName;
            referenceStatUsed = `Sheer Force (${Math.round(
              targetStats.sheerForce || 0,
            ).toLocaleString()})`;
            referenceMultiplier = multiplier;
          }
        }
      }
    }

    const isAffectedByReference =
      referenceEffect?.referenceStatEffect?.appliesTo.skillIds.includes(
        selectedSkill.id,
      ) || false;

    let baseStat =
      unifiedStats[selectedSkill.statBase as keyof UnifiedStats] ||
      unifiedStats.atk;
    let critRate = unifiedStats.critRate || 0;
    let critDmg = unifiedStats.critDmg || 0;
    let penRatio = unifiedStats.penRatio || 0;

    const exclusiveStatBonuses = bonuses.statBonuses[selectedSkill.id] || {};
    if (exclusiveStatBonuses.critDmg) critDmg += exclusiveStatBonuses.critDmg;
    if (exclusiveStatBonuses.critRate)
      critRate += exclusiveStatBonuses.critRate;
    if (exclusiveStatBonuses.atkPercent)
      baseStat *= 1 + exclusiveStatBonuses.atkPercent;
    if (exclusiveStatBonuses.penRatio) {
      penRatio += exclusiveStatBonuses.penRatio;
    }

    if (bonuses.skillTypeStats?.[selectedSkill.skillType]) {
      const skillTypeStats = bonuses.skillTypeStats[selectedSkill.skillType];
      if (skillTypeStats.critDmg) critDmg += skillTypeStats.critDmg;
      if (skillTypeStats.critRate) critRate += skillTypeStats.critRate;
      if (skillTypeStats.atkPercent) baseStat *= 1 + skillTypeStats.atkPercent;
    }

    const results: DamageResult = {
      normal: [],
      critical: [],
      realNormal: [],
      realCritical: [],
      totalNormal: 0,
      totalCritical: 0,
      totalRealNormal: 0,
      totalRealCritical: 0,
    };

    for (let i = 0; i < levelData.multipliers.length; i++) {
      const multiplier = levelData.multipliers[i] / 100;
      let baseDamage = multiplier * baseStat;
      let referenceBonusForThisHit = 0;
      if (isAffectedByReference && referenceDamage > 0) {
        referenceBonusForThisHit = referenceDamage;
      }

      let currentCritDmg = critDmg;
      let additionalDefShred = 0;
      const hit = selectedSkill.hits[i];
      const hitDamageType = hit?.damageType;
      const damageSubtype = (hit as any).damageSubtype;
      const hitName = hit?.name;

      const hitStatBonus =
        bonuses.hitStatExclusive[selectedSkill.id]?.[hitName];
      if (hitStatBonus?.critDmg) {
        currentCritDmg += hitStatBonus.critDmg;
      }
      if (damageSubtype === "aftershock" || hitDamageType === "aftershock") {
        if (bonuses.elementStatBonuses?.aftershock?.critDmg) {
          currentCritDmg += bonuses.elementStatBonuses.aftershock.critDmg;
        }
      }
      const originalDamageType = hitDamageType || agent.attribute.toLowerCase();
      let effectiveDamageType = originalDamageType;
      if (
        agent.id === "remielle" &&
        fluxedAttribute &&
        (hit as any).damageSubtype !== "aftershock"
      ) {
        effectiveDamageType = fluxedAttribute;
      }

      let totalBonus = 1;
      totalBonus += bonuses.global;
      totalBonus += bonuses.skillTypes[selectedSkill.skillType] || 0;
      totalBonus += bonuses.exclusive[selectedSkill.id] || 0;

      if (hitDamageType) {
        totalBonus += bonuses.elements[effectiveDamageType] || 0;
        totalBonus +=
          unifiedStats.attributeDmgBonus[
            effectiveDamageType as keyof typeof unifiedStats.attributeDmgBonus
          ] || 0;
        if ((hit as any).damageSubtype === "aftershock") {
          totalBonus += bonuses.elements.aftershock || 0;
        }
      } else {
        totalBonus += bonuses.elements[effectiveDamageType] || 0;
        totalBonus +=
          unifiedStats.attributeDmgBonus[
            effectiveDamageType as keyof typeof unifiedStats.attributeDmgBonus
          ] || 0;
      }

      if (
        bonuses.skillTypeElemental?.[selectedSkill.skillType]?.[
          effectiveDamageType
        ]
      ) {
        totalBonus +=
          bonuses.skillTypeElemental[selectedSkill.skillType][
            effectiveDamageType
          ];
      }

      if (hitName && bonuses.hitExclusive[selectedSkill.id]?.[hitName]) {
        totalBonus += bonuses.hitExclusive[selectedSkill.id][hitName];
      }

      if (bonuses.elementExclusive?.[selectedSkill.id]?.[effectiveDamageType]) {
        const exclusiveElementBonus =
          bonuses.elementExclusive[selectedSkill.id][effectiveDamageType];
        totalBonus += exclusiveElementBonus;
      }

      baseDamage *= totalBonus;
      baseDamage += referenceBonusForThisHit;
      baseDamage = Math.round(baseDamage);

      const critDamage = Math.round(baseDamage * (1 + currentCritDmg));
      let finalCritDamage = critDamage;
      if (
        effectiveDamageType &&
        bonuses.critDamageElementalBonus?.[effectiveDamageType]
      ) {
        const critBonus = bonuses.critDamageElementalBonus[effectiveDamageType];
        finalCritDamage = Math.round(critDamage * (1 + critBonus));
      }

      const damageSubtypeForReal = (hit as any).damageSubtype;
      const hitNameForRealDamage = hit?.name || `Hit ${i + 1}`;

      const realNormalDamage = calculateRealDamage(
        baseDamage,
        effectiveDamageType,
        damageSubtypeForReal,
        selectedSkill.id,
        selectedSkill.skillType,
        i,
        hitNameForRealDamage,
        additionalDefShred,
        penRatio,
      );

      const realCritDamage = calculateRealDamage(
        finalCritDamage,
        effectiveDamageType,
        damageSubtypeForReal,
        selectedSkill.id,
        selectedSkill.skillType,
        i,
        hitNameForRealDamage,
        additionalDefShred,
        penRatio,
      );

      results.normal.push(baseDamage);
      results.critical.push(finalCritDamage);
      results.realNormal.push(realNormalDamage);
      results.realCritical.push(realCritDamage);
    }

    if (
      agent.id === "hugo" &&
      totalizeState.isActive &&
      totalizeState.selectedSkillId === selectedSkill.id
    ) {
      const totalizeMultiplier = totalizeState.finalMultiplier;
      const multiplierDecimal = totalizeMultiplier / 100;
      let totalizeDamage = multiplierDecimal * baseStat;
      let totalizeBonus = 1;
      totalizeBonus += bonuses.global;
      totalizeBonus += bonuses.skillTypes[selectedSkill.skillType] || 0;
      totalizeBonus += bonuses.exclusive[selectedSkill.id] || 0;
      totalizeBonus += bonuses.elements.ice || 0;
      totalizeBonus += unifiedStats.attributeDmgBonus.ice || 0;

      const hitName = "Totalize Finishing Move";
      const hitDamageBonus = bonuses.hitExclusive[selectedSkill.id]?.[hitName];
      if (hitDamageBonus) {
        totalizeBonus += hitDamageBonus;
      }
      totalizeDamage *= totalizeBonus;
      totalizeDamage = Math.round(totalizeDamage);

      let currentCritDmg = critDmg;
      let additionalDefShred = 0;
      const hitStatBonus =
        bonuses.hitStatExclusive[selectedSkill.id]?.[hitName];
      if (hitStatBonus) {
        if (hitStatBonus.critDmg) {
          currentCritDmg += hitStatBonus.critDmg;
        }
        if (hitStatBonus.defShred) {
          additionalDefShred = hitStatBonus.defShred;
        }
      }

      const totalizeCritDamage = Math.round(
        totalizeDamage * (1 + currentCritDmg),
      );
      let finalTotalizeCritDamage = totalizeCritDamage;
      if (bonuses.critDamageElementalBonus?.ice) {
        finalTotalizeCritDamage = Math.round(
          totalizeCritDamage * (1 + bonuses.critDamageElementalBonus.ice),
        );
      }

      const totalizeRealDamage = calculateRealDamage(
        totalizeDamage,
        "ice",
        undefined,
        selectedSkill.id,
        selectedSkill.skillType,
        results.normal.length,
        "Totalize Finishing Move",
        additionalDefShred,
      );

      const totalizeRealCritDamage = calculateRealDamage(
        finalTotalizeCritDamage,
        "ice",
        undefined,
        selectedSkill.id,
        selectedSkill.skillType,
        results.normal.length,
        "Totalize Finishing Move (Crit)",
        additionalDefShred,
      );

      results.normal.push(totalizeDamage);
      results.critical.push(finalTotalizeCritDamage);
      results.realNormal.push(totalizeRealDamage);
      results.realCritical.push(totalizeRealCritDamage);
    }

    if (
      agent.id === "pyrois" &&
      pyroisTotalizeActive &&
      selectedSkill.id === "pyrois-ultimate-eternal_imprisonment"
    ) {
      const totalizeMultiplier = 22.5;
      const baseStat = unifiedStats.atk;
      const baseDamage = totalizeMultiplier * baseStat;

      let totalBonus = 1;
      totalBonus += bonuses.global;
      totalBonus += bonuses.elements.ether || 0;
      totalBonus += bonuses.skillTypes[selectedSkill.skillType] || 0;
      totalBonus += bonuses.exclusive[selectedSkill.id] || 0;

      const hitName = "Totalize Finishing Move";
      const hitDamageBonus = bonuses.hitExclusive[selectedSkill.id]?.[hitName];
      if (hitDamageBonus) totalBonus += hitDamageBonus;

      let totalizeDamage = baseDamage * totalBonus;
      totalizeDamage = Math.round(totalizeDamage);

      let critDmg = unifiedStats.critDmg;
      const hitStatBonus =
        bonuses.hitStatExclusive[selectedSkill.id]?.[hitName];
      if (hitStatBonus?.critDmg) critDmg += hitStatBonus.critDmg;

      const totalizeCritDamage = Math.round(totalizeDamage * (1 + critDmg));
      let finalTotalizeCritDamage = totalizeCritDamage;
      if (bonuses.critDamageElementalBonus?.ether) {
        finalTotalizeCritDamage = Math.round(
          totalizeCritDamage * (1 + bonuses.critDamageElementalBonus.ether),
        );
      }

      const totalizeRealDamage = calculateRealDamage(
        totalizeDamage,
        "ether",
        undefined,
        selectedSkill.id,
        selectedSkill.skillType,
        results.normal.length,
        "Totalize Finishing Move",
        0,
        0,
      );

      const totalizeRealCritDamage = calculateRealDamage(
        finalTotalizeCritDamage,
        "ether",
        undefined,
        selectedSkill.id,
        selectedSkill.skillType,
        results.normal.length,
        "Totalize Finishing Move (Crit)",
        0,
        0,
      );

      results.normal.push(totalizeDamage);
      results.critical.push(finalTotalizeCritDamage);
      results.realNormal.push(totalizeRealDamage);
      results.realCritical.push(totalizeRealCritDamage);
    }

    results.totalNormal = results.normal.reduce((sum, dmg) => sum + dmg, 0);
    results.totalCritical = results.critical.reduce((sum, dmg) => sum + dmg, 0);
    results.totalRealNormal = results.realNormal.reduce(
      (sum, dmg) => sum + dmg,
      0,
    );
    results.totalRealCritical = results.realCritical.reduce(
      (sum, dmg) => sum + dmg,
      0,
    );

    if (stunMultiplier > 0) {
      const stunMod = 1 + stunMultiplier / 100;
      results.normal = results.normal.map((d) => Math.round(d * stunMod));
      results.critical = results.critical.map((d) => Math.round(d * stunMod));
      results.realNormal = results.realNormal.map((d) =>
        Math.round(d * stunMod),
      );
      results.realCritical = results.realCritical.map((d) =>
        Math.round(d * stunMod),
      );
      results.totalNormal = Math.round(results.totalNormal * stunMod);
      results.totalCritical = Math.round(results.totalCritical * stunMod);
      results.totalRealNormal = Math.round(results.totalRealNormal * stunMod);
      results.totalRealCritical = Math.round(
        results.totalRealCritical * stunMod,
      );
    }

    return results;
  };

  const calculateRuptureDamage = (): DamageResult | null => {
    if (!selectedSkill || !selectedSkill.levels || !selectedSkill.hits) {
      return null;
    }
    const levelData = selectedSkill.levels.find((l) => l.level === skillLevel);
    if (!levelData) return null;

    const results: DamageResult = {
      normal: [],
      critical: [],
      realNormal: [],
      realCritical: [],
      totalNormal: 0,
      totalCritical: 0,
      totalRealNormal: 0,
      totalRealCritical: 0,
    };

    let exclusiveCritDmg = 0;
    const exclusiveStatBonuses = bonuses.statBonuses[selectedSkill.id] || {};
    if (exclusiveStatBonuses.critDmg)
      exclusiveCritDmg += exclusiveStatBonuses.critDmg;

    const skillTypeStats =
      bonuses.skillTypeStats?.[selectedSkill.skillType] || {};
    if (skillTypeStats.critDmg) exclusiveCritDmg += skillTypeStats.critDmg;

    const totalCritDmg = unifiedStats.critDmg + exclusiveCritDmg;

    for (let i = 0; i < levelData.multipliers.length; i++) {
      const multiplier = levelData.multipliers[i];
      const hit = selectedSkill.hits[i];
      const damageType = hit?.damageType || agent.attribute.toLowerCase();

      let dmgModTotal = 1;
      dmgModTotal += bonuses.global;
      dmgModTotal += bonuses.elements[damageType] || 0;
      dmgModTotal += bonuses.skillTypes[selectedSkill.skillType] || 0;
      dmgModTotal += bonuses.exclusive[selectedSkill.id] || 0;
      dmgModTotal +=
        unifiedStats.attributeDmgBonus[
          damageType as keyof typeof unifiedStats.attributeDmgBonus
        ] || 0;

      let sheerModTotal = 1;
      sheerModTotal += bonuses.sheerDmgBonus;
      sheerModTotal += bonuses.elementSheerDmgBonus[damageType] || 0;
      sheerModTotal +=
        bonuses.skillTypeElementalSheer?.[selectedSkill.skillType]?.[
          damageType
        ] || 0;
      sheerModTotal += bonuses.exclusiveSheerDmg?.[selectedSkill.id] || 0;
      sheerModTotal +=
        bonuses.exclusiveElementSheerDmg?.[selectedSkill.id]?.[damageType] || 0;

      const baseSheerDamage =
        (multiplier / 100) * (unifiedStats.sheerForce || 0);
      const damageAfterDmgMod = baseSheerDamage * dmgModTotal;
      const damageAfterSheerMod = damageAfterDmgMod * sheerModTotal;
      let finalDamage = damageAfterSheerMod;
      if (bonuses.sheerDmgFlat) finalDamage += bonuses.sheerDmgFlat;

      const critDamage = finalDamage * (1 + totalCritDmg);
      let finalCritDamage = critDamage;
      if (damageType && bonuses.critDamageElementalBonus?.[damageType]) {
        const critBonus = bonuses.critDamageElementalBonus[damageType];
        finalCritDamage = critDamage * (1 + critBonus);
      }

      let baseResistance = 0;
      switch (damageType) {
        case "fire":
          baseResistance = selectedEnemy?.stats.fireResistance || 0;
          break;
        case "ice":
          baseResistance = selectedEnemy?.stats.iceResistance || 0;
          break;
        case "electric":
          baseResistance = selectedEnemy?.stats.electricResistance || 0;
          break;
        case "physical":
          baseResistance = selectedEnemy?.stats.physicalResistance || 0;
          break;
        case "ether":
          baseResistance = selectedEnemy?.stats.etherResistance || 0;
          break;
      }
      const totalResShred = getTotalResShred(
        damageType,
        selectedSkill.id,
        selectedSkill.skillType,
      );
      const finalResistance = baseResistance - totalResShred;
      const resMultiplier = 1 - finalResistance;

      const damageWithRes = Math.round(finalDamage * resMultiplier);
      const critWithRes = Math.round(finalCritDamage * resMultiplier);

      results.normal.push(Math.round(finalDamage));
      results.critical.push(Math.round(finalCritDamage));
      results.realNormal.push(damageWithRes);
      results.realCritical.push(critWithRes);
    }

    results.totalNormal = results.normal.reduce((a, b) => a + b, 0);
    results.totalCritical = results.critical.reduce((a, b) => a + b, 0);
    results.totalRealNormal = results.realNormal.reduce((a, b) => a + b, 0);
    results.totalRealCritical = results.realCritical.reduce((a, b) => a + b, 0);

    if (stunMultiplier > 0) {
      const stunMod = 1 + stunMultiplier / 100;
      results.normal = results.normal.map((d) => Math.round(d * stunMod));
      results.critical = results.critical.map((d) => Math.round(d * stunMod));
      results.realNormal = results.realNormal.map((d) =>
        Math.round(d * stunMod),
      );
      results.realCritical = results.realCritical.map((d) =>
        Math.round(d * stunMod),
      );
      results.totalNormal = Math.round(results.totalNormal * stunMod);
      results.totalCritical = Math.round(results.totalCritical * stunMod);
      results.totalRealNormal = Math.round(results.totalRealNormal * stunMod);
      results.totalRealCritical = Math.round(
        results.totalRealCritical * stunMod,
      );
    }

    return results;
  };

  const isDialyn = agent.id === "dialyn";
  const isSunna = agent.id === "sunna";
  const isDialynEffectActive =
    activeEffects["dialyn-core_3-external_line"]?.enabled ?? false;
  const isSunnaEffectActive =
    activeEffects["sunna-core_2-cuteness_is_justice"]?.enabled ?? false;

  const calculateAdditionalDamages = (): AdditionalDamage[] => {
    const additional: AdditionalDamage[] = [];
    if (!isDialyn) {
      return additional;
    }
    const referenceEffect = allEffects.find((e) => e.referenceStatEffect);
    if (!referenceEffect) return additional;
    const effectState =
      activeEffects[referenceEffect.id] || teamEffects?.[referenceEffect.id];
    if (!effectState?.enabled) return additional;

    const rawTarget = (targetSlots as any)?.[referenceEffect.id];
    const targetSlot = rawTarget?.targetSlot ?? rawTarget;
    if (targetSlot === undefined || targetSlot === null) return additional;

    const targetSlotInfo = teamSlotsInfo?.find(
      (s) => s.slotIndex === targetSlot,
    );
    const targetStats = targetSlotInfo?.stats;
    if (!targetStats) return additional;

    const refEffect = referenceEffect.referenceStatEffect!;
    let baseDamage = 0;
    let statValue = 0;
    let statName = "";
    let description = "";
    let multiplier = refEffect.multiplier;
    if (
      refEffect.specialtyMultipliers &&
      refEffect.specialtyMultipliers[targetSlotInfo.specialty]
    ) {
      multiplier = refEffect.specialtyMultipliers[targetSlotInfo.specialty];
    }

    if (targetSlotInfo.specialty === "Attack") {
      statValue = targetStats.atk;
      statName = "ATK";
      baseDamage = statValue * multiplier;
      description = `${multiplier * 100}% of ${targetSlotInfo.agentName}'s ATK`;
    } else if (targetSlotInfo.specialty === "Rupture") {
      statValue = targetStats.sheerForce || 0;
      statName = "Sheer Force";
      baseDamage = statValue * multiplier;
      description = `${multiplier * 100}% of ${targetSlotInfo.agentName}'s Sheer Force`;
    }

    if (baseDamage > 0) {
      let totalBonus = 1;
      totalBonus += bonuses.global;
      totalBonus += bonuses.elements.physical || 0;
      totalBonus += unifiedStats.attributeDmgBonus.physical || 0;

      const damageWithBonus = baseDamage * totalBonus;
      const critDamage = damageWithBonus * (1 + unifiedStats.critDmg);
      const realDamage = calculateRealDamage(
        damageWithBonus,
        "physical",
        undefined,
        "additional",
        "ex",
        0,
        "Additional Hit",
      );
      const realCritDamage = calculateRealDamage(
        critDamage,
        "physical",
        undefined,
        "additional",
        "ex",
        0,
        "Additional Hit",
      );

      additional.push({
        name: "EX Special Attacks Additional DMG",
        description,
        value: Math.round(damageWithBonus),
        critValue: Math.round(critDamage),
        realValue: realDamage,
        realCritValue: realCritDamage,
        source: `${targetSlotInfo.agentName} (${targetSlotInfo.specialty})`,
        statUsed: `${Math.round(statValue).toLocaleString()} ${statName} × ${multiplier}`,
      });
    }
    return additional;
  };

  const calculateSunnaTriggerDamage = (): AdditionalDamage[] => {
    const additional: AdditionalDamage[] = [];
    if (!isSunna) return additional;

    const sunnaEffect = allEffects.find(
      (e) => e.id === "sunna-core_2-cuteness_is_justice",
    );
    if (!sunnaEffect) return additional;
    const effectState = activeEffects[sunnaEffect.id];
    if (!effectState?.enabled) return additional;

    const mindscape2Active =
      activeEffects["sunna-mindscape_2-feline_go_with_the_flow"]?.enabled ||
      false;
    const mindscape6Active =
      activeEffects["sunna-mindscape_6-hollow_big_bang"]?.enabled || false;

    const targetSlotData = targetSlots?.[sunnaEffect.id];
    const targetSlot = targetSlotData?.targetSlot;
    if (targetSlot === undefined || targetSlot === null) return additional;

    const targetSlotInfo = teamSlotsInfo?.find(
      (s) => s.slotIndex === targetSlot,
    );
    const targetStats = targetSlotInfo?.stats;
    if (!targetStats) return additional;

    const refEffect = sunnaEffect.referenceStatEffect!;
    let effectiveSpecialty = targetSlotInfo.specialty;
    let statName = "ATK";
    let statValue = targetStats.atk;
    const isSelfTarget =
      targetSlotInfo.agentName === agent.displayName ||
      targetSlotInfo.agentName === agent.name;

    if (mindscape6Active && isSelfTarget) {
      effectiveSpecialty = "Attack";
      statName = "ATK";
      statValue = targetStats.atk;
    } else if (
      refEffect.specialtyStats?.[targetSlotInfo.specialty] === "sheerForce"
    ) {
      statName = "Sheer Force";
      statValue = targetStats.sheerForce || 0;
    }

    const compatibleSpecialties = Object.keys(
      refEffect.specialtyMultipliers || {},
    );
    if (!compatibleSpecialties.includes(effectiveSpecialty)) return additional;

    let baseMultiplier = refEffect.specialtyMultipliers[effectiveSpecialty];
    let finalMultiplier = baseMultiplier;
    let mindscapeBonus = 0;
    if (mindscape2Active) {
      if (effectiveSpecialty === "Attack") {
        mindscapeBonus = 2.0;
      } else if (effectiveSpecialty === "Anomaly") {
        mindscapeBonus = 3.0;
      }
      finalMultiplier = baseMultiplier + mindscapeBonus;
    }

    const baseDamage = statValue * finalMultiplier;
    const targetAgent = targetSlotInfo.agent;
    const damageElement =
      targetAgent?.attribute?.toLowerCase() || agent.attribute.toLowerCase();

    let totalBonus = 1;
    totalBonus += bonuses.global;
    totalBonus += bonuses.elements[damageElement] || 0;
    totalBonus +=
      unifiedStats.attributeDmgBonus[
        damageElement as keyof typeof unifiedStats.attributeDmgBonus
      ] || 0;

    if (mindscape6Active) {
      const ms6DamageBonus =
        bonuses.exclusive["sunna-cats_gaze_trigger_damage"] || 0;
      totalBonus += ms6DamageBonus;
    }

    const damageWithBonus = baseDamage * totalBonus;

    let totalCritDmg = unifiedStats.critDmg;
    if (mindscape6Active) {
      const m6Effect = allEffects.find(
        (e) => e.id === "sunna-mindscape_6-hollow_big_bang",
      );
      if (m6Effect?.conditional?.type === "initialStatBased") {
        const sunnaInitialAtk = 3500;
        const perUnitBonus = m6Effect.conditional.perUnitBonus || 0.0003;
        const maxBonus =
          m6Effect.conditional.skillLevels?.[0]?.maxBonus || 1.05;
        let m6CritBonus = sunnaInitialAtk * perUnitBonus;
        m6CritBonus = Math.min(m6CritBonus, maxBonus);
        totalCritDmg += m6CritBonus;
      }
    }

    if (refEffect.bonusCritDmg) {
      totalCritDmg += refEffect.bonusCritDmg;
    }

    const guaranteedCrit =
      refEffect.guaranteedCrit || false || mindscape6Active;
    let critDamage = damageWithBonus;
    if (guaranteedCrit) {
      critDamage = damageWithBonus * (1 + totalCritDmg);
    }

    const realDamage = calculateRealDamage(
      Math.round(damageWithBonus),
      damageElement,
      undefined,
      "sunna-trigger",
      "core",
      0,
      "Cat's Gaze Trigger",
    );
    const realCritDamage = calculateRealDamage(
      Math.round(critDamage),
      damageElement,
      undefined,
      "sunna-trigger",
      "core",
      0,
      "Cat's Gaze Trigger (CRIT)",
    );

    const basePercent = (baseMultiplier * 100).toFixed(0);
    const finalPercent = (finalMultiplier * 100).toFixed(0);
    let multiplierDisplay = `${finalPercent}%`;
    if (mindscape2Active) {
      multiplierDisplay = `${basePercent}% + ${(mindscapeBonus * 100).toFixed(0)}% = ${finalPercent}%`;
    }

    const ms6Tag = mindscape6Active ? " + MS6" : "";
    const selfTag = mindscape6Active && isSelfTarget ? " (Self as Attack)" : "";

    additional.push({
      name: `Cat's Gaze ${ms6Tag}`,
      description: `${multiplierDisplay} of ${targetSlotInfo.agentName}'s ${statName}${selfTag}`,
      value: Math.round(damageWithBonus),
      critValue: Math.round(critDamage),
      realValue: realDamage,
      realCritValue: realCritDamage,
      source: `${targetSlotInfo.agentName} (${effectiveSpecialty})${ms6Tag}`,
      statUsed: `${Math.round(statValue).toLocaleString()} ${statName} × ${finalMultiplier.toFixed(1)}`,
      element: damageElement,
    });

    return additional;
  };

  const damageResults = calculateDamage();
  const additionalDamages = calculateAdditionalDamages();
  const sunnaTriggerDamages = calculateSunnaTriggerDamage();

  const hasBonuses =
    Object.values(bonuses.skillTypes).some((v) => v > 0) ||
    Object.keys(bonuses.exclusive).length > 0 ||
    bonuses.global > 0 ||
    Object.values(bonuses.elements).some((v) => v > 0) ||
    aftershockDefShredTotal > 0;

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-US");

  const getSkillGroup = (skillId: string): string => {
    if (agent.skills?.basicAttacks?.some((s) => s.id === skillId))
      return "Basic Attacks";
    if (agent.skills?.dashAttacks?.some((s) => s.id === skillId))
      return "Dash Attacks";
    if (agent.skills?.dodgeCounters?.some((s) => s.id === skillId))
      return "Dodge Counters";
    if (agent.skills?.exSkills?.some((s) => s.id === skillId))
      return "EX Skills";
    if (agent.skills?.ultimate?.some((s) => s.id === skillId))
      return "Ultimate";
    if (agent.skills?.chainAttacks?.some((s) => s.id === skillId))
      return "Chain Attacks";
    if (agent.skills?.quickAssists?.some((s) => s.id === skillId))
      return "Quick Assists";
    if (agent.skills?.perfectAssists?.some((s) => s.id === skillId))
      return "Perfect Assists";
    if (agent.skills?.assistFollowup?.some((s) => s.id === skillId))
      return "Assist Follow-up";
    if (agent.skills?.specialAttacks?.some((s) => s.id === skillId))
      return "Special Attacks";
    if (agent.skills?.mindscapeAbilities?.some((s) => s.id === skillId))
      return "Mindscape Abilities";
    return "Other Skills";
  };

  if (!selectedSkill) {
    return (
      <div className="SCR001" key={calculatorKey}>
        <h4 className="SCR002">Damage Calculator</h4>
        <div className="skill-error">
          <p>⚠️ Skill not found or not available for this agent</p>
          <button onClick={reloadSkills} className="reload-skills-button">
            🔄 Reload Skills
          </button>
        </div>
      </div>
    );
  }

  const getRemielleAnomalyDmgBonus = (): number => {
    if (agent.id !== "remielle") return 0;
    let totalBonus = 0;
    Object.entries(allActiveEffects).forEach(([effectId, state]) => {
      if (!state.enabled) return;
      const effect = allEffects.find((e) => e.id === effectId);
      if (!effect) return;
      if (
        effect.condition?.excludeOwner === true &&
        effect.ownerAgentId === agent.id
      ) {
        return;
      }
      const stacks = state.stacks || 1;

      if (effect.flat?.anomalyDmgBonus) {
        totalBonus += effect.flat.anomalyDmgBonus * stacks;
      }
      if (effect.perStack?.anomalyDmgBonus) {
        totalBonus += effect.perStack.anomalyDmgBonus * stacks;
      }
      if (effect.damageBonuses) {
        effect.damageBonuses.forEach((bonus) => {
          if (bonus.type === "anomalyDmgBonus") {
            totalBonus += bonus.value * stacks;
          }
        });
      }
      if (
        effect.conditional?.type === "currentStatBased" &&
        effect.conditional.affectedStats
      ) {
        if (effect.conditional.affectedStats.includes("anomalyDmgBonus")) {
          const basedOn = effect.conditional.basedOn;
          const perUnit = effect.conditional.perUnit || 1;
          const perUnitBonus = effect.conditional.perUnitBonus || 0;
          const threshold = effect.conditional.threshold || 0;
          let currentStatValue = 0;
          if (basedOn === "anomalyProficiency") {
            currentStatValue = unifiedStats.anomalyProficiency;
          } else if (basedOn === "anomalyMastery") {
            currentStatValue = unifiedStats.anomalyMastery;
          }
          const excess = Math.max(0, currentStatValue - threshold);
          const units = Math.floor(excess / perUnit);
          const bonusValue = units * perUnitBonus;
          totalBonus += bonusValue * stacks;
        }
      }
    });
    return totalBonus;
  };

  return (
    <div>
      <div
        className="calculator-main_wrapper"
        key={calculatorKey}
        style={
          {
            ...emptyObjectsStyle,
            "--theme": theme,
          } as React.CSSProperties
        }
      >
        <div className="calculator-calculator_title">
          <p className="slot-agent_stats-title">DAMAGE CALCULATOR</p>
          <div className="slot-divider" />
        </div>

        <StunMultiplierInput
          value={stunMultiplier}
          onChange={setStunMultiplier}
          effects={collectStunEffects()}
        />

        <EnemySelector
          selectedEnemyId={selectedEnemyId}
          onEnemyChange={setSelectedEnemyId}
          defReduction={totalDefShred}
          theme={agent?.themeColor || "#7EFFDB"}
        />

        <DefensesBonusesPanel
          defensesBonuses={defenseBonuses}
          className="SCR017"
        />

        {/* 🌟 Attribute Flux Selector (solo para Remielle) */}
        {agent.id === "remielle" && (
          <div className="attribute_flux-main_wrapper">
            <div className="attribute_flux-header">
              <label className="stun-multiplier-label">
                Remielle's Attribute Flux
              </label>
            </div>
            <div className="skill_selector-description">
              <p>
                Upon entering the battlefield, a Lumiflux Agent undergoes{" "}
                <span className="text-pink">Attribute Flux</span> based on the
                Base attribute of the next Agent in the squad. After undergoing{" "}
                <span className="text-pink">Attribute Flux</span>, when the
                Agent deals <span className="text-pink">Lumiflux DMG</span>, it
                is treated as dealing attribute DMG of the attribute targeted by{" "}
                <span className="text-pink">Attribute Flux</span>.
              </p>
            </div>
            <div className="attribute-flux-buttons">
              <label className="skill_selector-header">AGENT:</label>
              {teamSlotsInfo
                ?.filter(
                  (slot) =>
                    slot.slotIndex !== currentSlotIndex &&
                    slot.agentName !== "Empty",
                )
                .map((slot) => {
                  const agentData = agents.find(
                    (a) =>
                      a.displayName === slot.agentName ||
                      a.name === slot.agentName,
                  );

                  const attr =
                    agentData?.attribute?.toLowerCase() ||
                    slot.attribute?.toLowerCase() ||
                    "unknown";

                  const isActive = fluxedAttribute === attr;
                  const color = ATTRIBUTE_COLORS[attr] || "#888";

                  return (
                    <button
                      key={slot.slotIndex}
                      className={`attribute-flux-btn ${isActive ? "active" : "inactive"}`}
                      style={{ "--btn-color": color }}
                      onClick={() =>
                        setFluxedAttribute(
                          currentSlotIndex,
                          isActive ? null : attr,
                        )
                      }
                    >
                      {slot.agentName} (
                      {attr.charAt(0).toUpperCase() + attr.slice(1)})
                    </button>
                  );
                })}
            </div>
            {fluxedAttribute && (
              <div className="skill_selector-description">
                <p>
                  Remielle's skills are using the{" "}
                  <strong
                    style={{
                      color: ATTRIBUTE_COLORS[fluxedAttribute] || "#fff",
                    }}
                  >
                    {fluxedAttribute.toUpperCase()}
                  </strong>{" "}
                  attribute for damage calculations.
                </p>
              </div>
            )}
          </div>
        )}

        <div
          className="skill_selector-main_wrapper"
          key={`skill-selector-${calculatorKey}`}
        >
          <div className="skill_selector-header">
            <label>Skill:</label>
          </div>
          <div className="skill_selector-neon_wrapper">
            <NeonSelect
              value={selectedSkill?.name || "Select a skill..."}
              options={(() => {
                const groups: Array<{
                  label: string;
                  options: Array<{ value: string; label: string }>;
                }> = [];
                const addGroup = (groupLabel: string, skills: any[]) => {
                  if (skills && skills.length > 0) {
                    groups.push({
                      label: groupLabel,
                      options: skills.map((skill) => ({
                        value: skill.id,
                        label: skill.name,
                      })),
                    });
                  }
                };
                addGroup("Basic Attacks", agent.skills?.basicAttacks);
                addGroup("Dash Attacks", agent.skills?.dashAttacks);
                addGroup("Dodge Counters", agent.skills?.dodgeCounters);
                addGroup("Quick Assists", agent.skills?.quickAssists);
                addGroup("Perfect Assists", agent.skills?.perfectAssists);
                addGroup("Assist Follow-up", agent.skills?.assistFollowup);
                addGroup("Special Attacks", agent.skills?.specialAttacks);
                addGroup("EX Skills", agent.skills?.exSkills);
                addGroup("Chain Attacks", agent.skills?.chainAttacks);
                addGroup("Ultimate", agent.skills?.ultimate);
                addGroup("Additional Skills", agent.skills?.mindscapeAbilities);

                const flatOptions: Array<{
                  value: string;
                  label: string;
                  disabled?: boolean;
                  group?: string;
                }> = [];
                groups.forEach((group, idx) => {
                  flatOptions.push({
                    value: `__group_${idx}`,
                    label: `${group.label}`,
                    disabled: true,
                  });
                  group.options.forEach((opt) => {
                    flatOptions.push({
                      value: opt.value,
                      label: `${opt.label}`,
                      disabled: false,
                    });
                  });
                });
                return flatOptions;
              })()}
              onChange={(value: string) => {
                if (value && !value.startsWith("__group_")) {
                  setSelectedSkillId(value);
                }
              }}
              theme={agent?.themeColor || "#ffffff"}
              variant="skill"
            />
          </div>

          {/* Selector de nivel */}
          <div className="skill_selector-level_setter">
            <label className="skill_selector-header">Skill Level:</label>
            <div className="skill_selector-buttons_container">
              {dynamicLevels.map((level) => {
                const isAvailable = availableLevels.includes(level);
                const isSelected = skillLevel === level;
                const isActive =
                  isSelected || (isAvailable && level < skillLevel);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      if (isAvailable) {
                        setIsManualOverride(true);
                        setSkillLevel(level);
                      }
                    }}
                    disabled={!isAvailable}
                    className="skill_selector-level_buttons"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${theme}, ${theme}aa)`
                        : isAvailable
                          ? "#4c4c4c"
                          : "#222",
                      color: isActive
                        ? "#ffffffee"
                        : isAvailable
                          ? "#c4c3c3"
                          : "#666",
                      cursor: isAvailable ? "pointer" : "not-allowed",
                      fontWeight: isActive ? "bold" : "normal",
                      boxShadow: isActive
                        ? `0 0 20px ${theme}55, inset 0 0 20px ${theme}33`
                        : "none",
                      borderColor: isActive ? theme : "#444",
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSkill?.description && (
            <div className="skill_selector-description">
              {selectedSkill.description.split("\n").map((line, index) => {
                let processedLine = wrapAbilityName(line);
                processedLine = replaceSkillMarkers(
                  processedLine,
                  agent.specialty,
                );
                processedLine = colorizeElementalText(processedLine);
                return (
                  <p
                    key={index}
                    style={{ margin: line.trim() === "" ? "6px 0" : "3px 0" }}
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ⭐ Componente especial para Hugo - SOLO para EX Special y Ultimate */}
        {agent.id === "hugo" && (
          <HugoTotalizeCalculator
            exSkill={agent.skills?.exSkills?.find(
              (s) => s.id === "hugo-ex_special_attack-soul_hunter_punishment",
            )}
            ultimateSkill={agent.skills?.ultimate?.[0]}
            selectedSkillId={selectedSkillId}
            skillLevel={skillLevel}
            unifiedStats={unifiedStats}
            onTotalizeStateChange={setTotalizeState}
            initialTotalizeState={{
              isActive: hugoTotalizeActive,
              stunTimeLessThan5: hugoStunTimeLessThan5,
              stunTimeBetween5And15: hugoStunTimeBetween5And15,
              mindscape6Active: hugoMindscape6Active,
            }}
            disabled={
              selectedSkillId !==
                "hugo-ex_special_attack-soul_hunter_punishment" &&
              selectedSkillId !== "hugo-ultimate-blaspheme"
            }
            theme={agent?.themeColor}
            mindscape6Enabled={
              activeEffects["hugo_vlad-mindscape_6-crown_of_thorns"]?.enabled ??
              false
            }
          />
        )}

        {agent.id === "pyrois" && (
          <div
            className={`damage_bonuses_panel-main_wrapper totalize-wrapper totalize-pyrois ${
              selectedSkillId === "pyrois-ultimate-eternal_imprisonment"
                ? ""
                : "totalize-disabled"
            }`}
          >
            {/* HEADER */}
            <div className="totalize-header">
              <div className="totalize-header-left">
                <img
                  src="/ztunner/resources/images/icons/skilltypes/ultimate_white.png"
                  alt="ultimate"
                  className="totalize-icon"
                />
                <span className="totalize-title">Pyrois' Totalize DMG</span>
              </div>
              <div className="totalize-header-right">
                <span
                  className={`totalize-status ${
                    pyroisTotalizeActive ? "active" : "inactive"
                  }`}
                >
                  {pyroisTotalizeActive ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="totalize-agent-tag">Pyrois</span>
              </div>
            </div>

            {/* BODY */}
            <div className="totalize-body totalize-body-pyrois">
              {/* COLUMNA IZQUIERDA: CONTROLES */}
              <div className="totalize-controls-pyrois">
                <button
                  className={`totalize-toggle-btn ${
                    pyroisTotalizeActive ? "active" : ""
                  }`}
                  onClick={() => {
                    onCalculatorStateChange((prev) => ({
                      ...prev,
                      pyroisTotalizeActive: !prev.pyroisTotalizeActive,
                    }));
                  }}
                  disabled={
                    selectedSkillId !== "pyrois-ultimate-eternal_imprisonment"
                  }
                  style={
                    pyroisTotalizeActive
                      ? { backgroundColor: theme, borderColor: theme }
                      : {}
                  }
                >
                  {pyroisTotalizeActive ? "Active" : "Inactive"}
                </button>

                {/* Mensaje de ayuda cuando no está seleccionada la Ultimate */}
                {(!pyroisTotalizeActive ||
                  selectedSkillId !==
                    "pyrois-ultimate-eternal_imprisonment") && (
                  <div className="totalize-disabled-notice">
                    <span>
                      Select Pyrois'{" "}
                      <span className="disabled-notice-theme">
                        Ultimate: Eternal Imprisonment
                      </span>{" "}
                      to enable Pyrois's Totalize DMG output.
                    </span>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: RESULTADOS */}
              <div className="totalize-results-pyrois">
                {!pyroisTotalizeActive ? (
                  <div className="totalize-placeholder">
                    <p>Totalize is currently disabled.</p>
                  </div>
                ) : (
                  <>
                    <div className="totalize-result-card">
                      <div className="totalize-result-label">
                        Base Multiplier
                      </div>
                      <div className="totalize-result-value">2250%</div>
                    </div>

                    <div className="totalize-result-card totalize-bonus-card">
                      <div className="totalize-result-label">
                        Totalize Bonus
                      </div>
                      <div className="totalize-result-value">+0% (fixed)</div>
                    </div>

                    <div className="totalize-final-card">
                      <div className="totalize-result-label">
                        Final Multiplier
                      </div>
                      <div className="totalize-result-value-wrapper">
                        <span className="totalize-result-value">2250%</span>
                      </div>
                    </div>

                    {/*<div className="totalize-extra-info-pyrois">
                      • Extends Stun duration by 3s.
                      <br />• Finishing Move ends Stun state
                    </div>*/}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de daños */}
        {damageResults && (
          <div className="damage_results-main_wrapper">
            <div className="damage_results-main_content">
              <div className="grid-header">
                <div className="header-cell">Hit Name</div>
                <div className="header-cell">Multiplier (%)</div>
                <div className="header-cell">Normal DMG</div>
                <div className="header-cell">Critical DMG</div>
                <div className="header-cell">
                  In-Game DMG (vs {formatNumber(selectedEnemy?.stats.def)} DEF)
                </div>
              </div>

              {selectedSkill.hits.map((hit, index) => {
                const damageSubtype = (hit as any).damageSubtype;
                const isAftershock = damageSubtype === "aftershock";
                return (
                  <div key={index} className="grid-row">
                    <div className="row-cell cell-hit">
                      {hit.name || `Hit ${index + 1}`}
                      {isAftershock && (
                        <span className="aftershock-badge">Aftershock</span>
                      )}
                      {damageSubtype && damageSubtype !== "aftershock" && (
                        <span className="subtype-badge">{damageSubtype}</span>
                      )}
                    </div>
                    <div className="row-cell cell-multiplier">
                      {selectedSkill.levels.find((l) => l.level === skillLevel)
                        ?.multipliers[index] || 0}{" "}
                      %
                    </div>
                    <div className="row-cell cell-normal">
                      {formatNumber(damageResults.normal[index])}
                    </div>
                    <div className="row-cell cell-critical">
                      {formatNumber(damageResults.critical[index])}
                    </div>
                    <div className="row-cell cell-realdmg">
                      <div>{formatNumber(damageResults.realNormal[index])}</div>
                      <div className="crit-sub">
                        <span className="crit-span">Crit:</span>
                        {formatNumber(damageResults.realCritical[index])}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ⭐ TOTALIZE Hugo */}
              {agent.id === "hugo" &&
                totalizeState.isActive &&
                totalizeState.selectedSkillId === selectedSkill.id &&
                damageResults.normal.length > selectedSkill.hits.length && (
                  <div className="grid-row-totalize">
                    <div className="row-cell cell-hit">
                      <span>Totalize DMG Mutiplier</span>
                      <span className="pyrois-totalize_tag">
                        +{(totalizeState.totalizeBonus * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="row-cell cell-multiplier">
                      {totalizeState.finalMultiplier.toFixed(1)}%
                    </div>
                    <div className="row-cell cell-normal">
                      {formatNumber(
                        damageResults.normal[selectedSkill.hits.length],
                      )}
                    </div>
                    <div className="row-cell cell-critical">
                      {formatNumber(
                        damageResults.critical[selectedSkill.hits.length],
                      )}
                    </div>
                    <div className="row-cell cell-realdmg">
                      <div>
                        {formatNumber(
                          damageResults.realNormal[selectedSkill.hits.length],
                        )}
                      </div>
                      <div className="crit-sub">
                        <span className="crit-span">Crit:</span>
                        {formatNumber(
                          damageResults.realCritical[selectedSkill.hits.length],
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* ⭐ TOTALIZE Pyrois */}
              {agent.id === "pyrois" &&
                pyroisTotalizeActive &&
                selectedSkillId === "pyrois-ultimate-eternal_imprisonment" &&
                damageResults.normal.length > selectedSkill.hits.length && (
                  <div className="grid-row-totalize">
                    <div className="row-cell cell-hit">
                      <span>Totalize DMG Mutiplier</span>
                      <span className="pyrois-totalize_tag">+2250%</span>
                    </div>
                    <div className="row-cell cell-multiplier">
                      <span>2250%</span>
                    </div>
                    <div className="row-cell cell-normal">
                      {formatNumber(
                        damageResults.normal[selectedSkill.hits.length],
                      )}
                    </div>
                    <div className="row-cell cell-critical">
                      {formatNumber(
                        damageResults.critical[selectedSkill.hits.length],
                      )}
                    </div>
                    <div className="row-cell cell-realdmg">
                      <div>
                        {formatNumber(
                          damageResults.realNormal[selectedSkill.hits.length],
                        )}
                      </div>
                      <div className="crit-sub">
                        <span className="crit-span">Crit:</span>
                        {formatNumber(
                          damageResults.realCritical[selectedSkill.hits.length],
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* TOTAL */}
              <div className="grid-row-total">
                <div className="row-cell cell-hit">Total</div>
                <div className="row-cell cell-multiplier">-</div>
                <div className="row-cell cell-normal">
                  {formatNumber(damageResults.totalNormal)}
                </div>
                <div className="row-cell cell-critical">
                  {formatNumber(damageResults.totalCritical)}
                </div>
                <div className="row-cell cell-realdmg">
                  <div>{formatNumber(damageResults.totalRealNormal)}</div>
                  <div className="crit-sub">
                    <span className="crit-span">Crit:</span>
                    {formatNumber(damageResults.totalRealCritical)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ActiveBonusesPanel
          bonuses={bonuses}
          selectedSkillId={selectedSkillId}
          selectedSkillType={selectedSkill?.skillType}
          selectedSkillElement={
            selectedSkill?.damageType?.toLowerCase() ||
            agent.attribute.toLowerCase()
          }
          agentAttribute={agent.attribute.toLowerCase()}
          agentSpecialty={agent.specialty}
          className="SCR017"
        />

        {/* ⭐ SECCIÓN DE OTRAS HABILIDADES - Dialyn */}
        {isDialyn && (
          <div
            className="extra-calculator-panel"
            style={
              {
                "--theme": agent?.themeColor || "#7EFFDB",
              } as React.CSSProperties
            }
          >
            <div className="extra-panel-header">
              <div className="extra-panel-header-left">
                <img
                  src="/ztunner/resources/images/icons/skilltypes/core.png"
                  alt="core"
                  className="totalize-icon"
                />
                <span className="extra-panel-title">
                  Dialyn's External Line
                </span>
              </div>
              <div className="extra-panel-header-right">
                <span
                  className={`extra-panel-status ${
                    isDialynEffectActive ? "active" : "inactive"
                  }`}
                >
                  {isDialynEffectActive ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="extra-panel-agent-tag">Dialyn</span>
              </div>
            </div>

            {!isDialynEffectActive ? (
              <div className="extra-panel-empty">
                <p>Effect not enabled</p>
                <p className="extra-panel-empty-sub">
                  Enable the "External Line (Additional Ability)" effect to see
                  Dialyn's EX Special Attacks DMG output.
                </p>
              </div>
            ) : additionalDamages.length === 0 ? (
              <div className="extra-panel-empty">
                <span className="extra-panel-empty-icon">👤</span>
                <p>No compatible squad member selected</p>
                <p className="extra-panel-empty-sub">
                  Select an Attack or Rupture agent in the "External Line
                  (Additional Ability)" effect section to see Dialyns's EX
                  Special Attacks DMG output.
                </p>
              </div>
            ) : (
              additionalDamages.map((damage, index) => (
                <div key={index} className="extra-panel-grid">
                  <div className="extra-panel-description">
                    <div className="extra-panel-desc-name">{damage.name}</div>
                    <div className="extra-panel-desc-text">
                      {damage.description}
                    </div>
                    <div className="extra-panel-desc-source">
                      Source: {damage.source}
                    </div>
                    <div className="extra-panel-desc-base">
                      Base: {damage.statUsed.replace(/\(.*\)/, "").trim()}
                    </div>
                  </div>
                  <div className="extra-panel-calculations">
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">Normal DMG</span>
                      <span className="extra-panel-calc-value normal">
                        {formatNumber(damage.value)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Critical DMG
                      </span>
                      <span className="extra-panel-calc-value crit">
                        {formatNumber(damage.critValue)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Real DMG (vs {formatNumber(selectedEnemy?.stats.def)}{" "}
                        DEF)
                      </span>
                      <span className="extra-panel-calc-value real">
                        {formatNumber(damage.realValue)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Real Critical DMG
                      </span>
                      <span className="extra-panel-calc-value real-crit">
                        {formatNumber(damage.realCritValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ⭐ SECCIÓN DE OTRAS HABILIDADES - Sunna */}
        {isSunna && (
          <div
            className="extra-calculator-panel"
            style={
              {
                "--theme": agent?.themeColor || "#7EFFDB",
              } as React.CSSProperties
            }
          >
            <div className="extra-panel-header">
              <div className="extra-panel-header-left">
                <img
                  src="/ztunner/resources/images/icons/skilltypes/core.png"
                  alt="core"
                  className="totalize-icon"
                />
                <span className="extra-panel-title">Sunna's Cat's Gaze</span>
              </div>
              <div className="extra-panel-header-right">
                <span
                  className={`extra-panel-status ${
                    isSunnaEffectActive ? "active" : "inactive"
                  }`}
                >
                  {isSunnaEffectActive ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="extra-panel-agent-tag">Sunna</span>
              </div>
            </div>

            {!isSunnaEffectActive ? (
              <div className="extra-panel-empty">
                <p>Effect not enabled</p>
                <p className="extra-panel-empty-sub">
                  Enable the "Cuteness Is Justice (Core Pasiive)" effect to see
                  Sunna's Cat's Gaze DMG output.
                </p>
              </div>
            ) : sunnaTriggerDamages.length === 0 ? (
              <div className="extra-panel-empty">
                <span className="extra-panel-empty-icon">👤</span>
                <p>No compatible squad member selected</p>
                <p className="extra-panel-empty-sub">
                  Select an Attack or Anomaly agent in the "Cuteness Is Justice
                  (Core Pasiive)" effect section to see Sunna's Cat's Gaze DMG
                  output.
                </p>
              </div>
            ) : (
              sunnaTriggerDamages.map((damage, index) => (
                <div key={index} className="extra-panel-grid">
                  <div className="extra-panel-description">
                    <div className="extra-panel-desc-name">{damage.name}</div>
                    <div className="extra-panel-desc-text">
                      {damage.description}
                    </div>
                    <div className="extra-panel-desc-source">
                      Source: {damage.source}
                    </div>
                    <div className="extra-panel-desc-base">
                      Base: {damage.statUsed}
                    </div>
                    {damage.element && (
                      <div className="extra-panel-desc-element">
                        Attribute DMG:{" "}
                        <span
                          style={{
                            color:
                              ATTRIBUTE_COLORS[damage.element] || "#ffffff",
                            opacity: 0.8,
                          }}
                        >
                          {damage.element.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="extra-panel-calculations">
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">Normal DMG</span>
                      <span className="extra-panel-calc-value normal">
                        {formatNumber(damage.value)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Critical DMG
                      </span>
                      <span className="extra-panel-calc-value crit">
                        {formatNumber(damage.critValue)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Real DMG (vs {formatNumber(selectedEnemy?.stats.def)}{" "}
                        DEF)
                      </span>
                      <span className="extra-panel-calc-value real">
                        {formatNumber(damage.realValue)}
                      </span>
                    </div>
                    <div className="extra-panel-calc-row">
                      <span className="extra-panel-calc-label">
                        Real Critical DMG
                      </span>
                      <span className="extra-panel-calc-value real-crit">
                        {formatNumber(damage.realCritValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        className="calculator-main_wrapper"
        key={calculatorKey}
        style={
          {
            ...emptyObjectsStyle,
            "--theme": theme,
          } as React.CSSProperties
        }
      >
        {/* Luminize Calculator para Remielle */}
        {agent.id === "remielle" ? (
          <>
            <LuminizeCalculator
              agent={agent}
              unifiedStats={unifiedStats}
              selectedEnemy={selectedEnemy}
              stunMultiplier={stunMultiplier}
              damageBonuses={bonuses}
              anomalyBonuses={anomalyBonuses}
              teamSlotsInfo={teamSlotsInfo}
              currentSlotIndex={currentSlotIndex}
              skillLevel={skillLevel}
              theme={theme}
              slotAnomalyResults={slotAnomalyResults}
              calculatorState={calculatorState}
              onCalculatorStateChange={onCalculatorStateChange}
              activeEffects={allActiveEffects}
            />
            <AnomalyBonusesPanel
              anomalyBonuses={anomalyBonuses}
              isLuminizeMode={true}
              className="SCR017"
            />
          </>
        ) : (
          <>
            <div className="calculator-calculator_title">
              <p className="slot-agent_stats-title">ANOMALY CALCULATOR</p>
              <div className="slot-divider" />
            </div>
            <AnomalyCalculator
              agent={agent}
              agentAttribute={agent.attribute.toLowerCase() as AttributeType}
              unifiedStats={unifiedStats}
              selectedEnemy={selectedEnemy}
              totalBonusDamage={
                bonuses.global + bonuses.elements[agent.attribute.toLowerCase()]
              }
              stunMultiplier={stunMultiplier}
              calculateRealDamage={calculateRealDamage}
              teamSlotsInfo={teamSlotsInfo}
              slotStatsMap={slotStatsMap}
              currentSlotIndex={currentSlotIndex}
              allEffects={allEffects}
              activeEffects={activeEffects}
              teamEffects={teamEffects}
              damageBonuses={bonuses}
              onResultChange={onAnomalyResultChange}
              slotAnomalyResults={slotAnomalyResults}
              calculatorState={calculatorState}
              onCalculatorStateChange={onCalculatorStateChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
