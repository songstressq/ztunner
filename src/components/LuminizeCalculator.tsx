import { useState, useEffect, useMemo } from "react";
import type { Agent, UnifiedStats } from "@/types/Agent";
import type { Enemy } from "@/types/Enemy";
import type { CollectedBonuses } from "@/utils/damageBonusCollector";
import type { AnomalyBonuses } from "@/utils/anomalyBonusCollector";
import NeonSelect from "@/components/NeonSelect";
import { ANOMALY_DEFINITIONS, type AttributeType } from "@/types/Anomaly";
import { calculateElementalResistance } from "@/utils/resistanceCalculator";
import { formatAnomalyType } from "@/utils/statFormatters";
import {
  defaultCalculatorState,
  type CalculatorUIState,
} from "@/context/SessionContext";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";

const REMIELLE_MS1_EFFECT_ID = "remielle_dan-mindscape_1-naive_oath_1";
const SELF_LUMINIZE_LEVEL_COEFFICIENT = 0.025;
const SELF_LUMINIZE_BUFF_LEVEL = 2.0;
const SELF_LUMINIZE_ALC = 794;

const REMIELLE_MS2_DEF_SHRED_EFFECT_ID =
  "remielle-mindscape_2-fall_into_the_noise_2";

const REMIELLE_INVITATION_TO_BLOOM_IDS = new Set<string>([
  "remielle_dan-core_2-invitation_to_bloom",
  "remielle_dan-core_3-invitation_to_bloom",
]);

const REMIELLE_PARADISE_LOST_ANOMALY_DMG_ID =
  "ode_of_resurrected_wings-paradise_lost-anomaly_dmg";

interface Props {
  agent: Agent;
  unifiedStats: UnifiedStats;
  selectedEnemy: Enemy | null;
  stunMultiplier: number;
  teamSlotsInfo: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
    stats?: UnifiedStats;
    agent?: Agent;
  }>;
  currentSlotIndex: number;
  skillLevel: number;
  theme?: string;
  slotAnomalyResults: Record<number, any>;
  damageBonuses: CollectedBonuses;
  anomalyBonuses: AnomalyBonuses;
  calculatorState: CalculatorUIState;
  onCalculatorStateChange: (
    updater: (prev: CalculatorUIState) => CalculatorUIState,
  ) => void;
  activeEffects: Record<string, { enabled: boolean; stacks: number }>;
  teamEffects?: Record<
    string,
    {
      enabled: boolean;
      stacks: number;
      sourceSlot: number;
      ownerAgentId: string;
      ownerInitialStats?: {
        hp?: number;
        atk?: number;
        def?: number;
        critRate?: number;
        anomalyMastery?: number;
        anomalyProficiency?: number;
        energyRegen?: number;
        penRatio?: number;
        impact?: number;
      };
      skillLevel?: number;
      overclockLevel?: number;
    }
  >;
}

export default function LuminizeCalculator({
  agent,
  unifiedStats,
  selectedEnemy,
  stunMultiplier,
  teamSlotsInfo,
  currentSlotIndex,
  skillLevel,
  theme = "#FEDBF3",
  slotAnomalyResults,
  damageBonuses,
  anomalyBonuses,
  calculatorState,
  onCalculatorStateChange,
  activeEffects,
  teamEffects,
}: Props) {
  const { luminizeSourceSlot, luminizeSelectedSkillId, luminizeSkillLevel } =
    calculatorState;

  const isRemielleMS1Active =
    activeEffects[REMIELLE_MS1_EFFECT_ID]?.enabled ?? false;
  const [selfLuminizeEnabled, setSelfLuminizeEnabled] =
    useState(isRemielleMS1Active);

  useEffect(() => {
    setSelfLuminizeEnabled(isRemielleMS1Active);
  }, [isRemielleMS1Active]);

  useEffect(() => {
    if (
      luminizeSourceSlot === currentSlotIndex &&
      !(isRemielleMS1Active && selfLuminizeEnabled)
    ) {
      onCalculatorStateChange((prev) => ({
        ...prev,
        luminizeSourceSlot: null,
      }));
    }
  }, [
    luminizeSourceSlot,
    currentSlotIndex,
    isRemielleMS1Active,
    selfLuminizeEnabled,
    onCalculatorStateChange,
  ]);

  const setLuminizeSourceSlot = (slot: number | null) => {
    onCalculatorStateChange((prev) => ({ ...prev, luminizeSourceSlot: slot }));
  };

  const excludedTeamAtk = useMemo(() => {
    let flat = 0;
    let percent = 0;

    if (!teamEffects || !teamSlotsInfo) return { flat, percent };

    Object.entries(teamEffects).forEach(([effectId, state]) => {
      if (!state?.enabled) return;
      if (state.ownerAgentId === agent.id) return;
      if (REMIELLE_INVITATION_TO_BLOOM_IDS.has(effectId)) return;

      const effect = ingameEffectsRegistry[effectId] as any;
      if (!effect) return;

      const stacks = state.stacks || 1;

      flat += (effect.flat?.atkFlatRaw || 0) * stacks;
      flat += (effect.perStack?.atkFlatRaw || 0) * stacks;
      percent += (effect.flat?.atkPercentRaw || 0) * stacks;
      percent += (effect.perStack?.atkPercentRaw || 0) * stacks;

      const cond = effect.conditional;
      if (!cond?.affectedStats) return;
      const affectsFlatRaw = cond.affectedStats.includes("atkFlatRaw");
      const affectsPercentRaw = cond.affectedStats.includes("atkPercentRaw");
      if (!affectsFlatRaw && !affectsPercentRaw) return;

      let bonusValue = 0;

      if (
        cond.type === "initialStatBased" ||
        cond.type === "initialStatBasedDamageBonus"
      ) {
        const ownerInit = state.ownerInitialStats;
        if (!ownerInit) return;
        const basedOn = cond.basedOn as string;
        let srcStat = 0;
        switch (basedOn) {
          case "atk":
            srcStat = ownerInit.atk || 0;
            break;
          case "hp":
            srcStat = ownerInit.hp || 0;
            break;
          case "def":
            srcStat = ownerInit.def || 0;
            break;
          case "critRate":
            srcStat = ownerInit.critRate || 0;
            break;
          case "anomalyMastery":
            srcStat = ownerInit.anomalyMastery || 0;
            break;
          case "anomalyProficiency":
            srcStat = ownerInit.anomalyProficiency || 0;
            break;
          case "energyRegen":
            srcStat = ownerInit.energyRegen || 0;
            break;
          case "penRatio":
            srcStat = ownerInit.penRatio || 0;
            break;
          case "impact":
            srcStat = ownerInit.impact || 0;
            break;
          default:
            return;
        }
        const skillLevel = state.skillLevel || 1;
        const skillLevels = cond.skillLevels;
        if (!skillLevels) return;
        const lvlData =
          skillLevels.find((l: any) => l.level === skillLevel) ||
          skillLevels[0];
        if (!lvlData) return;
        const levelBaseBonus =
          lvlData.baseBonus !== undefined
            ? lvlData.baseBonus
            : cond.baseBonus || 0;
        const perUnit = cond.perUnit || 1;
        const perUnitBonus = lvlData.perUnitBonus || 0;
        const threshold = cond.threshold || 0;
        const maxStat = cond.maxStat ?? Infinity;
        const maxBonus = lvlData.maxBonus ?? Infinity;
        let excess = Math.max(0, srcStat - threshold);
        if (maxStat !== Infinity) excess = Math.min(excess, maxStat);
        const units = Math.floor(excess / perUnit);
        const fromStat = units * perUnitBonus;
        const total = levelBaseBonus + fromStat;
        bonusValue = Math.min(total, maxBonus);
      } else if (cond.type === "currentStatBased") {
        const ownerSlot = state.sourceSlot;
        const ownerStats = teamSlotsInfo.find(
          (s) => s.slotIndex === ownerSlot,
        )?.stats;
        if (!ownerStats) return;
        const basedOn = cond.basedOn as string;
        let curStat = 0;
        switch (basedOn) {
          case "atk":
            curStat = ownerStats.atk;
            break;
          case "hp":
            curStat = ownerStats.hp;
            break;
          case "def":
            curStat = ownerStats.def;
            break;
          case "impact":
            curStat = ownerStats.impact;
            break;
          case "critRate":
            curStat = ownerStats.critRate * 100;
            break;
          case "anomalyMastery":
            curStat = ownerStats.anomalyMastery;
            break;
          case "anomalyProficiency":
            curStat = ownerStats.anomalyProficiency;
            break;
          case "energyRegen":
            curStat = ownerStats.energyRegen;
            break;
          case "penRatio":
            curStat = ownerStats.penRatio * 100;
            break;
          default:
            return;
        }
        const threshold = cond.threshold || 0;
        const perUnit = cond.perUnit || 1;
        const perUnitBonus = cond.perUnitBonus || 0;
        const maxBonus = cond.maxBonus ?? Infinity;
        const baseBonus = cond.baseBonus || 0;
        const excess = Math.max(0, curStat - threshold);
        const units = Math.floor(excess / perUnit);
        let bonus = units * perUnitBonus + baseBonus;
        if (maxBonus !== Infinity) bonus = Math.min(bonus, maxBonus);
        bonusValue = bonus;
      }

      if (affectsFlatRaw) flat += bonusValue;
      if (affectsPercentRaw) percent += bonusValue;
    });

    return { flat, percent };
  }, [teamEffects, teamSlotsInfo, agent.id]);

  const excludedTeamPenRatio = useMemo(() => {
    let total = 0;

    if (!teamEffects || !teamSlotsInfo) return total;

    Object.entries(teamEffects).forEach(([effectId, state]) => {
      if (!state?.enabled) return;
      if (state.ownerAgentId === agent.id) return;
      if (REMIELLE_INVITATION_TO_BLOOM_IDS.has(effectId)) return;

      const effect = ingameEffectsRegistry[effectId] as any;
      if (!effect) return;

      const stacks = state.stacks || 1;

      total += (effect.flat?.penRatio || 0) * stacks;
      total += (effect.perStack?.penRatio || 0) * stacks;

      const cond = effect.conditional;
      if (!cond?.affectedStats?.includes("penRatio")) return;

      let bonusValue = 0;

      if (
        cond.type === "initialStatBased" ||
        cond.type === "initialStatBasedDamageBonus"
      ) {
        const ownerInit = state.ownerInitialStats;
        if (!ownerInit) return;
        const basedOn = cond.basedOn as string;
        let srcStat = 0;
        switch (basedOn) {
          case "atk":
            srcStat = ownerInit.atk || 0;
            break;
          case "hp":
            srcStat = ownerInit.hp || 0;
            break;
          case "def":
            srcStat = ownerInit.def || 0;
            break;
          case "critRate":
            srcStat = ownerInit.critRate || 0;
            break;
          case "anomalyMastery":
            srcStat = ownerInit.anomalyMastery || 0;
            break;
          case "anomalyProficiency":
            srcStat = ownerInit.anomalyProficiency || 0;
            break;
          case "energyRegen":
            srcStat = ownerInit.energyRegen || 0;
            break;
          case "penRatio":
            srcStat = ownerInit.penRatio || 0;
            break;
          case "impact":
            srcStat = ownerInit.impact || 0;
            break;
          default:
            return;
        }
        const skillLevel = state.skillLevel || 1;
        const skillLevels = cond.skillLevels;
        if (!skillLevels) return;
        const lvlData =
          skillLevels.find((l: any) => l.level === skillLevel) ||
          skillLevels[0];
        if (!lvlData) return;
        const levelBaseBonus =
          lvlData.baseBonus !== undefined
            ? lvlData.baseBonus
            : cond.baseBonus || 0;
        const perUnit = cond.perUnit || 1;
        const perUnitBonus = lvlData.perUnitBonus || 0;
        const threshold = cond.threshold || 0;
        const maxStat = cond.maxStat ?? Infinity;
        const maxBonus = lvlData.maxBonus ?? Infinity;
        let excess = Math.max(0, srcStat - threshold);
        if (maxStat !== Infinity) excess = Math.min(excess, maxStat);
        const units = Math.floor(excess / perUnit);
        const fromStat = units * perUnitBonus;
        const totalBonus = levelBaseBonus + fromStat;
        bonusValue = Math.min(totalBonus, maxBonus);
      } else if (cond.type === "currentStatBased") {
        const ownerSlot = state.sourceSlot;
        const ownerStats = teamSlotsInfo.find(
          (s) => s.slotIndex === ownerSlot,
        )?.stats;
        if (!ownerStats) return;
        const basedOn = cond.basedOn as string;
        let curStat = 0;
        switch (basedOn) {
          case "atk":
            curStat = ownerStats.atk;
            break;
          case "hp":
            curStat = ownerStats.hp;
            break;
          case "def":
            curStat = ownerStats.def;
            break;
          case "impact":
            curStat = ownerStats.impact;
            break;
          case "critRate":
            curStat = ownerStats.critRate * 100;
            break;
          case "anomalyMastery":
            curStat = ownerStats.anomalyMastery;
            break;
          case "anomalyProficiency":
            curStat = ownerStats.anomalyProficiency;
            break;
          case "energyRegen":
            curStat = ownerStats.energyRegen;
            break;
          case "penRatio":
            curStat = ownerStats.penRatio * 100;
            break;
          default:
            return;
        }
        const threshold = cond.threshold || 0;
        const perUnit = cond.perUnit || 1;
        const perUnitBonus = cond.perUnitBonus || 0;
        const maxBonus = cond.maxBonus ?? Infinity;
        const baseBonus = cond.baseBonus || 0;
        const excess = Math.max(0, curStat - threshold);
        const units = Math.floor(excess / perUnit);
        let bonus = units * perUnitBonus + baseBonus;
        if (maxBonus !== Infinity) bonus = Math.min(bonus, maxBonus);
        bonusValue = bonus;
      }

      total += bonusValue;
    });

    return total;
  }, [teamEffects, teamSlotsInfo, agent.id]);

  const setLuminizeSelectedSkillId = (id: string | null) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      luminizeSelectedSkillId: id,
    }));
  };

  const setLuminizeSkillLevel = (level: number) => {
    onCalculatorStateChange((prev) => ({ ...prev, luminizeSkillLevel: level }));
  };

  const luminizeSkills = useMemo(() => {
    const allSkills = [
      ...(agent.skills?.basicAttacks || []),
      ...(agent.skills?.assistFollowup || []),
      ...(agent.skills?.ultimate || []),
    ];
    return allSkills.filter((skill) =>
      skill.hits.some((hit) => hit.name === "Luminize Multiplier"),
    );
  }, [agent]);

  useEffect(() => {
    if (luminizeSkills.length > 0 && !luminizeSelectedSkillId) {
      setLuminizeSelectedSkillId(luminizeSkills[0].id);
    }
  }, [luminizeSkills, luminizeSelectedSkillId]);

  const selectedSkill = luminizeSkills.find(
    (s) => s.id === luminizeSelectedSkillId,
  );

  const getLuminizeMultiplier = (): number => {
    if (!selectedSkill) return 0;
    const levelData = selectedSkill.levels.find(
      (l) => l.level === luminizeSkillLevel,
    );
    if (!levelData) return 0;
    const hitIndex = selectedSkill.hits.findIndex(
      (hit) => hit.name === "Luminize Multiplier",
    );
    if (hitIndex === -1) return 0;
    return levelData.multipliers[hitIndex] / 100;
  };

  const sourceSlotInfo = teamSlotsInfo.find(
    (s) => s.slotIndex === luminizeSourceSlot,
  );
  const sourceAgent = sourceSlotInfo?.agent;
  const sourceAttribute = sourceAgent?.attribute?.toLowerCase() || "physical";
  const getAnomalyType = (attr: string): string => {
    const def = ANOMALY_DEFINITIONS[attr];
    return def?.anomalyType || attr;
  };

  const getSourceEffectiveDef = (): number | null => {
    if (!selectedEnemy || !sourceSlotInfo?.stats) return null;
    const enemyDef = selectedEnemy.stats.def;

    let shredTotal = 0;
    Object.entries(activeEffects).forEach(([effectId, state]) => {
      if (!state.enabled) return;
      const effect = ingameEffectsRegistry[effectId];
      if (!effect) return;
      const stacks = state.stacks || 1;
      if (effect.flat?.defShred) shredTotal += effect.flat.defShred * stacks;
      if (effect.perStack?.defShred)
        shredTotal += effect.perStack.defShred * stacks;
    });
    shredTotal = Math.min(shredTotal, 1);

    const penRatio = sourceSlotInfo.stats.penRatio || 0;
    const penFlat = sourceSlotInfo.stats.pen || 0;
    const afterShred = enemyDef * (1 - shredTotal);
    const afterPen = Math.max(0, afterShred * (1 - penRatio) - penFlat);
    return Math.round(afterPen);
  };

  const voidflareData = useMemo(() => {
    if (luminizeSourceSlot === null) return null;

    const isSelfLuminize =
      luminizeSourceSlot === currentSlotIndex &&
      isRemielleMS1Active &&
      selfLuminizeEnabled;

    if (isSelfLuminize) {
      const level = (agent as any).level || 60;
      const levelFactor = 1 + level * SELF_LUMINIZE_LEVEL_COEFFICIENT;
      const refringe =
        anomalyBonuses?.breakdown?.totalRefringe ??
        unifiedStats._refringeCoefficient ??
        0;
      const apMultiplier = unifiedStats.anomalyProficiency / 100;

      const rawAtk = unifiedStats.atk;
      const atk =
        excludedTeamAtk.percent !== 0
          ? (rawAtk - excludedTeamAtk.flat) / (1 + excludedTeamAtk.percent)
          : rawAtk - excludedTeamAtk.flat;

      const voidflare =
        atk *
        apMultiplier *
        SELF_LUMINIZE_BUFF_LEVEL *
        levelFactor *
        (1 + refringe);

      const fluxedElement =
        calculatorState.fluxedAttributes?.[currentSlotIndex] || null;
      const anomalyType = fluxedElement
        ? getAnomalyType(fluxedElement)
        : "lumiflux";

      return {
        voidflare,
        sourceAnomalyDamage: voidflare,
        anomalyType,
        baseMultiplier: 1,
        sourceName: agent.displayName || agent.name,
        isSelfLuminize: true,
      };
    }

    if (!slotAnomalyResults[luminizeSourceSlot]) return null;
    const anomalyResult = slotAnomalyResults[luminizeSourceSlot]?.anomalyResult;
    if (!anomalyResult) return null;
    let sourceAnomalyDamage = 0;
    if (anomalyResult.buffMod && anomalyResult.buffMod > 0) {
      sourceAnomalyDamage =
        (anomalyResult.realDamage || 0) / anomalyResult.buffMod;
    } else {
      sourceAnomalyDamage = anomalyResult.realDamage || 0;
    }
    const anomalyType = getAnomalyType(sourceAttribute);
    const baseMultiplier =
      ANOMALY_DEFINITIONS[sourceAttribute]?.baseMultiplier || 1;
    const voidflare = sourceAnomalyDamage / baseMultiplier;
    return {
      voidflare,
      sourceAnomalyDamage,
      anomalyType,
      baseMultiplier,
      sourceName: sourceSlotInfo?.agentName || "Unknown",
      isSelfLuminize: false,
    };
  }, [
    luminizeSourceSlot,
    slotAnomalyResults,
    sourceAttribute,
    sourceSlotInfo,
    currentSlotIndex,
    isRemielleMS1Active,
    selfLuminizeEnabled,
    unifiedStats,
    agent,
    calculatorState.fluxedAttributes,
    excludedTeamAtk,
  ]);

  const result = useMemo(() => {
    if (!voidflareData || !selectedSkill || !selectedEnemy) return null;
    const {
      voidflare,
      sourceName,
      anomalyType,
      sourceAnomalyDamage,
      baseMultiplier,
      isSelfLuminize,
    } = voidflareData;
    const baseLuminizeMult = getLuminizeMultiplier();
    const luminizeBonus = unifiedStats._luminizeMultiplierBonus || 0;
    const totalLuminizeMult = baseLuminizeMult * (1 + luminizeBonus);
    let anomalyFactor = 1 + (anomalyBonuses?.anomalyDmgBonus || 0);

    if (isSelfLuminize) {
      const plState = activeEffects[REMIELLE_PARADISE_LOST_ANOMALY_DMG_ID];
      if (plState?.enabled) {
        const plEffect = ingameEffectsRegistry[
          REMIELLE_PARADISE_LOST_ANOMALY_DMG_ID
        ] as any;
        const ocLevel = (plState as any).overclockLevel || 1;
        const level =
          plEffect?.wEngineOverclock?.levels?.find(
            (l: any) => l.level === ocLevel,
          ) || plEffect?.wEngineOverclock?.levels?.[0];
        if (level?.damageBonuses) {
          const stacks = plState.stacks || 1;
          const excluded =
            level.damageBonuses
              .filter((b: any) => b.type === "anomalyDmgBonus")
              .reduce((sum: number, b: any) => sum + (b.value || 0), 0) *
            stacks;
          if (excluded > 0) {
            anomalyFactor = Math.max(1, anomalyFactor - excluded);
          }
        }
      }
    }

    let rawDamage = voidflare * totalLuminizeMult * anomalyFactor;

    let defMultiplier = 1;
    let effectiveDef = 0;
    if (isSelfLuminize) {
      let defShredTotal = 0;
      Object.entries(activeEffects).forEach(([effectId, state]) => {
        if (!state.enabled) return;
        if (effectId === REMIELLE_MS2_DEF_SHRED_EFFECT_ID) return;
        const effect = ingameEffectsRegistry[effectId];
        if (!effect) return;
        const stacks = state.stacks || 1;
        if (effect.flat?.defShred)
          defShredTotal += effect.flat.defShred * stacks;
        if (effect.perStack?.defShred)
          defShredTotal += effect.perStack.defShred * stacks;
      });
      defShredTotal = Math.min(defShredTotal, 1);

      const enemyDef = selectedEnemy.stats.def;
      const penRatio = Math.max(
        0,
        (unifiedStats.penRatio || 0) - excludedTeamPenRatio,
      );
      const penFlat = unifiedStats.pen || 0;
      const afterShred = enemyDef * (1 - defShredTotal);
      const afterPen = Math.max(0, afterShred * (1 - penRatio) - penFlat);
      effectiveDef = afterPen;
      defMultiplier = SELF_LUMINIZE_ALC / (SELF_LUMINIZE_ALC + afterPen);
      rawDamage = rawDamage * defMultiplier;
    }

    let resMultiplier = 1;
    if (selectedEnemy) {
      const fluxedElement =
        calculatorState.fluxedAttributes?.[currentSlotIndex];
      const resElement = isSelfLuminize
        ? fluxedElement || "lumiflux"
        : sourceAttribute;

      if (isSelfLuminize && resElement === "lumiflux") {
        let lumifluxShred = 0;
        Object.entries(activeEffects).forEach(([effectId, state]) => {
          if (!state.enabled) return;
          const effect = ingameEffectsRegistry[effectId];
          if (!effect) return;
          if (effect.condition?.appliesToLuminize === false) return;
          if (
            effect.condition?.damageType &&
            effect.condition.damageType !== "lumiflux"
          ) {
            return;
          }
          const stacks = state.stacks || 1;
          const flat = (effect.flat?.fireResShred ?? 0) * stacks;
          const perStack = (effect.perStack?.fireResShred ?? 0) * stacks;
          lumifluxShred += flat + perStack;
        });
        lumifluxShred = Math.min(lumifluxShred, 1);
        resMultiplier = 1 - (0 - lumifluxShred);
      } else {
        const resCalc = calculateElementalResistance(
          selectedEnemy,
          resElement,
          activeEffects,
          undefined,
          undefined,
          false,
          false,
          true,
        );
        resMultiplier = resCalc.damageMultiplier;
      }
    }
    const damageAfterRes = Math.round(rawDamage * resMultiplier);
    const finalDamage = Math.round(damageAfterRes * (1 + stunMultiplier / 100));
    return {
      voidflare,
      sourceName,
      anomalyType,
      sourceAnomalyDamage,
      baseMultiplier,
      baseLuminizeMult,
      luminizeBonus,
      totalLuminizeMult,
      anomalyFactor,
      resMultiplier,
      rawDamage,
      damageAfterRes,
      finalDamage,
      stunMultiplier,
      isSelfLuminize,
      defMultiplier,
      effectiveDef,
    };
  }, [
    voidflareData,
    selectedSkill,
    selectedEnemy,
    unifiedStats,
    damageBonuses,
    anomalyBonuses,
    stunMultiplier,
    activeEffects,
    getLuminizeMultiplier,
    sourceAttribute,
    calculatorState.fluxedAttributes,
    currentSlotIndex,
    excludedTeamPenRatio,
  ]);

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-US");

  const sourceOptionsBase = teamSlotsInfo
    .filter((s) => s.slotIndex !== currentSlotIndex && s.agentName !== "Empty")
    .map((s) => {
      const attr = s.agent?.attribute?.toLowerCase() || "unknown";
      const def = ANOMALY_DEFINITIONS[attr];
      return {
        value: String(s.slotIndex),
        label: `Slot ${s.slotIndex + 1}: ${s.agentName} (${formatAnomalyType(def?.anomalyType || attr)})`,
      };
    });

  const sourceOptions =
    isRemielleMS1Active && selfLuminizeEnabled
      ? [
          {
            value: String(currentSlotIndex),
            label: `Slot ${currentSlotIndex + 1}: ${agent.displayName || agent.name} (Luminize)`,
          },
          ...sourceOptionsBase,
        ]
      : sourceOptionsBase;

  const skillOptions = luminizeSkills.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div style={{ "--theme": theme } as React.CSSProperties}>
      <div className="calculator-calculator_title">
        <p className="slot-agent_stats-title">LUMINIZE CALCULATOR</p>
        <div className="slot-divider" />
      </div>

      <div className="skill_selector-main_wrapper">
        <div className="skill_selector-header">
          <label>Voidflare Source:</label>
        </div>
        <div className="skill_selector-neon_wrapper">
          <NeonSelect
            value={
              luminizeSourceSlot !== null
                ? sourceOptions.find(
                    (o) => o.value === String(luminizeSourceSlot),
                  )?.label
                : "Select a source..."
            }
            options={sourceOptions}
            onChange={(value) => setLuminizeSourceSlot(Number(value))}
            theme={theme}
            variant="enemy"
          />
        </div>

        <div className="skill_selector-header" style={{ marginTop: 12 }}>
          <label>Luminize Skill:</label>
        </div>
        <div className="skill_selector-neon_wrapper">
          <NeonSelect
            value={selectedSkill?.name || "Select a skill..."}
            options={skillOptions}
            onChange={(value) => setLuminizeSelectedSkillId(value)}
            theme={theme}
            variant="enemy"
          />
        </div>

        <div className="skill_selector-level_setter" style={{ marginTop: 12 }}>
          <label className="skill_selector-header">Luminize Skill Level:</label>
          <div className="skill_selector-buttons_container">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((level) => {
              const isAvailable =
                selectedSkill?.levels.some((l) => l.level === level) ?? false;
              const isSelected = luminizeSkillLevel === level;
              const isActive =
                isSelected || (isAvailable && level < luminizeSkillLevel);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    if (isAvailable) setLuminizeSkillLevel(level);
                  }}
                  disabled={!isAvailable}
                  className="skill_selector-level_buttons"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${theme}, ${theme}aa)`
                      : isAvailable
                        ? "#414141"
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

        <div className="skill_selector-description">
          <p className="luminize-description-text">
            Multiplier:
            {(getLuminizeMultiplier() * 100).toFixed(1)}% (Lv.{" "}
            {luminizeSkillLevel})
            {result && result.luminizeBonus > 0 && (
              <span style={{ color: theme }}>
                {" "}
                +{" "}
                {(
                  (result.totalLuminizeMult - result.baseLuminizeMult) *
                  100
                ).toFixed(1)}
                % bonus
              </span>
            )}
          </p>
        </div>
        {isRemielleMS1Active && (
          <div
            className="maim-mindscape-row"
            style={{ "--theme": theme } as React.CSSProperties}
          >
            <input
              type="checkbox"
              id="remielle-ms1-self-luminize-checkbox"
              checked={selfLuminizeEnabled}
              onChange={(e) => setSelfLuminizeEnabled(e.target.checked)}
            />
            <label
              htmlFor="remielle-ms1-self-luminize-checkbox"
              className="maim-checkbox-box"
            />
            <span className="maim-checkbox-label">
              <span className="highlight-ms1">Mindscape Cinema N°1: </span>{" "}
              Enable Remielle's Special Voidflares
            </span>
          </div>
        )}
      </div>

      {result ? (
        <div className="anomaly_summary-main_wrapper" style={{ marginTop: 16 }}>
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="/resources/images/icons/attributes/Lumiflux.png"
                alt="Lumiflux"
                className="anomaly-attribute-icon"
              />
              <span className="anomaly-title-text">
                {agent.displayName}'s Luminize DMG
              </span>
            </div>
          </div>

          <div className="anomaly-grid">
            <div className="anomaly-grid-header-row">
              <div className="anomaly-header-cell step">#</div>
              <div className="anomaly-header-cell calculation">Calculation</div>
              <div className="anomaly-header-cell before">Before</div>
              <div className="anomaly-header-cell arrow">→</div>
              <div className="anomaly-header-cell after">After</div>
            </div>

            {/* ① Voidflare */}
            {result.isSelfLuminize ? (
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">①</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Voidflare (Self)</span>
                  <span className="calc-detail">
                    ATK × (AP/100) × 2.0 ×{" "}
                    {(
                      1 +
                      ((agent as any).level || 60) *
                        SELF_LUMINIZE_LEVEL_COEFFICIENT
                    ).toFixed(1)}{" "}
                    × (1 + Refringe)
                  </span>
                </div>
                <div className="anomaly-row-cell before">---</div>
                <div className="anomaly-row-cell arrow">=</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {formatNumber(result.voidflare)}
                </div>
              </div>
            ) : (
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">①</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Voidflare</span>
                  <span className="calc-detail">
                    {result.sourceName}'s{" "}
                    {formatAnomalyType(result.anomalyType)} /{" "}
                    {result.baseMultiplier}
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {formatNumber(result.sourceAnomalyDamage)}
                </div>
                <div className="anomaly-row-cell arrow">÷</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {formatNumber(result.voidflare)}
                </div>
              </div>
            )}

            {/* ② Luminize Multiplier */}
            <div className="anomaly-grid-row highlight-row">
              <div className="anomaly-row-cell step">②</div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Luminize Multiplier</span>
                <span className="calc-detail">
                  {(result.baseLuminizeMult * 100).toFixed(1)}% ×{" "}
                  {(1 + result.luminizeBonus) * 100}%
                </span>
              </div>
              <div className="anomaly-row-cell before">
                {formatNumber(result.voidflare)}
              </div>
              <div className="anomaly-row-cell arrow">×</div>
              <div className="anomaly-row-cell after highlight-bonus">
                {formatNumber(result.voidflare * result.totalLuminizeMult)}
              </div>
            </div>

            {/* ③ Anomaly DMG Factor */}
            {result.anomalyFactor !== 1 && (
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">③</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Anomaly DMG Factor</span>
                  <span className="calc-detail">
                    +{((result.anomalyFactor - 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {formatNumber(result.voidflare * result.totalLuminizeMult)}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-bonus">
                  {formatNumber(
                    result.voidflare *
                      result.totalLuminizeMult *
                      result.anomalyFactor,
                  )}
                </div>
              </div>
            )}
            {/* ④ DEF Multiplier (solo Self) */}
            {result.isSelfLuminize && (
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">④</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">DEF Multiplier</span>
                  <span className="calc-detail">
                    {SELF_LUMINIZE_ALC} / ({SELF_LUMINIZE_ALC} +{" "}
                    {formatNumber(result.effectiveDef)})
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {formatNumber(
                    result.voidflare *
                      result.totalLuminizeMult *
                      result.anomalyFactor,
                  )}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {result.defMultiplier.toFixed(4)}×
                </div>
              </div>
            )}

            {/* ⑤ Resistance Factor */}
            <div className="anomaly-grid-row">
              <div className="anomaly-row-cell step">
                {result.isSelfLuminize ? "⑤" : "④"}
              </div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Resistance Factor</span>
                <span className="calc-detail">
                  {((1 - result.resMultiplier) * 100).toFixed(1)}% RES
                </span>
              </div>
              <div className="anomaly-row-cell before">
                {formatNumber(
                  result.isSelfLuminize
                    ? result.voidflare *
                        result.totalLuminizeMult *
                        result.anomalyFactor *
                        result.defMultiplier
                    : result.voidflare *
                        result.totalLuminizeMult *
                        result.anomalyFactor,
                )}
              </div>
              <div className="anomaly-row-cell arrow">×</div>
              <div className="anomaly-row-cell after highlight-bonus">
                {formatNumber(result.damageAfterRes)}
              </div>
            </div>

            {result.stunMultiplier > 0 && (
              <div className="anomaly-grid-row stun-row">
                <div className="anomaly-row-cell step">
                  {result.isSelfLuminize ? "⑥" : "⑤"}
                </div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Stun</span>
                  <span className="calc-detail">+{result.stunMultiplier}%</span>
                </div>
                <div className="anomaly-row-cell before">
                  {formatNumber(result.damageAfterRes)}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-stun">
                  {formatNumber(result.finalDamage)}
                </div>
              </div>
            )}

            {/* Total final */}
            <div className="anomaly-grid-total-row">
              <div className="anomaly-row-cell step">☑</div>
              <div className="anomaly-row-cell calculation">
                <span className="total-label">Final Luminize DMG</span>
                <span className="total-target">
                  vs {selectedEnemy?.name} (DEF:{" "}
                  {getSourceEffectiveDef() ?? "—"})
                </span>
              </div>
              <div className="anomaly-row-cell before" />
              <div className="anomaly-row-cell arrow">=</div>
              <div className="anomaly-row-cell after total-value">
                {formatNumber(result.finalDamage)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="skill_selector-main_wrapper">
          <div className="extra-panel-empty ">
            <p>Select a Voidflare source and a Luminize skill</p>
            <p className="extra-panel-empty-sub">
              The source must be another squad member
            </p>
          </div>{" "}
        </div>
      )}
    </div>
  );
}
