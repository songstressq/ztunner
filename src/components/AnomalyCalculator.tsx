import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { UnifiedStats, Agent } from "@/types/Agent";
import type { Enemy } from "@/types/Enemy";
import type { AttributeType } from "@/types/Anomaly";
import { ANOMALY_DEFINITIONS } from "@/types/Anomaly";
import {
  calculateAnomalyDamage,
  calculateDisorderDamage,
  calculatePolarityDisorderDamage,
  calculateVortexDamage,
} from "@/utils/anomalyCalculator";
import { collectAnomalyBonuses } from "@/utils/anomalyBonusCollector";
import { collectDamageBonuses } from "@/utils/damageBonusCollector";
import { agents } from "@/data/agents";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";
import AnomalyBonusesPanel from "./AnomalyBonusesPanel";
import NeonSelect from "@/components/NeonSelect";
import type { CollectedBonuses } from "@/utils/damageBonusCollector";
import {
  defaultCalculatorState,
  type CalculatorUIState,
} from "@/context/SessionContext";

interface Props {
  agent: Agent;
  agentAttribute: AttributeType;
  unifiedStats: UnifiedStats;
  selectedEnemy: Enemy | null;
  totalBonusDamage: number;
  stunMultiplier: number;
  calculateRealDamage: (
    damage: number,
    damageType: string,
    damageSubtype: string | undefined,
    skillId: string,
    skillType: string,
    hitIndex: number,
    hitName: string,
    additionalDefShred?: number,
    additionalPenRatio?: number,
    isAnomaly?: boolean,
    isVortex?: boolean,
    overridePenRatio?: number,
    overridePenFlat?: number,
    isLuminize?: boolean,
    isAnomalyDefShredOnly?: boolean,
  ) => number;
  teamSlotsInfo?: Array<{
    slotIndex: number;
    agentName: string;
    attribute: string;
    stats?: UnifiedStats;
    activeEffects?: Record<string, { enabled: boolean; stacks: number }>;
    agent?: Agent;
  }>;
  slotStatsMap?: Record<number, UnifiedStats>;
  currentSlotIndex: number;
  allEffects: any[];
  activeEffects: Record<
    string,
    {
      enabled: boolean;
      stacks: number;
      skillLevel?: number;
      ownerAgentId?: string;
    }
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
  damageBonuses?: CollectedBonuses;
  onResultChange?: (results: { anomaly: any; disorder: any }) => void;
  slotAnomalyResults?: Record<number, any>;
  calculatorState: CalculatorUIState;
  onCalculatorStateChange: (
    updater: (prev: CalculatorUIState) => CalculatorUIState,
  ) => void;
}

export default function AnomalyCalculator({
  agent,
  agentAttribute,
  unifiedStats,
  selectedEnemy,
  totalBonusDamage,
  stunMultiplier,
  calculateRealDamage,
  teamSlotsInfo = [],
  slotStatsMap = {},
  currentSlotIndex,
  allEffects,
  activeEffects,
  teamEffects,
  damageBonuses,
  onResultChange,
  slotAnomalyResults,
  calculatorState,
  onCalculatorStateChange,
}: Props) {
  const {
    disorderTimeRemaining,
    disorderSelectedAttribute,
    vortexSourceSlot,
    vortexTimeRemaining,
    aliceTimeRemaining,
    aliceDisorderSelectedAttribute,
    aliceAssaultSourceSlot,
    yanagiPolaritySource,
    nangongPolaritySource,
    yanagiPolarityTimeRemaining = 10,
    nangongPolarityTimeRemaining = 10,
  } = calculatorState;

  const setTimeRemaining = (value: number) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      disorderTimeRemaining: value,
    }));
  };

  const setSelectedDisorderOption = (value: string) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      disorderSelectedAttribute: value,
    }));
  };

  const setVortexSourceSlot = (slot: number | null) => {
    onCalculatorStateChange((prev) => ({ ...prev, vortexSourceSlot: slot }));
  };

  const setVortexTimeRemaining = (value: number) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      vortexTimeRemaining: value,
    }));
  };

  const setAliceTimeRemaining = (value: number) => {
    onCalculatorStateChange((prev) => ({ ...prev, aliceTimeRemaining: value }));
  };

  const setAliceSelectedDisorderOption = (value: string) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      aliceDisorderSelectedAttribute: value,
    }));
  };

  const setAliceAssaultSourceSlot = (slot: number | null) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      aliceAssaultSourceSlot: slot,
    }));
  };

  const setYanagiPolarityTimeRemaining = (value: number) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      yanagiPolarityTimeRemaining: value,
    }));
  };
  const setNangongPolarityTimeRemaining = (value: number) => {
    onCalculatorStateChange((prev) => ({
      ...prev,
      nangongPolarityTimeRemaining: value,
    }));
  };

  const getPolarityOptions = useCallback(() => {
    const options: Array<{
      slotIndex: number;
      attribute: AttributeType;
      agentName: string;
      agentId: string;
      label: string;
      isSelf?: boolean;
    }> = [];

    if (agent.id === "yanagi") {
      const selfAttribute = agent.anomalyAttribute?.type || agentAttribute;
      options.push({
        slotIndex: currentSlotIndex,
        attribute: selfAttribute as AttributeType,
        agentName: agent.displayName || agent.name,
        agentId: agent.id,
        label: `${agent.displayName || agent.name} (Shock)`,
        isSelf: true,
      });
    }

    teamSlotsInfo
      .filter(
        (slot) =>
          slot.slotIndex !== currentSlotIndex &&
          slot.agentName !== "Empty" &&
          slot.attribute,
      )
      .forEach((slot) => {
        const otherAgent = agents.find(
          (a) => a.displayName === slot.agentName || a.name === slot.agentName,
        );
        let attr = slot.attribute?.toLowerCase() as AttributeType;
        if (otherAgent?.anomalyAttribute) {
          attr = otherAgent.anomalyAttribute.type as AttributeType;
        }
        const def = ANOMALY_DEFINITIONS[attr];
        options.push({
          slotIndex: slot.slotIndex,
          attribute: attr,
          agentName: slot.agentName,
          agentId: otherAgent?.id || "",
          label: `${slot.agentName} (${def?.anomalyType || attr})`,
          isSelf: false,
        });
      });

    return options;
  }, [agent, currentSlotIndex, teamSlotsInfo, agentAttribute]);

  const [localYanagiSource, setLocalYanagiSource] = useState<{
    slotIndex: number;
    attribute: AttributeType;
    agentName: string;
    agentId: string;
    isSelf?: boolean;
  } | null>(() => {
    if (!yanagiPolaritySource) return null;
    const [slotIndex, attribute, self] = yanagiPolaritySource.split(":");
    const option = getPolarityOptions().find(
      (opt) =>
        opt.slotIndex === parseInt(slotIndex) &&
        opt.attribute === attribute &&
        (opt.isSelf || false) === (self === "self"),
    );
    return option || null;
  });

  const [localNangongSource, setLocalNangongSource] = useState<{
    slotIndex: number;
    attribute: AttributeType;
    agentName: string;
    agentId: string;
  } | null>(() => {
    if (!nangongPolaritySource) return null;
    const [slotIndex, attribute] = nangongPolaritySource.split(":");
    const option = getPolarityOptions().find(
      (opt) =>
        opt.slotIndex === parseInt(slotIndex) && opt.attribute === attribute,
    );
    return option || null;
  });

  const setYanagiPolaritySource = (
    value: {
      slotIndex: number;
      attribute: AttributeType;
      agentName: string;
      agentId: string;
      isSelf?: boolean;
    } | null,
  ) => {
    setLocalYanagiSource(value);
    onCalculatorStateChange((prev) => ({
      ...prev,
      yanagiPolaritySource: value
        ? `${value.slotIndex}:${value.attribute}${value.isSelf ? ":self" : ""}`
        : null,
    }));
  };

  const setNangongPolaritySource = (
    value: {
      slotIndex: number;
      attribute: AttributeType;
      agentName: string;
      agentId: string;
    } | null,
  ) => {
    setLocalNangongSource(value);
    onCalculatorStateChange((prev) => ({
      ...prev,
      nangongPolaritySource: value
        ? `${value.slotIndex}:${value.attribute}`
        : null,
    }));
  };

  const emptyDisorderResult = {
    timeRemaining: 0,
    timePassed: 0,
    multiplier: 0,
    damage: 0,
    realDamage: 0,
    previousAttribute: "—",
    totalBonusDamageUsed: 0,
    sourceAtk: 0,
  };
  const [anomalyResult, setAnomalyResult] = useState<any>(null);
  const [disorderResult, setDisorderResult] =
    useState<any>(emptyDisorderResult);
  const [showDisorderSection, setShowDisorderSection] = useState(true);
  const [showVortexSection, setShowVortexSection] = useState(true);
  const [showBorrowedVortex, setShowBorrowedVortex] = useState(false);
  const [vortexResult, setVortexResult] = useState<any>(null);
  const [selectedPreviousAttribute, setSelectedPreviousAttribute] = useState<
    AttributeType | string
  >(() => {
    if (disorderSelectedAttribute) {
      const isCurrent = disorderSelectedAttribute.startsWith("current:");
      let attr = disorderSelectedAttribute.includes(":")
        ? disorderSelectedAttribute.split(":")[1]
        : disorderSelectedAttribute;
      if (isCurrent) {
        attr = disorderSelectedAttribute.replace("current:", "");
      }
      if (attr && ANOMALY_DEFINITIONS[attr]) {
        return attr as AttributeType;
      }
    }
    return agent.anomalyAttribute?.type || agentAttribute;
  });
  const [aliceSelectedPreviousAttribute, setAliceSelectedPreviousAttribute] =
    useState<AttributeType | string>(() => {
      if (aliceDisorderSelectedAttribute) {
        const isCurrent = aliceDisorderSelectedAttribute.startsWith("current:");
        let attr = aliceDisorderSelectedAttribute.includes(":")
          ? aliceDisorderSelectedAttribute.split(":")[1]
          : aliceDisorderSelectedAttribute;
        if (isCurrent) {
          attr = aliceDisorderSelectedAttribute.replace("current:", "");
        }
        if (attr && ANOMALY_DEFINITIONS[attr]) {
          return attr as AttributeType;
        }
      }
      return agent.anomalyAttribute?.type || agentAttribute;
    });
  const [aliceDisorderResult, setAliceDisorderResult] = useState<any>(null);

  const getAnomalyDefinition = () => {
    if (agent.anomalyAttribute) {
      return ANOMALY_DEFINITIONS[agent.anomalyAttribute.type];
    }
    return ANOMALY_DEFINITIONS[agentAttribute];
  };
  const definition = getAnomalyDefinition();

  const getAttributeForDmgBonus = () => {
    if (agent.anomalyAttribute?.parentAttribute) {
      return agent.anomalyAttribute.parentAttribute;
    }
    return agentAttribute;
  };
  const attributeForDmg = getAttributeForDmgBonus();
  const isWindAgent = agent.attribute.toLowerCase() === "wind";

  const realTimeOwnerStats = useMemo(() => {
    const statsMap: Record<string, UnifiedStats> = {};
    if (!teamSlotsInfo) return statsMap;
    Object.entries(activeEffects).forEach(([effectId, state]) => {
      if (!state?.enabled || !state.ownerAgentId) return;
      let ownerSlot = teamSlotsInfo.find(
        (slot) => slot.agentName === state.ownerAgentId,
      );
      if (!ownerSlot) {
        const agentData = agents.find(
          (a) =>
            a.id === state.ownerAgentId ||
            a.name === state.ownerAgentId ||
            a.displayName === state.ownerAgentId,
        );
        if (agentData) {
          ownerSlot = teamSlotsInfo.find(
            (slot) =>
              slot.agentName === agentData.displayName ||
              slot.agentName === agentData.name,
          );
        }
      }
      if (ownerSlot?.stats) {
        statsMap[effectId] = ownerSlot.stats;
      }
    });
    if (teamEffects) {
      Object.entries(teamEffects).forEach(([effectId, effectState]) => {
        if (!effectState?.enabled || !effectState.ownerAgentId) return;
        if (statsMap[effectId]) return;
        let ownerSlot = teamSlotsInfo.find(
          (slot) => slot.agentName === effectState.ownerAgentId,
        );
        if (!ownerSlot) {
          const agentData = agents.find(
            (a) =>
              a.id === effectState.ownerAgentId ||
              a.name === effectState.ownerAgentId ||
              a.displayName === effectState.ownerAgentId,
          );
          if (agentData) {
            ownerSlot = teamSlotsInfo.find(
              (slot) =>
                slot.agentName === agentData.displayName ||
                slot.agentName === agentData.name,
            );
          }
        }
        if (ownerSlot?.stats) {
          statsMap[effectId] = ownerSlot.stats;
        }
      });
    }
    return statsMap;
  }, [teamSlotsInfo, activeEffects, teamEffects]);

  const anomalyBonuses = useMemo(() => {
    return collectAnomalyBonuses(
      allEffects,
      activeEffects,
      unifiedStats,
      unifiedStats,
      realTimeOwnerStats,
      {},
      agent.id,
      selectedPreviousAttribute as AttributeType,
    );
  }, [
    JSON.stringify(allEffects?.map((e) => e.id).sort()),
    JSON.stringify(
      Object.entries(activeEffects)
        .filter(([_, v]) => v.enabled)
        .map(([id, v]) => `${id}:${v.stacks}`)
        .sort(),
    ),
    unifiedStats.anomalyMastery,
    unifiedStats.anomalyProficiency,
    unifiedStats.hp,
    unifiedStats.atk,
    unifiedStats.def,
    unifiedStats.impact,
    unifiedStats.critRate,
    unifiedStats.energyRegen,
    unifiedStats.penRatio,
    JSON.stringify(realTimeOwnerStats),
    selectedPreviousAttribute,
  ]);

  const computedTotalBonusDamage = useMemo(() => {
    let total =
      (unifiedStats.attributeDmgBonus[
        attributeForDmg as keyof typeof unifiedStats.attributeDmgBonus
      ] || 0) + totalBonusDamage;
    return total;
  }, [unifiedStats, attributeForDmg, totalBonusDamage]);

  const handleAliceDisorderChange = useCallback((value: string) => {
    setAliceSelectedDisorderOption(value);
    if (!value || value === "none") {
      setAliceSelectedPreviousAttribute(
        agent.anomalyAttribute?.type || agentAttribute,
      );
      setAliceDisorderResult(null);
      setAliceSelectedDisorderOption("none");
      return;
    }
    if (value.startsWith("current:")) {
      const attribute = value.replace("current:", "");
      setAliceSelectedPreviousAttribute(attribute);
    } else if (value.includes(":")) {
      const [, attribute] = value.split(":");
      setAliceSelectedPreviousAttribute(attribute);
    }
  }, []);

  const getAliceDisorderOptions = useCallback(() => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> =
      [];

    options.push({ value: "none", label: "None" });

    const currentAttribute = agent.anomalyAttribute?.type || agentAttribute;

    const isValidAnomalyAttribute = (attr: string): boolean => {
      if (!attr) return false;
      const lower = attr.toLowerCase();
      if (lower === "lumiflux" || lower === "wind") return false;
      return !!ANOMALY_DEFINITIONS[lower];
    };

    if (isValidAnomalyAttribute(currentAttribute)) {
      options.push({
        value: `current:${currentAttribute}`,
        label: `${definition.anomalyType.toUpperCase()} (current agent)`,
      });
    }

    teamSlotsInfo
      .filter(
        (slot) =>
          slot.slotIndex !== currentSlotIndex &&
          slot.agentName !== "Empty" &&
          slot.attribute,
      )
      .forEach((slot) => {
        const otherAgent = agents.find(
          (a) => a.displayName === slot.agentName || a.name === slot.agentName,
        );
        let otherAttribute = slot.attribute?.toLowerCase() || "unknown";
        if (otherAgent?.anomalyAttribute) {
          otherAttribute = otherAgent.anomalyAttribute.type;
        }
        if (isValidAnomalyAttribute(otherAttribute)) {
          const otherDef = ANOMALY_DEFINITIONS[otherAttribute];
          options.push({
            value: `${slot.slotIndex}:${otherAttribute}`,
            label: `Slot ${slot.slotIndex + 1}: ${slot.agentName} (${otherDef?.anomalyType || otherAttribute})`,
          });
        }
      });

    return options;
  }, [teamSlotsInfo, currentSlotIndex, agent, definition, agentAttribute]);

  const getWindSlotsOptions = useCallback(() => {
    const options: Array<{
      slotIndex: number;
      agentName: string;
      attribute: string;
      label: string;
    }> = [];
    teamSlotsInfo?.forEach((slot) => {
      if (slot.attribute?.toLowerCase() === "wind") {
        options.push({
          slotIndex: slot.slotIndex,
          agentName: slot.agentName,
          attribute: slot.attribute,
          label: `Slot ${slot.slotIndex + 1}: ${slot.agentName} (Wind)`,
        });
      }
    });
    return options;
  }, [teamSlotsInfo]);

  const getSourceStatsAndBonuses = useCallback(
    (sourceSlotIndex: number, attribute: AttributeType) => {
      let sourceStats = unifiedStats;
      let sourceTotalBonusDamage = computedTotalBonusDamage;
      let sourceAnomalyBonuses = anomalyBonuses;
      let sourceDamageBonuses = damageBonuses;
      const isSelf = sourceSlotIndex === currentSlotIndex;
      if (!isSelf) {
        const sourceSlotInfo = teamSlotsInfo?.find(
          (s) => s.slotIndex === sourceSlotIndex,
        );
        if (
          sourceSlotInfo?.stats &&
          sourceSlotInfo.activeEffects &&
          sourceSlotInfo.agent
        ) {
          sourceStats = sourceSlotInfo.stats;
          const otherActiveEffects = sourceSlotInfo.activeEffects || {};
          const otherAllEffects = Object.keys(otherActiveEffects)
            .filter((id) => otherActiveEffects[id]?.enabled)
            .map((id) => ingameEffectsRegistry[id])
            .filter(Boolean);
          sourceAnomalyBonuses = collectAnomalyBonuses(
            otherAllEffects,
            otherActiveEffects,
            sourceStats,
            sourceStats,
            {},
            {},
            sourceSlotInfo.agent.id,
            attribute,
          );
          sourceDamageBonuses = collectDamageBonuses(
            otherAllEffects,
            otherActiveEffects,
            {},
            {},
            sourceStats,
            {},
            teamEffects,
            sourceSlotInfo.agent.id,
          );
          const baseAttrBonus =
            sourceStats.attributeDmgBonus[
              attribute as keyof typeof sourceStats.attributeDmgBonus
            ] ?? 0;
          const globalBonus = sourceDamageBonuses.global || 0;
          const elementalBonus = sourceDamageBonuses.elements[attribute] || 0;
          const anomalyDmg = sourceAnomalyBonuses.anomalyDmgBonus ?? 0;
          const defAnomaly = ANOMALY_DEFINITIONS[attribute];
          const typeDmg =
            sourceAnomalyBonuses.perAnomalyType?.[defAnomaly?.anomalyType]
              ?.dmgBonus ?? 0;
          sourceTotalBonusDamage =
            baseAttrBonus + anomalyDmg + typeDmg + globalBonus + elementalBonus;
        }
      }
      return {
        sourceStats,
        sourceTotalBonusDamage,
        sourceAnomalyBonuses,
        sourceDamageBonuses,
      };
    },
    [
      unifiedStats,
      computedTotalBonusDamage,
      anomalyBonuses,
      teamSlotsInfo,
      currentSlotIndex,
      teamEffects,
      damageBonuses,
    ],
  );

  const calculatePolarityFromScratch = useCallback(
    (
      sourceSlot: {
        slotIndex: number;
        attribute: AttributeType;
        agentName: string;
        agentId: string;
        isSelf?: boolean;
      } | null,
      isYanagi: boolean,
    ) => {
      if (!sourceSlot || !selectedEnemy) return null;
      let sourceStats = unifiedStats;
      let sourceTotalBonusDamage = computedTotalBonusDamage;
      let sourceAnomalyBonuses = anomalyBonuses;
      let sourceDamageBonuses = damageBonuses;
      let sourceName = sourceSlot.agentName;
      let sourceAttribute = sourceSlot.attribute;
      const isSelf = sourceSlot.isSelf || false;

      if (!isSelf) {
        const slotInfo = teamSlotsInfo?.find(
          (s) => s.slotIndex === sourceSlot.slotIndex,
        );
        if (slotInfo?.stats && slotInfo.activeEffects && slotInfo.agent) {
          const otherStats = slotInfo.stats;
          const otherActiveEffects = slotInfo.activeEffects || {};
          const otherAllEffects = Object.keys(otherActiveEffects)
            .filter((id) => otherActiveEffects[id]?.enabled)
            .map((id) => ingameEffectsRegistry[id])
            .filter(Boolean);

          sourceStats = otherStats;
          sourceAnomalyBonuses = collectAnomalyBonuses(
            otherAllEffects,
            otherActiveEffects,
            otherStats,
            otherStats,
            {},
            {},
            slotInfo.agent.id,
            sourceAttribute,
          );
          sourceDamageBonuses = collectDamageBonuses(
            otherAllEffects,
            otherActiveEffects,
            {},
            {},
            otherStats,
            {},
            teamEffects,
            slotInfo.agent.id,
          );
          const baseAttrBonus =
            otherStats.attributeDmgBonus[
              sourceAttribute as keyof typeof otherStats.attributeDmgBonus
            ] ?? 0;
          const globalBonus = sourceDamageBonuses.global || 0;
          const elementalBonus =
            sourceDamageBonuses.elements[sourceAttribute] || 0;
          const anomalyDmg = sourceAnomalyBonuses.anomalyDmgBonus ?? 0;
          const defAnomaly = ANOMALY_DEFINITIONS[sourceAttribute];
          const typeDmg =
            sourceAnomalyBonuses.perAnomalyType?.[defAnomaly?.anomalyType]
              ?.dmgBonus ?? 0;
          sourceTotalBonusDamage =
            baseAttrBonus + anomalyDmg + typeDmg + globalBonus + elementalBonus;
          sourceName = slotInfo.agentName;
        } else {
          console.warn(
            `⚠️ No se encontró información para el slot ${sourceSlot.slotIndex}, usando stats actuales`,
          );
        }
      } else {
        sourceName = agent.displayName || agent.name;
        sourceAttribute = agent.anomalyAttribute?.type || agentAttribute;
        sourceStats = unifiedStats;
        sourceTotalBonusDamage = computedTotalBonusDamage;
        sourceAnomalyBonuses = anomalyBonuses;
        sourceDamageBonuses = damageBonuses;
      }
      const sourceAttrBonus =
        sourceStats.attributeDmgBonus?.[sourceAttribute] || 0;
      const sourceElemBonus =
        sourceDamageBonuses?.elements?.[sourceAttribute] || 0;
      const totalElementBonus = sourceAttrBonus + sourceElemBonus;

      const sourceBonuses = {
        global: sourceDamageBonuses?.global || 0,
        elements: { [sourceAttribute]: totalElementBonus },
        skillTypes: sourceDamageBonuses?.skillTypes || {},
        anomalyDmgBonus: sourceAnomalyBonuses?.anomalyDmgBonus ?? 0,
        anomalyTypeDmg: sourceAnomalyBonuses?.perAnomalyType ?? {},
      };

      const slotBonuses = {
        disorderDmgBonus: anomalyBonuses?.disorderDmgBonus ?? 0,
        disorderMultiplierBonus: anomalyBonuses?.disorderMultiplierBonus ?? 0,
      };

      const timePassed = isYanagi
        ? 10 - yanagiPolarityTimeRemaining
        : 10 - nangongPolarityTimeRemaining;
      const disorderResultCalc = calculateDisorderDamage({
        previousAttribute: sourceAttribute,
        slotAttribute: sourceAttribute,
        timePassed,
        stats: sourceStats,
        enemy: selectedEnemy,
        sourceBonuses,
        slotBonuses,
        stunMultiplier,
        calculateRealDamage,
      });

      const disorderRealDamage = disorderResultCalc.realDamage;
      const disorderMultiplier = disorderResultCalc.multiplier;
      const dmgMod = disorderResultCalc.dmgMod ?? 1;
      const buffMod = disorderResultCalc.buffMod ?? 1;
      const polarityPercent = isYanagi ? 0.15 : 0.25;
      const polarityDamage = disorderRealDamage * polarityPercent;
      let apContribution = 0;
      if (isYanagi) {
        apContribution = unifiedStats.anomalyProficiency * 7.25;
      }
      const finalDamage = polarityDamage + apContribution;

      return {
        previousAttribute: sourceAttribute,
        disorderRealDamage,
        disorderMultiplier,
        dmgMod,
        buffMod,
        timePassed,
        polarityPercent,
        polarityDamage,
        apContribution,
        finalDamage,
        sourceName,
        sourceAttribute,
      };
    },
    [
      selectedEnemy,
      unifiedStats,
      computedTotalBonusDamage,
      anomalyBonuses,
      damageBonuses,
      teamSlotsInfo,
      teamEffects,
      stunMultiplier,
      calculateRealDamage,
      agent,
      agentAttribute,
      disorderTimeRemaining,
    ],
  );

  useEffect(() => {
    if (!selectedEnemy || !unifiedStats) return;
    const result = calculateAnomalyDamage({
      attribute: agentAttribute,
      stats: unifiedStats,
      enemy: selectedEnemy,
      totalBonusDamage: computedTotalBonusDamage,
      stunMultiplier,
      calculateRealDamage,
      damageBonuses,
      anomalyBonuses,
      refringeCoefficient: unifiedStats._refringeCoefficient || 0,
    });
    setAnomalyResult(result);
  }, [
    agentAttribute,
    unifiedStats,
    selectedEnemy,
    computedTotalBonusDamage,
    stunMultiplier,
    calculateRealDamage,
    damageBonuses,
    anomalyBonuses,
  ]);

  const prevResultRef = useRef<{ anomaly: any; disorder: any } | null>(null);
  useEffect(() => {
    if (!onResultChange) return;
    const currentResult = {
      anomaly: anomalyResult,
      disorder: disorderResult,
    };
    if (
      JSON.stringify(prevResultRef.current) !== JSON.stringify(currentResult)
    ) {
      prevResultRef.current = currentResult;
      onResultChange(currentResult);
    }
  }, [anomalyResult, disorderResult, onResultChange]);

  useEffect(() => {
    if (!showDisorderSection || !selectedEnemy || !unifiedStats) {
      setDisorderResult(emptyDisorderResult);
      return;
    }
    if (!disorderSelectedAttribute || disorderSelectedAttribute === "none") {
      setDisorderResult(emptyDisorderResult);
      return;
    }
    const timePassed = 10 - disorderTimeRemaining;
    const isCurrentAgent = disorderSelectedAttribute.startsWith("current:");
    let [slotIndexStr, attr] = disorderSelectedAttribute.split(":");
    const selectedAttribute = (attr ||
      selectedPreviousAttribute) as AttributeType;
    let sourceStats = unifiedStats;
    let sourceTotalBonusDamage = computedTotalBonusDamage;
    let sourceAnomalyBonuses = anomalyBonuses;
    let sourceDamageBonuses = damageBonuses;

    if (!isCurrentAgent) {
      const slotIndex = Number(slotIndexStr);
      const sourceSlotInfo = teamSlotsInfo?.find(
        (s) => s.slotIndex === slotIndex,
      );
      if (
        sourceSlotInfo?.stats &&
        sourceSlotInfo.activeEffects &&
        sourceSlotInfo.agent
      ) {
        sourceStats = sourceSlotInfo.stats;
        const otherActiveEffects = sourceSlotInfo.activeEffects || {};
        const otherAllEffects = Object.keys(otherActiveEffects)
          .filter((id) => otherActiveEffects[id]?.enabled)
          .map((id) => ingameEffectsRegistry[id])
          .filter(Boolean);
        sourceAnomalyBonuses = collectAnomalyBonuses(
          otherAllEffects,
          otherActiveEffects,
          sourceStats,
          sourceStats,
          {},
          {},
          sourceSlotInfo.agent.id,
          selectedAttribute,
        );
        const sourceSkillLevels: Record<string, number> = {};
        if (sourceSlotInfo.activeEffects) {
          for (const [id, state] of Object.entries(
            sourceSlotInfo.activeEffects,
          )) {
            if (state.enabled && state.skillLevel !== undefined) {
              sourceSkillLevels[id] = state.skillLevel;
            }
          }
        }
        if (teamEffects) {
          for (const [id, state] of Object.entries(teamEffects)) {
            if (
              state.enabled &&
              state.ownerAgentId === sourceSlotInfo.agent.id &&
              state.skillLevel !== undefined
            ) {
              sourceSkillLevels[id] = state.skillLevel;
            }
          }
        }
        const otherDamageBonuses = collectDamageBonuses(
          otherAllEffects,
          otherActiveEffects,
          sourceSkillLevels,
          {},
          sourceStats,
          {},
          teamEffects,
          sourceSlotInfo.agent.id,
        );
        const baseAttrBonus =
          sourceStats.attributeDmgBonus[
            selectedAttribute as keyof typeof sourceStats.attributeDmgBonus
          ] ?? 0;
        const globalBonus = otherDamageBonuses.global || 0;
        const elementalBonus =
          otherDamageBonuses.elements[selectedAttribute] || 0;
        const anomalyDmg = sourceAnomalyBonuses.anomalyDmgBonus ?? 0;
        const defAnomaly = ANOMALY_DEFINITIONS[selectedAttribute];
        const typeDmg =
          sourceAnomalyBonuses.perAnomalyType?.[defAnomaly?.anomalyType]
            ?.dmgBonus ?? 0;
        sourceDamageBonuses = otherDamageBonuses;
        sourceTotalBonusDamage =
          baseAttrBonus + anomalyDmg + typeDmg + globalBonus + elementalBonus;
      } else {
        console.warn(
          "⚠️ No se encontró información del otro slot, usando stats actuales",
        );
      }
    }

    const sourceAttrBonus =
      sourceStats.attributeDmgBonus?.[selectedAttribute] || 0;
    const sourceElemBonus =
      sourceDamageBonuses?.elements?.[selectedAttribute] || 0;
    const totalElementBonus = sourceAttrBonus + sourceElemBonus;
    const sourceBonuses = {
      global: sourceDamageBonuses?.global || 0,
      elements: { [selectedAttribute]: totalElementBonus },
      skillTypes: sourceDamageBonuses?.skillTypes || {},
      anomalyDmgBonus: sourceAnomalyBonuses?.anomalyDmgBonus ?? 0,
      anomalyTypeDmg: sourceAnomalyBonuses?.perAnomalyType ?? {},
    };
    let result;
    let duration = 10;

    if (isWindAgent) {
      const def = ANOMALY_DEFINITIONS[selectedAttribute];
      duration = def?.duration || 10;
      const slotBonuses = {
        vortexDmgBonus: anomalyBonuses?.vortexDmgBonus ?? 0,
        vortexMultiplierBonus: anomalyBonuses?.vortexMultiplierBonus ?? 0,
      };
      result = calculateVortexDamage({
        attribute: selectedAttribute,
        slotAttribute: agentAttribute,
        timeRemaining: disorderTimeRemaining,
        stats: sourceStats,
        enemy: selectedEnemy,
        sourceBonuses,
        slotBonuses,
        stunMultiplier,
        calculateRealDamage,
        additionalMV: 0,
        isVortex: true,
      });
      setDisorderResult({
        timeRemaining: disorderTimeRemaining,
        timePassed: 0,
        multiplier: result.multiplier,
        damage: result.damage,
        realDamage: result.realDamage,
        previousAttribute: selectedAttribute,
        totalBonusDamageUsed: sourceTotalBonusDamage,
        sourceAtk: sourceStats.atk,
        dmgMod: result.dmgMod ?? 1,
        buffMod: result.buffMod ?? 1,
      });
    } else {
      const slotBonuses = {
        disorderDmgBonus: anomalyBonuses?.disorderDmgBonus ?? 0,
        disorderMultiplierBonus: anomalyBonuses?.disorderMultiplierBonus ?? 0,
      };
      const disorderResultCalc = calculateDisorderDamage({
        previousAttribute: selectedAttribute,
        slotAttribute: selectedAttribute,
        timePassed,
        stats: sourceStats,
        enemy: selectedEnemy,
        sourceBonuses,
        slotBonuses,
        stunMultiplier,
        calculateRealDamage,
      });
      setDisorderResult({
        timeRemaining: disorderTimeRemaining,
        timePassed,
        multiplier: disorderResultCalc.multiplier,
        damage: disorderResultCalc.damage,
        realDamage: disorderResultCalc.realDamage,
        previousAttribute: selectedAttribute,
        totalBonusDamageUsed: sourceTotalBonusDamage,
        sourceAtk: sourceStats.atk,
        dmgMod: disorderResultCalc.dmgMod ?? 1,
        buffMod: disorderResultCalc.buffMod ?? 1,
      });
    }
  }, [
    showDisorderSection,
    selectedPreviousAttribute,
    disorderTimeRemaining,
    unifiedStats,
    selectedEnemy,
    computedTotalBonusDamage,
    stunMultiplier,
    calculateRealDamage,
    teamSlotsInfo,
    disorderSelectedAttribute,
    isWindAgent,
    JSON.stringify(teamSlotsInfo?.map((s) => s.activeEffects)),
  ]);

  useEffect(() => {
    if (aliceDisorderSelectedAttribute === "none") {
      setAliceDisorderResult(null);
      return;
    }
    if (!aliceDisorderSelectedAttribute) {
      return;
    }
    if (!showDisorderSection || !selectedEnemy || !unifiedStats) {
      return;
    }
    const timePassed = 10 - aliceTimeRemaining;
    const isCurrentAgent =
      aliceDisorderSelectedAttribute.startsWith("current:");
    let [slotIndexStr, attr] = aliceDisorderSelectedAttribute.split(":");
    const selectedAttribute = (attr ||
      aliceSelectedPreviousAttribute) as AttributeType;
    let sourceStats = unifiedStats;
    let sourceTotalBonusDamage = computedTotalBonusDamage;
    let sourceAnomalyBonuses = anomalyBonuses;
    let sourceDamageBonuses = damageBonuses;

    if (!isCurrentAgent) {
      const slotIndex = Number(slotIndexStr);
      const sourceSlotInfo = teamSlotsInfo?.find(
        (s) => s.slotIndex === slotIndex,
      );
      if (
        sourceSlotInfo?.stats &&
        sourceSlotInfo.activeEffects &&
        sourceSlotInfo.agent
      ) {
        sourceStats = sourceSlotInfo.stats;
        const otherActiveEffects = sourceSlotInfo.activeEffects || {};
        const otherAllEffects = Object.keys(otherActiveEffects)
          .filter((id) => otherActiveEffects[id]?.enabled)
          .map((id) => ingameEffectsRegistry[id])
          .filter(Boolean);
        sourceAnomalyBonuses = collectAnomalyBonuses(
          otherAllEffects,
          otherActiveEffects,
          sourceStats,
          sourceStats,
          {},
          {},
          sourceSlotInfo.agent.id,
          selectedAttribute as AttributeType,
        );
        const sourceSkillLevels: Record<string, number> = {};
        if (sourceSlotInfo.activeEffects) {
          for (const [id, state] of Object.entries(
            sourceSlotInfo.activeEffects,
          )) {
            if (state.enabled && state.skillLevel !== undefined) {
              sourceSkillLevels[id] = state.skillLevel;
            }
          }
        }
        if (teamEffects) {
          for (const [id, state] of Object.entries(teamEffects)) {
            if (
              state.enabled &&
              state.ownerAgentId === sourceSlotInfo.agent.id &&
              state.skillLevel !== undefined
            ) {
              sourceSkillLevels[id] = state.skillLevel;
            }
          }
        }
        sourceDamageBonuses = collectDamageBonuses(
          otherAllEffects,
          otherActiveEffects,
          sourceSkillLevels,
          {},
          sourceStats,
          {},
          teamEffects,
          sourceSlotInfo.agent.id,
        );
        const baseAttrBonus =
          sourceStats.attributeDmgBonus[
            selectedAttribute as keyof typeof sourceStats.attributeDmgBonus
          ] ?? 0;
        const globalBonus = sourceDamageBonuses.global || 0;
        const elementalBonus =
          sourceDamageBonuses.elements[selectedAttribute] || 0;
        const anomalyDmg = sourceAnomalyBonuses.anomalyDmgBonus ?? 0;
        const defAnomaly = ANOMALY_DEFINITIONS[selectedAttribute];
        const typeDmg =
          sourceAnomalyBonuses.perAnomalyType?.[defAnomaly?.anomalyType]
            ?.dmgBonus ?? 0;
        sourceTotalBonusDamage =
          baseAttrBonus + anomalyDmg + typeDmg + globalBonus + elementalBonus;
      } else {
        console.warn(
          "⚠️ No se encontró información del otro slot para Alice, usando stats actuales",
        );
      }
    }

    const sourceAttrBonus =
      sourceStats.attributeDmgBonus?.[selectedAttribute] || 0;
    const sourceElemBonus =
      sourceDamageBonuses?.elements?.[selectedAttribute] || 0;
    const totalElementBonus = sourceAttrBonus + sourceElemBonus;
    const sourceBonuses = {
      global: sourceDamageBonuses?.global || 0,
      elements: { [selectedAttribute]: totalElementBonus },
      skillTypes: sourceDamageBonuses?.skillTypes || {},
      anomalyDmgBonus: sourceAnomalyBonuses?.anomalyDmgBonus ?? 0,
      anomalyTypeDmg: sourceAnomalyBonuses?.perAnomalyType ?? {},
    };
    const aliceAnomalyBonuses = collectAnomalyBonuses(
      allEffects,
      activeEffects,
      unifiedStats,
      unifiedStats,
      realTimeOwnerStats,
      {},
      agent.id,
      selectedAttribute as AttributeType,
    );

    const slotBonuses = {
      disorderDmgBonus: aliceAnomalyBonuses?.disorderDmgBonus ?? 0,
      disorderMultiplierBonus:
        aliceAnomalyBonuses?.disorderMultiplierBonus ?? 0,
    };
    const disorderResultCalc = calculateDisorderDamage({
      previousAttribute: selectedAttribute,
      slotAttribute: selectedAttribute,
      timePassed,
      stats: sourceStats,
      enemy: selectedEnemy,
      sourceBonuses,
      slotBonuses,
      stunMultiplier,
      calculateRealDamage,
    });
    const newAliceDisorderResult = {
      timeRemaining: aliceTimeRemaining,
      timePassed,
      multiplier: disorderResultCalc.multiplier,
      damage: disorderResultCalc.damage,
      realDamage: disorderResultCalc.realDamage,
      previousAttribute: selectedAttribute,
      totalBonusDamageUsed: sourceTotalBonusDamage,
      sourceAtk: sourceStats.atk,
      dmgMod: disorderResultCalc.dmgMod ?? 1,
      buffMod: disorderResultCalc.buffMod ?? 1,
    };
    setAliceDisorderResult(newAliceDisorderResult);
  }, [
    showDisorderSection,
    aliceSelectedPreviousAttribute,
    aliceTimeRemaining,
    unifiedStats,
    selectedEnemy,
    computedTotalBonusDamage,
    stunMultiplier,
    calculateRealDamage,
    teamSlotsInfo,
    aliceDisorderSelectedAttribute,
    JSON.stringify(teamSlotsInfo?.map((s) => s.activeEffects)),
  ]);

  useEffect(() => {
    if (
      isWindAgent ||
      vortexSourceSlot === null ||
      !selectedEnemy ||
      !unifiedStats
    ) {
      setVortexResult(null);
      return;
    }
    const windSlotInfo = teamSlotsInfo?.find(
      (s) => s.slotIndex === vortexSourceSlot,
    );
    if (!windSlotInfo?.stats || !windSlotInfo.agent) {
      setVortexResult(null);
      return;
    }
    const windStats = windSlotInfo.stats;
    const windAgent = windSlotInfo.agent;
    const windActiveEffects = windSlotInfo.activeEffects || {};
    const windAllEffects = Object.keys(windActiveEffects)
      .filter((id) => windActiveEffects[id]?.enabled)
      .map((id) => ingameEffectsRegistry[id])
      .filter(Boolean);
    const windAnomalyBonuses = collectAnomalyBonuses(
      windAllEffects,
      windActiveEffects,
      windStats,
      windStats,
      {},
      {},
      windAgent.id,
      agentAttribute as AttributeType,
    );
    const windDamageBonuses = collectDamageBonuses(
      windAllEffects,
      windActiveEffects,
      {},
      {},
      windStats,
      {},
      teamEffects,
      windAgent.id,
    );
    const windElemBonus = windDamageBonuses.elements?.["wind"] || 0;
    const windAttrBonus = windStats.attributeDmgBonus?.["wind"] || 0;
    const totalElementBonus = windElemBonus + windAttrBonus;
    const sourceBonuses = {
      global: windDamageBonuses.global || 0,
      elements: { wind: totalElementBonus },
      skillTypes: windDamageBonuses.skillTypes || {},
    };
    const slotBonuses = {
      vortexDmgBonus: anomalyBonuses?.vortexDmgBonus ?? 0,
      vortexMultiplierBonus: anomalyBonuses?.vortexMultiplierBonus ?? 0,
    };
    const windTotalBonusDamage =
      (windStats.attributeDmgBonus["wind"] ?? 0) +
      (windDamageBonuses.global || 0) +
      (windDamageBonuses.elements["wind"] || 0) +
      (windAnomalyBonuses?.anomalyDmgBonus ?? 0);
    const result = calculateVortexDamage({
      attribute: agentAttribute as AttributeType,
      slotAttribute: agentAttribute,
      timeRemaining: vortexTimeRemaining,
      stats: windStats,
      enemy: selectedEnemy,
      sourceBonuses,
      slotBonuses,
      stunMultiplier,
      calculateRealDamage,
      additionalMV: 0,
      isVortex: true,
    });
    setVortexResult({
      ...result,
      sourceAgentName: windSlotInfo.agentName,
      sourceAttribute: "wind",
      timeRemaining: vortexTimeRemaining,
      sourceAtk: windStats.atk,
      totalBonusDamageUsed: windTotalBonusDamage,
      dmgMod: result.dmgMod ?? 1,
      buffMod: result.buffMod ?? 1,
    });
  }, [
    isWindAgent,
    vortexSourceSlot,
    vortexTimeRemaining,
    selectedEnemy,
    unifiedStats,
    teamSlotsInfo,
    stunMultiplier,
    calculateRealDamage,
    agentAttribute,
    anomalyBonuses,
  ]);

  const handleDisorderChange = (value: string) => {
    setSelectedDisorderOption(value);

    if (!value || value === "none") {
      setSelectedPreviousAttribute(
        agent.anomalyAttribute?.type || agentAttribute,
      );
      setDisorderResult(emptyDisorderResult);
      return;
    }

    if (value.startsWith("current:")) {
      const attribute = value.replace("current:", "");
      setSelectedPreviousAttribute(attribute);
    } else if (value.includes(":")) {
      const [, attribute] = value.split(":");
      setSelectedPreviousAttribute(attribute);
    }
  };

  const getDisorderOptions = () => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> =
      [];

    options.push({ value: "none", label: "None" });

    const currentAttribute = agent.anomalyAttribute?.type || agentAttribute;
    const currentAgentName = agent.displayName || agent.name;
    const hasSpecialAttribute = agent.anomalyAttribute !== undefined;

    if (!isWindAgent) {
      options.push({
        value: `current:${currentAttribute}`,
        label: `Slot ${currentSlotIndex + 1}: ${currentAgentName} (${definition.anomalyType.toUpperCase()})`,
        disabled: !hasSpecialAttribute,
      });
    }

    teamSlotsInfo
      .filter(
        (slot) =>
          slot.slotIndex !== currentSlotIndex &&
          slot.agentName !== "Empty" &&
          !(isWindAgent && slot.attribute === "wind"),
      )
      .forEach((slot) => {
        const otherAgent = agents.find(
          (a) => a.displayName === slot.agentName || a.name === slot.agentName,
        );
        let otherAttribute = slot.attribute?.toLowerCase() || "unknown";
        if (otherAgent?.anomalyAttribute) {
          otherAttribute = otherAgent.anomalyAttribute.type;
        }
        const otherDef = ANOMALY_DEFINITIONS[otherAttribute];
        const isSameAttribute = otherAttribute === currentAttribute;
        options.push({
          value: `${slot.slotIndex}:${otherAttribute}`,
          label: `Slot ${slot.slotIndex + 1}: ${slot.agentName} (${otherDef?.anomalyType || otherAttribute})`,
          disabled: isSameAttribute && !isWindAgent,
        });
      });

    return options;
  };

  const aliceTickData = useMemo(() => {
    if (aliceAssaultSourceSlot === null || !selectedEnemy) return null;
    const isSelf = aliceAssaultSourceSlot === currentSlotIndex;
    const sourceSlotInfo = teamSlotsInfo?.find(
      (s) => s.slotIndex === aliceAssaultSourceSlot,
    );
    if (!sourceSlotInfo?.stats) return null;
    let sourceAssaultResult;
    if (isSelf) {
      if (!anomalyResult) return null;
      sourceAssaultResult = anomalyResult;
    } else {
      const targetStats = sourceSlotInfo.stats;
      const targetAgent = sourceSlotInfo.agent;
      const targetActiveEffects = sourceSlotInfo.activeEffects ?? {};
      const targetAllEffects = Object.keys(targetActiveEffects)
        .filter((id) => targetActiveEffects[id].enabled)
        .map((id) => ingameEffectsRegistry[id])
        .filter(Boolean);
      const targetAnomalyBonuses = collectAnomalyBonuses(
        targetAllEffects,
        targetActiveEffects,
        targetStats,
        targetStats,
        {},
        {},
        targetAgent?.id,
      );
      const targetTotalBonusDamage =
        (targetStats.attributeDmgBonus.physical ?? 0) +
        (targetAnomalyBonuses.anomalyDmgBonus ?? 0) +
        (targetAnomalyBonuses.perAnomalyType?.["assault"]?.dmgBonus ?? 0);
      sourceAssaultResult = calculateAnomalyDamage({
        attribute: "physical",
        stats: targetStats,
        enemy: selectedEnemy,
        totalBonusDamage: targetTotalBonusDamage,
        anomalyBonuses: targetAnomalyBonuses,
        stunMultiplier,
        calculateRealDamage,
      });
    }
    const tickCount = Math.floor(10 / 0.95);
    const tickDamage = sourceAssaultResult?.realDamage
      ? Math.round(sourceAssaultResult.realDamage * 0.025)
      : 0;
    const totalTickDamage = tickDamage * tickCount;
    return {
      sourceAssaultResult,
      tickCount,
      tickDamage,
      totalTickDamage,
      sourceName: isSelf ? "Alice" : sourceSlotInfo.agentName,
    };
  }, [
    aliceAssaultSourceSlot,
    selectedEnemy,
    teamSlotsInfo,
    unifiedStats,
    computedTotalBonusDamage,
    anomalyBonuses,
    stunMultiplier,
    calculateRealDamage,
    currentSlotIndex,
    anomalyResult,
  ]);

  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);
  const getPossessive = (name: string) => {
    const cleanName = name.trim();
    const lastName = cleanName.charAt(cleanName.length - 1).toLowerCase();
    if (lastName === "s") {
      return `${cleanName}'`;
    }
    return `${cleanName}'s`;
  };

  const selectedYanagiSlot = localYanagiSource;
  const yanagiDisorderResult = selectedYanagiSlot
    ? slotAnomalyResults?.[selectedYanagiSlot.slotIndex]?.disorderResult
    : null;
  const hasYanagiDisorder = !!(
    yanagiDisorderResult && yanagiDisorderResult.realDamage > 0
  );

  const selectedNangongSlot = localNangongSource;
  const nangongDisorderResult = selectedNangongSlot
    ? slotAnomalyResults?.[selectedNangongSlot.slotIndex]?.disorderResult
    : null;
  const hasNangongDisorder = !!(
    nangongDisorderResult && nangongDisorderResult.realDamage > 0
  );

  const yanagiSlotStillValid = selectedYanagiSlot
    ? teamSlotsInfo.some(
        (s) =>
          s.slotIndex === selectedYanagiSlot.slotIndex &&
          s.agentName === selectedYanagiSlot.agentName,
      )
    : false;

  const nangongSlotStillValid = selectedNangongSlot
    ? teamSlotsInfo.some(
        (s) =>
          s.slotIndex === selectedNangongSlot.slotIndex &&
          s.agentName === selectedNangongSlot.agentName,
      )
    : false;

  useEffect(() => {
    if (selectedYanagiSlot && !yanagiSlotStillValid) {
      setYanagiPolaritySource(null);
    }
  }, [selectedYanagiSlot, yanagiSlotStillValid, setYanagiPolaritySource]);

  useEffect(() => {
    if (selectedNangongSlot && !nangongSlotStillValid) {
      setNangongPolaritySource(null);
    }
  }, [selectedNangongSlot, nangongSlotStillValid, setNangongPolaritySource]);

  if (!selectedEnemy) return null;

  return (
    <div>
      {/* ANOMALY DMG */}
      {anomalyResult && (
        <div>
          <div className="anomaly_summary-main_wrapper">
            <div className="anomaly-grid-header">
              <div className="anomaly-title-with-icon">
                <img
                  src={`/ztunner/resources/images/icons/attributes/${
                    agent.anomalyAttribute?.type
                      ? agent.anomalyAttribute.type.charAt(0).toUpperCase() +
                        agent.anomalyAttribute.type.slice(1)
                      : agentAttribute.charAt(0).toUpperCase() +
                        agentAttribute.slice(1)
                  }.png`}
                  alt={agent.anomalyAttribute?.type || agentAttribute}
                  className="anomaly-attribute-icon"
                />
                <span className="anomaly-title-text">
                  {getPossessive(agent.displayName || agent.name)}{" "}
                  {capitalize(definition.anomalyType)} DMG
                </span>
              </div>
            </div>
            <div className="anomaly-grid">
              {/* Header */}
              <div className="anomaly-grid-header-row">
                <div className="anomaly-header-cell step">#</div>
                <div className="anomaly-header-cell calculation">
                  {" "}
                  Calculation
                </div>
                <div className="anomaly-header-cell before">Before</div>
                <div className="anomaly-header-cell arrow">→</div>
                <div className="anomaly-header-cell after">After</div>
              </div>
              {/* Paso 1: Base */}
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">①</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">
                    {" "}
                    Base {capitalize(definition.anomalyType)} DMG{" "}
                  </span>
                  <span className="calc-detail">
                    {" "}
                    ATK × {definition.baseMultiplier * 100}%{" "}
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {Math.round(unifiedStats.atk).toLocaleString()}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {anomalyResult.baseDamage.toLocaleString()}
                </div>
              </div>
              {/* Paso 2: AP */}
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">②</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">AP Multiplier</span>
                  <span className="calc-detail">
                    {" "}
                    {unifiedStats.anomalyProficiency} AP × 0.01{" "}
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {anomalyResult.baseDamage.toLocaleString()}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {(unifiedStats.anomalyProficiency / 100).toFixed(2)}
                </div>
              </div>
              {/* Paso 3: After AP */}
              <div className="anomaly-grid-row highlight-row">
                <div className="anomaly-row-cell step">③</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">After AP</span>
                  <span className="calc-detail">Base × AP</span>
                </div>
                <div className="anomaly-row-cell before">
                  {anomalyResult.baseDamage.toLocaleString()}
                </div>
                <div className="anomaly-row-cell arrow">=</div>
                <div className="anomaly-row-cell after highlight-value">
                  {anomalyResult.withAP?.toLocaleString()}
                </div>
              </div>
              {/* Paso 4: Buff Level */}
              {anomalyResult.withBuffLevel && (
                <>
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">④</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Buff Level</span>
                      <span className="calc-detail">Lv.60 Multiplier</span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {anomalyResult.withAP?.toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-ap">
                      {" "}
                      2.00{" "}
                    </div>
                  </div>
                  <div className="anomaly-grid-row highlight-row">
                    <div className="anomaly-row-cell step">⑤</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">After Buff</span>
                      <span className="calc-detail">AP × Buff</span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {anomalyResult.withAP?.toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">=</div>
                    <div className="anomaly-row-cell after highlight-value">
                      {anomalyResult.withBuffLevel.toLocaleString()}
                    </div>
                  </div>
                </>
              )}
              {/* Paso 6: DMG% Mod */}
              {(() => {
                const beforeValue =
                  anomalyResult.withBuffLevel ?? anomalyResult.withAP ?? 0;
                const dmgMod = anomalyResult.dmgMod ?? 1;
                const withDMG = beforeValue * dmgMod;
                const dmgPercent = Math.round((dmgMod - 1) * 100 * 10) / 10;
                return (
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">⑥</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">DMG% Mod</span>
                      <span className="calc-detail">
                        {" "}
                        +{dmgPercent.toFixed(1)}%{" "}
                      </span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {Math.round(beforeValue).toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-bonus">
                      {Math.round(withDMG).toLocaleString()}
                    </div>
                  </div>
                );
              })()}
              {/* Paso 7: Anomaly Bonus */}
              {(() => {
                const beforeValue =
                  anomalyResult.withBuffLevel ?? anomalyResult.withAP ?? 0;
                const dmgMod = anomalyResult.dmgMod ?? 1;
                const withDMG = beforeValue * dmgMod;
                const buffMod = anomalyResult.buffMod ?? 1;
                const withBuff = withDMG * buffMod;
                const buffPercent = Math.round((buffMod - 1) * 100 * 10) / 10;
                return (
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">⑦</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Anomaly Bonus</span>
                      <span className="calc-detail">
                        {" "}
                        +{buffPercent.toFixed(1)}%{" "}
                      </span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {Math.round(withDMG).toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-bonus">
                      {Math.round(withBuff).toLocaleString()}
                    </div>
                  </div>
                );
              })()}
              {/* Stun */}
              {stunMultiplier > 0 && (
                <div className="anomaly-grid-row stun-row">
                  <div className="anomaly-row-cell step">⑦</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Stun</span>
                    <span className="calc-detail">+{stunMultiplier}%</span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {anomalyResult.withBonuses?.toLocaleString()}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-stun">
                    {Math.floor(
                      anomalyResult.withBonuses * (1 + stunMultiplier / 100),
                    ).toLocaleString()}
                  </div>
                </div>
              )}
              {/* Total final */}
              <div className="anomaly-grid-total-row">
                <div className="anomaly-row-cell step">☑</div>
                <div className="anomaly-row-cell calculation">
                  <span className="total-label">
                    {" "}
                    Final {capitalize(definition.anomalyType)} DMG{" "}
                  </span>
                  <span className="total-target">vs {selectedEnemy.name}</span>
                </div>
                <div className="anomaly-row-cell before" />
                <div className="anomaly-row-cell arrow">=</div>
                <div className="anomaly-row-cell after total-value">
                  {anomalyResult.realDamage.toLocaleString()}
                </div>
              </div>
              {/* CRIT (Assault) */}
              {definition.anomalyType === "assault" &&
                anomalyResult.assaultCritDmgTotal > 0 && (
                  <div className="anomaly-grid-total-row">
                    <div className="anomaly-row-cell step">▤</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="total-label">
                        Final Assault CRIT DMG
                      </span>
                      <span className="total-target">
                        {getPossessive(agent.displayName || agent.name)} Assault
                        CRIT DMG:{" "}
                        {(anomalyResult.assaultCritDmgTotal * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="anomaly-row-cell before" />
                    <div className="anomaly-row-cell arrow">=</div>
                    <div className="anomaly-row-cell after crit-value">
                      {anomalyResult.realCritDamage?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ⭐ DISORDER / VORTEX PRINCIPAL */}
      {showDisorderSection && (
        <div className="anomaly_summary-main_wrapper">
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <span className="anomaly-title-text no-img">✦</span>
              <span className="anomaly-title-text">
                {isWindAgent
                  ? `${getPossessive(agent.displayName || agent.name)} Vortex DMG`
                  : `${getPossessive(agent.displayName || agent.name)} Disorder DMG`}
              </span>
            </div>
          </div>
          {/* Selector de atributo previo */}
          <div className="disorder-selector-wrapper">
            <div className="disorder-selector-header">
              <label>Previous Anomaly Attribute:</label>
            </div>
            <div className="disorder-selector-neon">
              <NeonSelect
                value={(() => {
                  const allOptions = getDisorderOptions();
                  const found = allOptions.find(
                    (opt) => opt.value === disorderSelectedAttribute,
                  );
                  return found &&
                    disorderSelectedAttribute !== "none" &&
                    disorderSelectedAttribute !== ""
                    ? found.label
                    : "Select anomaly...";
                })()}
                options={getDisorderOptions()}
                onChange={(value: string) => {
                  if (value) handleDisorderChange(value);
                }}
                theme={agent?.themeColor || "#7EFFDB"}
                variant="enemy"
              />
            </div>
          </div>
          {/* Slider de tiempo */}
          <div className="disorder_slider_selector">
            <label>
              {isWindAgent ? "Vortex Time Remaining" : "Time Remaining"}
            </label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={disorderTimeRemaining}
                onChange={(e) => setTimeRemaining(Number(e.target.value))}
                style={
                  {
                    "--fill": `${(disorderTimeRemaining / 10) * 100}%`,
                    "--theme": agent?.themeColor || "#ff4684",
                  } as React.CSSProperties
                }
              />
              <span className="slider-value">
                {disorderTimeRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="slider-time-passed">
              {isWindAgent ? (
                <span>
                  {" "}
                  Vortex duration:{" "}
                  <strong>{disorderTimeRemaining.toFixed(1)}s</strong>{" "}
                </span>
              ) : (
                <>
                  {" "}
                  Time Passed:{" "}
                  <strong>{(10 - disorderTimeRemaining).toFixed(1)}s</strong>
                </>
              )}
            </div>
          </div>
          {/* Grid de resultados */}
          {disorderResult || disorderSelectedAttribute === "" ? (
            <div className="anomaly-grid">
              <div className="anomaly-grid-header-row">
                <div className="anomaly-header-cell step">#</div>
                <div className="anomaly-header-cell calculation">
                  {" "}
                  Calculation{" "}
                </div>
                <div className="anomaly-header-cell before">Before</div>
                <div className="anomaly-header-cell arrow">→</div>
                <div className="anomaly-header-cell after">After</div>
              </div>
              {/* Paso ①: Previous Anomaly */}
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">①</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Previous Anomaly</span>
                  <span className="calc-detail">
                    {ANOMALY_DEFINITIONS[disorderResult.previousAttribute]
                      ?.anomalyType || disorderResult.previousAttribute}
                  </span>
                </div>
                <div className="anomaly-row-cell before">—</div>
                <div className="anomaly-row-cell arrow">→</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {ANOMALY_DEFINITIONS[disorderResult.previousAttribute]
                    ?.anomalyType || disorderResult.previousAttribute}
                </div>
              </div>
              {/* Paso ②: Base Multiplier */}
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">②</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Base Multiplier</span>
                  <span className="calc-detail">
                    {isWindAgent ? (
                      (() => {
                        const def =
                          ANOMALY_DEFINITIONS[selectedPreviousAttribute];
                        if (!def?.vortexFormula) return "—";
                        const { base, perSecond, perTick } = def.vortexFormula;
                        let formula = `${(base * 100).toFixed(0)}%`;
                        if (perTick) {
                          formula += ` + [t/0.5]*${(perTick * 100).toFixed(0)}%`;
                        } else if (perSecond) {
                          formula += ` + t*${(perSecond * 100).toFixed(0)}%`;
                        }
                        return formula;
                      })()
                    ) : (
                      <>
                        {ANOMALY_DEFINITIONS[selectedPreviousAttribute]
                          ?.disorderFormula.baseMultiplier * 100}
                        %{" "}
                        {selectedPreviousAttribute === "frost" &&
                          ` + ${Math.floor(10 - disorderResult.timePassed) * 7.5}%`}
                        {selectedPreviousAttribute === "auricInk" &&
                          ` + ${
                            Math.floor((10 - disorderResult.timePassed) * 2) *
                            62.5
                          }%`}
                        {selectedPreviousAttribute === "honedEdge" &&
                          ` + ${Math.floor(10 - disorderResult.timePassed) * 7.5}%`}
                        {selectedPreviousAttribute === "fire" &&
                          ` + ${Math.floor((10 - disorderResult.timePassed) * 2) * 50}%`}
                        {selectedPreviousAttribute === "electric" &&
                          ` + ${Math.floor(10 - disorderResult.timePassed) * 125}%`}
                        {selectedPreviousAttribute === "ether" &&
                          ` + ${
                            Math.floor((10 - disorderResult.timePassed) * 2) *
                            62.5
                          }%`}
                        {(selectedPreviousAttribute === "ice" ||
                          selectedPreviousAttribute === "physical") &&
                          ` + ${Math.floor(10 - disorderResult.timePassed) * 7.5}%`}
                      </>
                    )}
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {isWindAgent
                    ? `${(ANOMALY_DEFINITIONS[selectedPreviousAttribute]?.vortexFormula?.base || 0) * 100}%`
                    : `${ANOMALY_DEFINITIONS[selectedPreviousAttribute]?.disorderFormula.baseMultiplier * 100}%`}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-ap">
                  {(disorderResult.multiplier * 100).toFixed(1)}%
                </div>
              </div>
              {/* Paso ③: Time */}
              <div className="anomaly-grid-row highlight-row">
                <div className="anomaly-row-cell step">③</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">
                    {isWindAgent ? "Time (max)" : "Time Passed"}
                  </span>
                  <span className="calc-detail">
                    {isWindAgent
                      ? `${disorderResult.timeRemaining.toFixed(1)}s / ${disorderResult.timeRemaining.toFixed(1)}s`
                      : `${disorderResult.timePassed.toFixed(1)}s / 10s`}
                  </span>
                </div>
                <div className="anomaly-row-cell before">
                  {(
                    (disorderResult.sourceAtk ?? unifiedStats.atk) *
                    (isWindAgent
                      ? ANOMALY_DEFINITIONS[selectedPreviousAttribute]
                          ?.vortexFormula?.base || 0
                      : ANOMALY_DEFINITIONS[selectedPreviousAttribute]
                          ?.disorderFormula.baseMultiplier)
                  ).toLocaleString()}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-bonus">
                  {disorderResult.multiplier.toFixed(2)}×
                </div>
              </div>
              {/* Paso ④: Base DMG */}
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell step">④</div>
                <div className="anomaly-row-cell calculation">
                  <span className="calc-label">Base DMG</span>
                  <span className="calc-detail">ATK × Total Multiplier</span>
                </div>
                <div className="anomaly-row-cell before">
                  {Math.round(
                    disorderResult.sourceAtk ?? unifiedStats.atk,
                  ).toLocaleString()}
                </div>
                <div className="anomaly-row-cell arrow">×</div>
                <div className="anomaly-row-cell after highlight-value">
                  {Math.round(
                    (disorderResult.sourceAtk ?? unifiedStats.atk) *
                      disorderResult.multiplier,
                  ).toLocaleString()}
                </div>
              </div>
              {/* Paso ⑤: DMG% Mod */}
              {(() => {
                const beforeValue =
                  (disorderResult.sourceAtk ?? unifiedStats.atk) *
                  disorderResult.multiplier;
                const dmgMod = disorderResult.dmgMod ?? 1;
                const withDMG = beforeValue * dmgMod;
                const dmgPercent = Math.round((dmgMod - 1) * 100 * 10) / 10;
                return (
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">⑤</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">DMG% Mod</span>
                      <span className="calc-detail">
                        {" "}
                        +{dmgPercent.toFixed(1)}%{" "}
                      </span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {Math.round(beforeValue).toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-bonus">
                      {Math.round(withDMG).toLocaleString()}
                    </div>
                  </div>
                );
              })()}
              {/* Paso ⑥: Disorder Bonus */}
              {(() => {
                const beforeValue =
                  (disorderResult.sourceAtk ?? unifiedStats.atk) *
                  disorderResult.multiplier;
                const dmgMod = disorderResult.dmgMod ?? 1;
                const withDMG = beforeValue * dmgMod;
                const buffMod = disorderResult.buffMod ?? 1;
                const withBuff = withDMG * buffMod;
                const buffPercent = Math.round((buffMod - 1) * 100 * 10) / 10;
                return (
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">⑥</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Disorder Bonus</span>
                      <span className="calc-detail">
                        {" "}
                        +{buffPercent.toFixed(1)}%{" "}
                      </span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {Math.round(withDMG).toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-bonus">
                      {Math.round(withBuff).toLocaleString()}
                    </div>
                  </div>
                );
              })()}
              {/* Stun */}
              {stunMultiplier > 0 && (
                <div className="anomaly-grid-row stun-row">
                  <div className="anomaly-row-cell step">⑦</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Stun</span>
                    <span className="calc-detail">+{stunMultiplier}%</span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {Math.round(
                      (disorderResult.sourceAtk ?? unifiedStats.atk) *
                        disorderResult.multiplier *
                        (1 + disorderResult.totalBonusDamageUsed),
                    ).toLocaleString()}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-stun">
                    {Math.round(
                      (disorderResult.sourceAtk ?? unifiedStats.atk) *
                        disorderResult.multiplier *
                        (1 + disorderResult.totalBonusDamageUsed) *
                        (1 + stunMultiplier / 100),
                    ).toLocaleString()}
                  </div>
                </div>
              )}
              {/* Total final */}
              <div className="anomaly-grid-total-row">
                <div className="anomaly-row-cell step">☑</div>
                <div className="anomaly-row-cell calculation">
                  <span className="total-label">
                    {isWindAgent ? "Final Vortex DMG" : "Final Disorder DMG"}
                  </span>
                  <span className="total-target">vs {selectedEnemy.name}</span>
                </div>
                <div className="anomaly-row-cell before" />
                <div className="anomaly-row-cell arrow">=</div>
                <div className="anomaly-row-cell after total-value">
                  {disorderResult.realDamage.toLocaleString()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Active Anomaly / Disorder Bonuses Panel */}
      <AnomalyBonusesPanel
        anomalyBonuses={anomalyBonuses}
        isWindAgent={isWindAgent}
        refringeCoefficient={unifiedStats._refringeCoefficient || 0}
      />

      {/* ⭐ ALICE — Polarized Assault */}
      {agent.id === "alice" && (
        <div className="anomaly_summary-main_wrapper">
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="/ztunner/resources/images/icons/attributes/Physical.png"
                alt="Physical"
                className="anomaly-attribute-icon"
              />
              <span className="anomaly-title-text">
                {" "}
                Alice's Polarized Assault{" "}
              </span>
            </div>
          </div>

          <div className="disorder-selector-wrapper fix-alice">
            <div className="disorder-selector-header">
              <label>Previous Anomaly Attribute:</label>
            </div>
            <div className="disorder-selector-neon">
              <NeonSelect
                value={(() => {
                  const allOptions = getAliceDisorderOptions();
                  const found = allOptions.find(
                    (opt) => opt.value === aliceDisorderSelectedAttribute,
                  );
                  return found &&
                    aliceDisorderSelectedAttribute !== "none" &&
                    aliceDisorderSelectedAttribute !== ""
                    ? found.label
                    : "Select anomaly...";
                })()}
                options={getAliceDisorderOptions()}
                onChange={(value: string) => {
                  if (value) handleAliceDisorderChange(value);
                }}
                theme={agent?.themeColor}
                variant="enemy"
              />
            </div>
          </div>

          <div className="disorder_slider_selector">
            <label>Time Remaining</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={aliceTimeRemaining}
                onChange={(e) => setAliceTimeRemaining(Number(e.target.value))}
                style={
                  {
                    "--fill": `${(aliceTimeRemaining / 10) * 100}%`,
                    "--theme": agent?.themeColor || "#ff4684",
                  } as React.CSSProperties
                }
              />
              <span className="slider-value">
                {aliceTimeRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="slider-time-passed">
              Time Passed:{" "}
              <strong>{(10 - aliceTimeRemaining).toFixed(1)}s</strong>
            </div>
          </div>

          {/* Grid siempre visible */}
          <div className="anomaly-grid">
            <div className="anomaly-grid-header-row">
              <div className="anomaly-header-cell step">#</div>
              <div className="anomaly-header-cell calculation">Calculation</div>
              <div className="anomaly-header-cell before">Before</div>
              <div className="anomaly-header-cell arrow">→</div>
              <div className="anomaly-header-cell after">After</div>
            </div>

            {!anomalyResult ? (
              <div className="anomaly-grid-row">
                <div
                  className="anomaly-row-cell alice-verification"
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    color: "#888",
                    padding: "16px 0",
                  }}
                >
                  No anomaly result available
                </div>
              </div>
            ) : !aliceDisorderResult ||
              aliceDisorderSelectedAttribute === "none" ||
              aliceDisorderSelectedAttribute === "" ? (
              <div className="anomaly-grid-row">
                <div
                  className="anomaly-row-cell alice-verification"
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    color: "#888",
                    padding: "16px 0",
                  }}
                >
                  Select a Previous Anomaly Attribute above
                </div>
              </div>
            ) : (
              <>
                {/* ① Polarized Assault DMG */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">①</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Polarized Assault DMG</span>
                    <span className="calc-detail">
                      100% of Physical Assault
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">—</div>
                  <div className="anomaly-row-cell arrow">=</div>
                  <div className="anomaly-row-cell after highlight-value">
                    {anomalyResult.realDamage.toLocaleString()}
                  </div>
                </div>

                {/* ② Previous Anomaly */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">②</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Previous Anomaly</span>
                    <span className="calc-detail">
                      {ANOMALY_DEFINITIONS[
                        aliceDisorderResult.previousAttribute
                      ]?.anomalyType || aliceDisorderResult.previousAttribute}
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">—</div>
                  <div className="anomaly-row-cell arrow">→</div>
                  <div className="anomaly-row-cell after highlight-ap">
                    {ANOMALY_DEFINITIONS[aliceDisorderResult.previousAttribute]
                      ?.anomalyType || aliceDisorderResult.previousAttribute}
                  </div>
                </div>

                {/* ③ Base Multiplier */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">③</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Base Multiplier</span>
                    <span className="calc-detail">
                      {(() => {
                        const prevAttr = aliceDisorderResult.previousAttribute;
                        const def = ANOMALY_DEFINITIONS[prevAttr];
                        if (!def) return "—";
                        const base = def.disorderFormula.baseMultiplier * 100;
                        const timePassed = aliceDisorderResult.timePassed || 0;
                        const perSecond =
                          def.disorderFormula.perSecondFormula(timePassed) *
                          100;
                        return `${base}% + ${perSecond.toFixed(0)}%`;
                      })()}
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {(() => {
                      const prevAttr = aliceDisorderResult.previousAttribute;
                      const def = ANOMALY_DEFINITIONS[prevAttr];
                      if (!def) return "0%";
                      return `${def.disorderFormula.baseMultiplier * 100}%`;
                    })()}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-ap">
                    {(aliceDisorderResult.multiplier * 100).toFixed(1)}%
                  </div>
                </div>

                {/* ④ Time */}
                <div className="anomaly-grid-row highlight-row">
                  <div className="anomaly-row-cell step">④</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Time</span>
                    <span className="calc-detail">
                      {aliceDisorderResult.timePassed.toFixed(1)}s / 10s
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {(
                      (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                      (ANOMALY_DEFINITIONS[
                        aliceDisorderResult.previousAttribute
                      ]?.disorderFormula.baseMultiplier || 0)
                    ).toLocaleString()}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-bonus">
                    {aliceDisorderResult.multiplier.toFixed(2)}×
                  </div>
                </div>

                {/* ⑤ Base DMG */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">⑤</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Base DMG</span>
                    <span className="calc-detail">ATK × Total Multiplier</span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {Math.round(
                      (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                        aliceDisorderResult.multiplier,
                    ).toLocaleString()}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-value">
                    {Math.round(
                      (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                        aliceDisorderResult.multiplier,
                    ).toLocaleString()}
                  </div>
                </div>

                {/* ⑥ DMG% Mod */}
                {(() => {
                  const beforeValue =
                    (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                    aliceDisorderResult.multiplier;
                  const dmgMod = aliceDisorderResult.dmgMod || 1;
                  const withDMG = beforeValue * dmgMod;
                  const dmgPercent = Math.round((dmgMod - 1) * 100 * 10) / 10;
                  return (
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑥</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">DMG% Mod</span>
                        <span className="calc-detail">
                          +{dmgPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(beforeValue).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(withDMG).toLocaleString()}
                      </div>
                    </div>
                  );
                })()}

                {/* ⑦ Disorder Bonus (Polarized) */}
                {(() => {
                  const beforeValue =
                    (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                    aliceDisorderResult.multiplier;
                  const dmgMod = aliceDisorderResult.dmgMod || 1;
                  const withDMG = beforeValue * dmgMod;
                  const buffMod = aliceDisorderResult.buffMod || 1;
                  const withBuff = withDMG * buffMod;
                  const buffPercent = Math.round((buffMod - 1) * 100 * 10) / 10;
                  return (
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑦</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">
                          Polarized Disorder Bonus
                        </span>
                        <span className="calc-detail">
                          +{buffPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(withDMG).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(withBuff).toLocaleString()}
                      </div>
                    </div>
                  );
                })()}

                {/* ⑧ Stun (si > 0) */}
                {stunMultiplier > 0 && (
                  <div className="anomaly-grid-row stun-row">
                    <div className="anomaly-row-cell step">⑧</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Stun</span>
                      <span className="calc-detail">+{stunMultiplier}%</span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {Math.round(
                        (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                          aliceDisorderResult.multiplier *
                          (1 + (aliceDisorderResult.totalBonusDamageUsed || 0)),
                      ).toLocaleString()}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-stun">
                      {Math.round(
                        (aliceDisorderResult.sourceAtk || unifiedStats.atk) *
                          aliceDisorderResult.multiplier *
                          (1 +
                            (aliceDisorderResult.totalBonusDamageUsed || 0)) *
                          (1 + stunMultiplier / 100),
                      ).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Total final */}
                <div className="anomaly-grid-total-row">
                  <div className="anomaly-row-cell step">☑</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="total-label">
                      Final Polarized Disorder DMG
                    </span>
                    <span className="total-target">
                      vs {selectedEnemy?.name}
                    </span>
                  </div>
                  <div className="anomaly-row-cell before" />
                  <div className="anomaly-row-cell arrow">=</div>
                  <div className="anomaly-row-cell after total-value">
                    {aliceDisorderResult.realDamage.toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ⭐ ALICE — Physical Anomaly Additional DMG */}
      {agent.id === "alice" && (
        <div className="anomaly_summary-main_wrapper">
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="/ztunner/resources/images/icons/attributes/Physical.png"
                alt="Physical"
                className="anomaly-attribute-icon"
              />
              <span className="anomaly-title-text">
                Alice's Additional Assault DMG
              </span>
            </div>
          </div>
          <div className="disorder-selector-wrapper alice-separation">
            <div className="disorder-selector-header">
              <label>Physical Anomaly Source:</label>
            </div>
            <div className="alice-buttons-separation">
              {/* Botón "Alice (self)" */}
              <button
                className={`attribute-flux-btn ${aliceAssaultSourceSlot === currentSlotIndex ? "active" : "inactive"}`}
                style={{ "--btn-color": agent.themeColor || "#4fc3f7" }}
                onClick={() => setAliceAssaultSourceSlot(currentSlotIndex)}
              >
                Alice (self)
              </button>

              {/* Botones de otros slots con atributo Físico */}
              {teamSlotsInfo
                ?.filter(
                  (s) =>
                    s.slotIndex !== currentSlotIndex &&
                    s.agentName !== "Empty" &&
                    s.attribute?.toLowerCase() === "physical",
                )
                .map((s) => {
                  const agentData = agents.find(
                    (a) =>
                      a.displayName === s.agentName || a.name === s.agentName,
                  );
                  const color = agentData?.themeColor || "#4fc3f7";
                  const isActive = aliceAssaultSourceSlot === s.slotIndex;

                  return (
                    <button
                      key={s.slotIndex}
                      className={`attribute-flux-btn ${isActive ? "active" : "inactive"}`}
                      style={{ "--btn-color": color }}
                      onClick={() => setAliceAssaultSourceSlot(s.slotIndex)}
                    >
                      Slot {s.slotIndex + 1}: {s.agentName}
                    </button>
                  );
                })}

              {/* Botón "None" */}
              <button
                className={`attribute-flux-btn ${aliceAssaultSourceSlot === null ? "active" : "inactive"}`}
                style={{ "--btn-color": "#ff6b6b" }}
                onClick={() => setAliceAssaultSourceSlot(null)}
              >
                None
              </button>
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
            {selectedEnemy && aliceAssaultSourceSlot !== null ? (
              (() => {
                const isSelf = aliceAssaultSourceSlot === currentSlotIndex;
                let sourceAssaultResult;
                if (isSelf) {
                  if (!anomalyResult) {
                    return (
                      <div className="anomaly-grid-row">
                        <div
                          className="anomaly-row-cell"
                          style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            color: "#888",
                            padding: "16px 0",
                          }}
                        >
                          No anomaly result available
                        </div>
                      </div>
                    );
                  }
                  sourceAssaultResult = anomalyResult;
                } else {
                  const result = slotAnomalyResults?.[aliceAssaultSourceSlot];
                  if (!result?.anomalyResult) {
                    return (
                      <div className="anomaly-grid-row">
                        <div
                          className="anomaly-row-cell"
                          style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            color: "#888",
                            padding: "16px 0",
                          }}
                        >
                          No anomaly result available for this slot
                        </div>
                      </div>
                    );
                  }
                  sourceAssaultResult = result.anomalyResult;
                }
                const tickCount = Math.floor(10 / 0.95);
                const tickDamage = Math.round(
                  sourceAssaultResult.realDamage * 0.025,
                );
                const totalTickDamage = tickDamage * tickCount;
                return (
                  <>
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">①</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base Assault DMG</span>
                        <span className="calc-detail">
                          {" "}
                          from{" "}
                          {isSelf
                            ? "Alice"
                            : teamSlotsInfo?.find(
                                (s) => s.slotIndex === aliceAssaultSourceSlot,
                              )?.agentName || "Other"}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {sourceAssaultResult?.realDamage?.toLocaleString() ??
                          "0"}
                      </div>
                    </div>
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">②</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Tick DMG (2.5%)</span>
                        <span className="calc-detail">× {tickCount} ticks</span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {sourceAssaultResult?.realDamage?.toLocaleString() ??
                          "0"}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {tickDamage.toLocaleString()} × {tickCount}
                      </div>
                    </div>
                    <div className="anomaly-grid-total-row">
                      <div className="anomaly-row-cell step">☑</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="total-label">
                          {" "}
                          Total Additional DMG{" "}
                        </span>
                        <span className="total-target">
                          {" "}
                          from Physical Anomaly{" "}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before" />
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after total-value">
                        {totalTickDamage.toLocaleString()}
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="anomaly-grid-row">
                <div className="anomaly-row-cell alice-verification">
                  Select a Physical Anomaly Source above
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⭐ Yanagi - Polarity Disorder */}
      {agent.id === "yanagi" && showDisorderSection && (
        <div className="anomaly_summary-main_wrapper" style={{ marginTop: 16 }}>
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="/ztunner/resources/images/icons/attributes/Electric.png"
                alt="Electric"
                className="anomaly-attribute-icon"
              />
              <span className="anomaly-title-text">
                {" "}
                Yanagi's Polarity Disorder{" "}
              </span>
            </div>
          </div>

          <div
            className="disorder-selector-wrapper"
            style={{ paddingBottom: 0 }}
          >
            <div className="disorder-selector-header">
              <label>Select Anomaly Source:</label>
            </div>
            <div className="disorder-selector-neon">
              <NeonSelect
                value={
                  selectedYanagiSlot
                    ? selectedYanagiSlot.label
                    : "Select anomaly..."
                }
                options={[
                  { value: "none", label: "None" },
                  ...getPolarityOptions().map((opt) => ({
                    value: `${opt.slotIndex}:${opt.attribute}${opt.isSelf ? ":self" : ""}`,
                    label: opt.label,
                  })),
                ]}
                onChange={(value) => {
                  if (value === "none") {
                    setYanagiPolaritySource(null);
                    return;
                  }
                  if (value) {
                    const parts = value.split(":");
                    const slotIndex = parseInt(parts[0], 10);
                    const attribute = parts[1];
                    const isSelf = parts[2] === "self";
                    const selected = getPolarityOptions().find(
                      (opt) =>
                        opt.slotIndex === slotIndex &&
                        opt.attribute === attribute &&
                        (opt.isSelf || false) === isSelf,
                    );
                    if (selected) setYanagiPolaritySource(selected);
                  } else {
                    setYanagiPolaritySource(null);
                  }
                }}
                theme={agent?.themeColor || "#7EFFDB"}
                variant="enemy"
              />
            </div>
          </div>

          <div className="disorder_slider_selector" style={{ marginTop: 10 }}>
            <label>Polarity Time Remaining</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={yanagiPolarityTimeRemaining}
                onChange={(e) =>
                  setYanagiPolarityTimeRemaining(Number(e.target.value))
                }
                style={
                  {
                    "--fill": `${(yanagiPolarityTimeRemaining / 10) * 100}%`,
                    "--theme": agent?.themeColor || "#ff4684",
                  } as React.CSSProperties
                }
              />
              <span className="slider-value">
                {yanagiPolarityTimeRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="slider-time-passed">
              Time Passed:{" "}
              <strong>{(10 - yanagiPolarityTimeRemaining).toFixed(1)}s</strong>
            </div>
          </div>

          {/* Grid contenedor de resultados o mensajes */}
          <div className="anomaly-grid" style={{ marginTop: 8 }}>
            {!selectedYanagiSlot && (
              <>
                <div className="anomaly-grid-header-row">
                  <div className="anomaly-header-cell step">#</div>
                  <div className="anomaly-header-cell calculation">
                    {" "}
                    Calculation{" "}
                  </div>
                  <div className="anomaly-header-cell before">Before</div>
                  <div className="anomaly-header-cell arrow">→</div>
                  <div className="anomaly-header-cell after">After</div>
                </div>
                <div className="anomaly-grid-row">
                  <div
                    className="anomaly-row-cell alice-verification"
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    There's no Disorder selected for calculation
                  </div>
                </div>
              </>
            )}

            {selectedYanagiSlot &&
              (() => {
                const result = calculatePolarityFromScratch(
                  selectedYanagiSlot,
                  true,
                );
                if (!result) {
                  return (
                    <div className="anomaly-grid-row">
                      <div
                        className="anomaly-row-cell alice-verification"
                        style={{
                          gridColumn: "1 / -1",
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        Error calculating result
                      </div>
                    </div>
                  );
                }
                if (
                  result.disorderRealDamage === 0 &&
                  result.finalDamage === 0
                ) {
                  return (
                    <>
                      <div className="anomaly-grid-header-row">
                        <div className="anomaly-header-cell step">#</div>
                        <div className="anomaly-header-cell calculation">
                          {" "}
                          Calculation{" "}
                        </div>
                        <div className="anomaly-header-cell before">Before</div>
                        <div className="anomaly-header-cell arrow">→</div>
                        <div className="anomaly-header-cell after">After</div>
                      </div>
                      <div className="anomaly-grid-row">
                        <div
                          className="anomaly-row-cell alice-verification"
                          style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          There's not a valid previous anomaly for this source.
                        </div>
                      </div>
                    </>
                  );
                }

                const def = ANOMALY_DEFINITIONS[result.sourceAttribute];
                const baseMultiplier = def?.disorderFormula.baseMultiplier || 0;
                const perSecond =
                  def?.disorderFormula.perSecondFormula(
                    result.timePassed || 0,
                  ) || 0;
                const totalMultiplier = result.disorderMultiplier;
                const dmgPercent = Math.round((result.dmgMod - 1) * 100);
                const buffPercent = Math.round((result.buffMod - 1) * 100);

                return (
                  <>
                    <div className="anomaly-grid-header-row">
                      <div className="anomaly-header-cell step">#</div>
                      <div className="anomaly-header-cell calculation">
                        {" "}
                        Calculation{" "}
                      </div>
                      <div className="anomaly-header-cell before">Before</div>
                      <div className="anomaly-header-cell arrow">→</div>
                      <div className="anomaly-header-cell after">After</div>
                    </div>

                    {/* ① Previous Anomaly */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">①</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Previous Anomaly</span>
                        <span className="calc-detail">
                          {def?.anomalyType || result.sourceAttribute}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">→</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {def?.anomalyType || result.sourceAttribute}
                      </div>
                    </div>

                    {/* ② Base Multiplier */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">②</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base Multiplier</span>
                        <span className="calc-detail">{`${(baseMultiplier * 100).toFixed(0)}% + ${(perSecond * 100).toFixed(0)}%`}</span>
                      </div>
                      <div className="anomaly-row-cell before">{`${(baseMultiplier * 100).toFixed(0)}%`}</div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {(totalMultiplier * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* ③ Time Passed */}
                    <div className="anomaly-grid-row highlight-row">
                      <div className="anomaly-row-cell step">③</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Time Passed</span>
                        <span className="calc-detail">
                          {result.timePassed.toFixed(1)}s / 10s
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {totalMultiplier.toFixed(2)}×
                      </div>
                    </div>

                    {/* ④ Base DMG */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">④</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base DMG</span>
                        <span className="calc-detail">
                          ATK × Total Multiplier
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* ⑤ DMG% Mod */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑤</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">DMG% Mod</span>
                        <span className="calc-detail">+{dmgPercent}%</span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage / result.buffMod,
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(
                          result.disorderRealDamage / result.buffMod,
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* ⑥ Disorder Bonus */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑥</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Disorder Bonus</span>
                        <span className="calc-detail">+{buffPercent}%</span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage / result.dmgMod,
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                    </div>

                    {/* ⑦ Final Disorder DMG */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑦</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Final Disorder DMG</span>
                        <span className="calc-detail">
                          (after DEF &amp; STUN)
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                    </div>

                    {/* ⑧ Polarity */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑧</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">
                          Polarity {result.polarityPercent * 100}%
                        </span>
                        <span className="calc-detail">
                          final × {result.polarityPercent}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(result.polarityDamage).toLocaleString()}
                      </div>
                    </div>

                    {/* ⑨ AP Contribution (solo Yanagi) */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑨</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">AP Contribution</span>
                        <span className="calc-detail">AP × 7.25</span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">+</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {Math.round(result.apContribution).toLocaleString()}
                      </div>
                    </div>

                    {/* Total final */}
                    <div className="anomaly-grid-total-row">
                      <div className="anomaly-row-cell step">☑</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="total-label">
                          {" "}
                          ⚡ Polarity Disorder DMG{" "}
                        </span>
                        <span className="total-target">
                          {" "}
                          (Anomaly NOT removed){" "}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before" />
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after total-value">
                        {Math.round(result.finalDamage).toLocaleString()}
                      </div>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}

      {/* ⭐ Nangong Yu - Polarity Disorder */}
      {agent.id === "nangong_yu" && showDisorderSection && (
        <div className="anomaly_summary-main_wrapper" style={{ marginTop: 16 }}>
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="/ztunner/resources/images/icons/attributes/Ether.png"
                alt="Ether"
                className="anomaly-attribute-icon"
              />
              <span className="anomaly-title-text">
                {" "}
                Nangong Yu's Polarity Disorder{" "}
              </span>
            </div>
          </div>

          <div
            className="disorder-selector-wrapper"
            style={{ paddingBottom: 0 }}
          >
            <div className="disorder-selector-header">
              <label>Select Anomaly Source:</label>
            </div>
            <div className="disorder-selector-neon">
              <NeonSelect
                value={
                  localNangongSource
                    ? localNangongSource.label
                    : "Select anomaly..."
                }
                options={[
                  { value: "none", label: "None" },
                  ...getPolarityOptions()
                    .filter((opt) => !opt.isSelf)
                    .map((opt) => ({
                      value: `${opt.slotIndex}:${opt.attribute}`,
                      label: opt.label,
                    })),
                ]}
                onChange={(value) => {
                  if (value === "none") {
                    setNangongPolaritySource(null);
                    return;
                  }
                  if (value) {
                    const [slotIndex, attribute] = value.split(":");
                    const selected = getPolarityOptions().find(
                      (opt) =>
                        opt.slotIndex === parseInt(slotIndex) &&
                        opt.attribute === attribute &&
                        !opt.isSelf,
                    );
                    if (selected) setNangongPolaritySource(selected);
                  } else {
                    setNangongPolaritySource(null);
                  }
                }}
                theme={agent?.themeColor || "#7EFFDB"}
                variant="enemy"
              />
            </div>
          </div>

          <div className="disorder_slider_selector" style={{ marginTop: 10 }}>
            <label>Polarity Time Remaining</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={nangongPolarityTimeRemaining}
                onChange={(e) =>
                  setNangongPolarityTimeRemaining(Number(e.target.value))
                }
                style={
                  {
                    "--fill": `${(nangongPolarityTimeRemaining / 10) * 100}%`,
                    "--theme": agent?.themeColor || "#ff4684",
                  } as React.CSSProperties
                }
              />
              <span className="slider-value">
                {nangongPolarityTimeRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="slider-time-passed">
              Time Passed:{" "}
              <strong>{(10 - nangongPolarityTimeRemaining).toFixed(1)}s</strong>
            </div>
          </div>

          {/* Grid siempre visible */}
          <div className="anomaly-grid" style={{ marginTop: 8 }}>
            {/* Header de la grid */}
            <div className="anomaly-grid-header-row">
              <div className="anomaly-header-cell step">#</div>
              <div className="anomaly-header-cell calculation">
                {" "}
                Calculation{" "}
              </div>
              <div className="anomaly-header-cell before">Before</div>
              <div className="anomaly-header-cell arrow">→</div>
              <div className="anomaly-header-cell after">After</div>
            </div>

            {!localNangongSource ? (
              <div className="anomaly-grid-row">
                <div
                  className="anomaly-row-cell alice-verification"
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    color: "#888",
                    padding: "16px 0",
                  }}
                >
                  There's no Disorder selected for calculation
                </div>
              </div>
            ) : (
              (() => {
                const result = calculatePolarityFromScratch(
                  localNangongSource,
                  false,
                );
                if (
                  !result ||
                  (result.disorderRealDamage === 0 && result.finalDamage === 0)
                ) {
                  return (
                    <div className="anomaly-grid-row">
                      <div
                        className="anomaly-row-cell alice-verification"
                        style={{
                          gridColumn: "1 / -1",
                          textAlign: "center",
                          color: "#888",
                          padding: "16px 0",
                        }}
                      >
                        There's not a valid previous anomaly for this source.
                      </div>
                    </div>
                  );
                }

                const def = ANOMALY_DEFINITIONS[result.sourceAttribute];
                const baseMultiplier = def?.disorderFormula.baseMultiplier || 0;
                const perSecond =
                  def?.disorderFormula.perSecondFormula(
                    result.timePassed || 0,
                  ) || 0;
                const totalMultiplier = result.disorderMultiplier;
                const dmgPercent = Math.round((result.dmgMod - 1) * 100);
                const buffPercent = Math.round((result.buffMod - 1) * 100);

                return (
                  <>
                    {/* ① Previous Anomaly */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">①</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Previous Anomaly</span>
                        <span className="calc-detail">
                          {def?.anomalyType || result.sourceAttribute}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">→</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {def?.anomalyType || result.sourceAttribute}
                      </div>
                    </div>

                    {/* ② Base Multiplier */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">②</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base Multiplier</span>
                        <span className="calc-detail">
                          {`${(baseMultiplier * 100).toFixed(0)}% + ${(perSecond * 100).toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">{`${(baseMultiplier * 100).toFixed(0)}%`}</div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {(totalMultiplier * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* ③ Time Passed */}
                    <div className="anomaly-grid-row highlight-row">
                      <div className="anomaly-row-cell step">③</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Time Passed</span>
                        <span className="calc-detail">
                          {result.timePassed.toFixed(1)}s / 10s
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {totalMultiplier.toFixed(2)}×
                      </div>
                    </div>

                    {/* ④ Base DMG */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">④</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base DMG</span>
                        <span className="calc-detail">
                          ATK × Total Multiplier
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {Math.round(
                          result.disorderRealDamage /
                            (result.dmgMod * result.buffMod),
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* ⑤ DMG% Mod */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑤</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">DMG% Mod</span>
                        <span className="calc-detail">+{dmgPercent}%</span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage / result.buffMod,
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(
                          result.disorderRealDamage / result.buffMod,
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* ⑥ Disorder Bonus */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑥</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Disorder Bonus</span>
                        <span className="calc-detail">+{buffPercent}%</span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          result.disorderRealDamage / result.dmgMod,
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                    </div>

                    {/* ⑦ Final Disorder DMG */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑦</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Final Disorder DMG</span>
                        <span className="calc-detail">
                          (after DEF &amp; STUN)
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                    </div>

                    {/* ⑧ Polarity */}
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">⑧</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">
                          Polarity {result.polarityPercent * 100}%
                        </span>
                        <span className="calc-detail">
                          final × {result.polarityPercent}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {result.disorderRealDamage.toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {Math.round(result.polarityDamage).toLocaleString()}
                      </div>
                    </div>

                    {/* Total final */}
                    <div className="anomaly-grid-total-row">
                      <div className="anomaly-row-cell step">☑</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="total-label">
                          {" "}
                          💫 Polarity Disorder DMG{" "}
                        </span>
                        <span className="total-target">
                          {" "}
                          (AoE · Anomaly NOT removed){" "}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before" />
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after total-value">
                        {Math.round(result.finalDamage).toLocaleString()}
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* ⭐ VORTEX "PRESTADO" - Para agentes no-Wind con aliado Wind */}
      {showBorrowedVortex &&
        !isWindAgent &&
        getWindSlotsOptions().length > 0 && (
          <div
            className="anomaly_summary-main_wrapper"
            style={{ marginTop: 16 }}
          >
            <div className="anomaly-grid-header">
              <div className="anomaly-title-with-icon">
                <span className="no-img-icon">🌪️</span>
                <span className="anomaly-title-text">
                  {" "}
                  Vortex DMG (from Wind Ally){" "}
                </span>
              </div>
            </div>
            {/* Selector de fuente Wind */}
            <div
              className="disorder-selector-wrapper"
              style={{ paddingBottom: 0 }}
            >
              <div className="disorder-selector-header">
                <label>Select Wind Agent Source:</label>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                {getWindSlotsOptions().map((opt) => {
                  const isSelected = vortexSourceSlot === opt.slotIndex;
                  return (
                    <button
                      key={opt.slotIndex}
                      className={`polarity-btn ${isSelected ? "active" : ""}`}
                      onClick={() => setVortexSourceSlot(opt.slotIndex)}
                      style={{
                        padding: "6px 14px",
                        fontFamily: "ZZZ",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        border: `2px solid ${
                          isSelected
                            ? agent.themeColor || "#7EFFDB"
                            : "rgba(255,255,255,0.2)"
                        }`,
                        color: isSelected ? "#000" : "rgba(255,255,255,0.8)",
                        background: isSelected
                          ? agent.themeColor || "#7EFFDB"
                          : "rgba(255,255,255,0.08)",
                        boxShadow: isSelected
                          ? `0 0 12px ${agent.themeColor || "#7EFFDB"}44`
                          : "none",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  className={`polarity-btn ${vortexSourceSlot === null ? "active" : ""}`}
                  onClick={() => setVortexSourceSlot(null)}
                  style={{
                    padding: "6px 14px",
                    fontFamily: "ZZZ",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: `2px solid ${
                      vortexSourceSlot === null
                        ? "#ff6b6b"
                        : "rgba(255,255,255,0.2)"
                    }`,
                    color:
                      vortexSourceSlot === null
                        ? "#fff"
                        : "rgba(255,255,255,0.8)",
                    background:
                      vortexSourceSlot === null
                        ? "#ff6b6b"
                        : "rgba(255,255,255,0.08)",
                    boxShadow:
                      vortexSourceSlot === null ? "0 0 12px #ff6b6b44" : "none",
                    fontWeight: vortexSourceSlot === null ? "bold" : "normal",
                  }}
                >
                  None
                </button>
              </div>
            </div>
            {/* Slider de tiempo */}
            {vortexSourceSlot !== null && (
              <>
                <div className="disorder_slider_selector">
                  <label>Time Remaining (Non-Wind Anomaly):</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={vortexTimeRemaining}
                      onChange={(e) =>
                        setVortexTimeRemaining(Number(e.target.value))
                      }
                      style={
                        {
                          "--fill": `${(vortexTimeRemaining / 10) * 100}%`,
                          "--theme": agent?.themeColor || "#ff4684",
                        } as React.CSSProperties
                      }
                    />
                    <span className="slider-value">
                      {vortexTimeRemaining.toFixed(1)}s
                    </span>
                  </div>
                  <div className="slider-time-passed">
                    {" "}
                    Time Passed:{" "}
                    <strong>{(10 - vortexTimeRemaining).toFixed(1)}s</strong>
                  </div>
                </div>
                {/* Grid de resultados del Vortex prestado */}
                {vortexResult && (
                  <div className="anomaly-grid" style={{ marginTop: 8 }}>
                    <div className="anomaly-grid-header-row">
                      <div className="anomaly-header-cell step">#</div>
                      <div className="anomaly-header-cell calculation">
                        {" "}
                        Calculation{" "}
                      </div>
                      <div className="anomaly-header-cell before">Before</div>
                      <div className="anomaly-header-cell arrow">→</div>
                      <div className="anomaly-header-cell after">After</div>
                    </div>
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">①</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Previous Anomaly</span>
                        <span className="calc-detail">
                          {ANOMALY_DEFINITIONS[agentAttribute]?.anomalyType ||
                            agentAttribute}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">—</div>
                      <div className="anomaly-row-cell arrow">→</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {ANOMALY_DEFINITIONS[agentAttribute]?.anomalyType ||
                          agentAttribute}
                      </div>
                    </div>
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">②</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base Multiplier</span>
                        <span className="calc-detail">
                          {(() => {
                            const def = ANOMALY_DEFINITIONS[agentAttribute];
                            if (!def?.vortexFormula) return "—";
                            const { base, perSecond, perTick } =
                              def.vortexFormula;
                            let formula = `${(base * 100).toFixed(0)}%`;
                            if (perTick) {
                              formula += ` + [t/0.5]*${(perTick * 100).toFixed(0)}%`;
                            } else if (perSecond) {
                              formula += ` + t*${(perSecond * 100).toFixed(0)}%`;
                            }
                            return formula;
                          })()}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {`${(ANOMALY_DEFINITIONS[agentAttribute]?.vortexFormula?.base || 0) * 100}%`}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-ap">
                        {(vortexResult.multiplier * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="anomaly-grid-row highlight-row">
                      <div className="anomaly-row-cell step">③</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Time Remaining</span>
                        <span className="calc-detail">
                          {vortexResult.timeRemaining.toFixed(1)}s / 10s
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {(
                          (vortexResult.sourceAtk ?? 0) *
                          (ANOMALY_DEFINITIONS[agentAttribute]?.vortexFormula
                            ?.base || 0)
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-bonus">
                        {vortexResult.multiplier.toFixed(2)}×
                      </div>
                    </div>
                    <div className="anomaly-grid-row">
                      <div className="anomaly-row-cell step">④</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="calc-label">Base DMG</span>
                        <span className="calc-detail">
                          {" "}
                          ATK × Total Multiplier{" "}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before">
                        {Math.round(
                          vortexResult.sourceAtk ?? 0,
                        ).toLocaleString()}
                      </div>
                      <div className="anomaly-row-cell arrow">×</div>
                      <div className="anomaly-row-cell after highlight-value">
                        {Math.round(
                          (vortexResult.sourceAtk ?? 0) *
                            vortexResult.multiplier,
                        ).toLocaleString()}
                      </div>
                    </div>
                    {/* Paso ⑤: DMG% Mod */}
                    {(() => {
                      const beforeValue =
                        (vortexResult.sourceAtk ?? 0) * vortexResult.multiplier;
                      const dmgMod = vortexResult.dmgMod ?? 1;
                      const withDMG = beforeValue * dmgMod;
                      const dmgPercent =
                        Math.round((dmgMod - 1) * 100 * 10) / 10;
                      return (
                        <div className="anomaly-grid-row">
                          <div className="anomaly-row-cell step">⑤</div>
                          <div className="anomaly-row-cell calculation">
                            <span className="calc-label">DMG% Mod</span>
                            <span className="calc-detail">
                              {" "}
                              +{dmgPercent.toFixed(1)}%{" "}
                            </span>
                          </div>
                          <div className="anomaly-row-cell before">
                            {Math.round(beforeValue).toLocaleString()}
                          </div>
                          <div className="anomaly-row-cell arrow">×</div>
                          <div className="anomaly-row-cell after highlight-bonus">
                            {Math.round(withDMG).toLocaleString()}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Paso ⑥: Vortex Bonus */}
                    {(() => {
                      const beforeValue =
                        (vortexResult.sourceAtk ?? 0) * vortexResult.multiplier;
                      const dmgMod = vortexResult.dmgMod ?? 1;
                      const withDMG = beforeValue * dmgMod;
                      const buffMod = vortexResult.buffMod ?? 1;
                      const withBuff = withDMG * buffMod;
                      const buffPercent =
                        Math.round((buffMod - 1) * 100 * 10) / 10;
                      return (
                        <div className="anomaly-grid-row">
                          <div className="anomaly-row-cell step">⑥</div>
                          <div className="anomaly-row-cell calculation">
                            <span className="calc-label">Vortex Bonus</span>
                            <span className="calc-detail">
                              {" "}
                              +{buffPercent.toFixed(1)}%{" "}
                            </span>
                          </div>
                          <div className="anomaly-row-cell before">
                            {Math.round(withDMG).toLocaleString()}
                          </div>
                          <div className="anomaly-row-cell arrow">×</div>
                          <div className="anomaly-row-cell after highlight-bonus">
                            {Math.round(withBuff).toLocaleString()}
                          </div>
                        </div>
                      );
                    })()}
                    {stunMultiplier > 0 && (
                      <div className="anomaly-grid-row stun-row">
                        <div className="anomaly-row-cell step">⑦</div>
                        <div className="anomaly-row-cell calculation">
                          <span className="calc-label">Stun</span>
                          <span className="calc-detail">
                            {" "}
                            +{stunMultiplier}%{" "}
                          </span>
                        </div>
                        <div className="anomaly-row-cell before">
                          {Math.round(
                            (vortexResult.sourceAtk ?? 0) *
                              vortexResult.multiplier *
                              (1 + vortexResult.totalBonusDamageUsed),
                          ).toLocaleString()}
                        </div>
                        <div className="anomaly-row-cell arrow">×</div>
                        <div className="anomaly-row-cell after highlight-stun">
                          {Math.round(
                            (vortexResult.sourceAtk ?? 0) *
                              vortexResult.multiplier *
                              (1 + vortexResult.totalBonusDamageUsed) *
                              (1 + stunMultiplier / 100),
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div className="anomaly-grid-total-row">
                      <div className="anomaly-row-cell step">☑</div>
                      <div className="anomaly-row-cell calculation">
                        <span className="total-label">
                          {" "}
                          Final Vortex DMG (from {vortexResult.sourceAgentName})
                        </span>
                        <span className="total-target">
                          {" "}
                          vs {selectedEnemy.name}{" "}
                        </span>
                      </div>
                      <div className="anomaly-row-cell before" />
                      <div className="anomaly-row-cell arrow">=</div>
                      <div className="anomaly-row-cell after total-value">
                        {vortexResult.realDamage.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
    </div>
  );
}
