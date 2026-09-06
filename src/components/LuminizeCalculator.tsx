import { useState, useEffect, useMemo } from "react";
import type { Agent, UnifiedStats } from "@/types/Agent";
import type { Enemy } from "@/types/Enemy";
import type { CollectedBonuses } from "@/utils/damageBonusCollector";
import type { AnomalyBonuses } from "@/utils/anomalyBonusCollector";
import NeonSelect from "@/components/NeonSelect";
import { ANOMALY_DEFINITIONS, type AttributeType } from "@/types/Anomaly";
import { calculateElementalResistance } from "@/utils/resistanceCalculator";
import {
  defaultCalculatorState,
  type CalculatorUIState,
} from "@/context/SessionContext";

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
}: Props) {
  const { luminizeSourceSlot, luminizeSelectedSkillId, luminizeSkillLevel } =
    calculatorState;

  const setLuminizeSourceSlot = (slot: number | null) => {
    onCalculatorStateChange((prev) => ({ ...prev, luminizeSourceSlot: slot }));
  };

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
  const voidflareData = useMemo(() => {
    if (luminizeSourceSlot === null || !slotAnomalyResults[luminizeSourceSlot])
      return null;
    const anomalyResult = slotAnomalyResults[luminizeSourceSlot]?.anomalyResult;
    if (!anomalyResult) return null;

    // 🔥 Quitar el DMG% del realDamage usando dmgMod
    let sourceAnomalyDamage = 0;
    if (anomalyResult.dmgMod && anomalyResult.dmgMod > 0) {
      sourceAnomalyDamage =
        (anomalyResult.realDamage || 0) / anomalyResult.dmgMod;
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
    };
  }, [luminizeSourceSlot, slotAnomalyResults, sourceAttribute, sourceSlotInfo]);

  const result = useMemo(() => {
    if (!voidflareData || !selectedSkill || !selectedEnemy) return null;

    const {
      voidflare,
      sourceName,
      anomalyType,
      sourceAnomalyDamage,
      baseMultiplier,
    } = voidflareData;

    const baseLuminizeMult = getLuminizeMultiplier();
    const luminizeBonus = unifiedStats._luminizeMultiplierBonus || 0;
    const totalLuminizeMult = baseLuminizeMult * (1 + luminizeBonus);
    const globalFactor = 1 + (damageBonuses?.global || 0);
    //const globalFactor = 1;
    const anomalyFactor = 1 + (anomalyBonuses?.anomalyDmgBonus || 0);
    const rawDamage =
      voidflare * totalLuminizeMult * globalFactor * anomalyFactor;

    let resMultiplier = 1;
    if (selectedEnemy) {
      const resCalc = calculateElementalResistance(
        selectedEnemy,
        sourceAttribute,
        activeEffects,
        undefined,
        undefined,
        false,
        false,
        true,
      );
      resMultiplier = resCalc.damageMultiplier;
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
      globalFactor,
      anomalyFactor,
      resMultiplier,
      rawDamage,
      damageAfterRes,
      finalDamage,
      stunMultiplier,
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
  ]);

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-US");

  const sourceOptions = teamSlotsInfo
    .filter((s) => s.slotIndex !== currentSlotIndex && s.agentName !== "Empty")
    .map((s) => ({
      value: String(s.slotIndex),
      label: `Slot ${s.slotIndex + 1}: ${s.agentName} (${s.agent?.attribute || "Unknown"})`,
    }));

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
            Multiplier: {(getLuminizeMultiplier() * 100).toFixed(1)}% (Lv.{" "}
            {luminizeSkillLevel})
            {result && result.luminizeBonus > 0 && (
              <span style={{ color: theme }}>
                {" "}
                +
                {(
                  (result.totalLuminizeMult - result.baseLuminizeMult) *
                  100
                ).toFixed(1)}
                % bonus
              </span>
            )}
          </p>
        </div>
      </div>

      {result ? (
        <div className="anomaly_summary-main_wrapper" style={{ marginTop: 16 }}>
          <div className="anomaly-grid-header">
            <div className="anomaly-title-with-icon">
              <img
                src="{`${import.meta.env.BASE_URL}resources/images/icons/attributes/Lumiflux.png"
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
            <div className="anomaly-grid-row">
              <div className="anomaly-row-cell step">①</div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Voidflare</span>
                <span className="calc-detail">
                  {result.sourceName}'s {result.anomalyType} /{" "}
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

            {/* ③ Global DMG Factor */}
            <div className="anomaly-grid-row">
              <div className="anomaly-row-cell step">③</div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Global DMG Factor</span>
                <span className="calc-detail">
                  +{((result.globalFactor - 1) * 100).toFixed(1)}%
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
                    result.globalFactor,
                )}
              </div>
            </div>

            {/* ④ Anomaly DMG Factor */}
            <div className="anomaly-grid-row">
              <div className="anomaly-row-cell step">④</div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Anomaly DMG Factor</span>
                <span className="calc-detail">
                  +{((result.anomalyFactor - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="anomaly-row-cell before">
                {formatNumber(
                  result.voidflare *
                    result.totalLuminizeMult *
                    result.globalFactor,
                )}
              </div>
              <div className="anomaly-row-cell arrow">×</div>
              <div className="anomaly-row-cell after highlight-bonus">
                {formatNumber(
                  result.voidflare *
                    result.totalLuminizeMult *
                    result.globalFactor *
                    result.anomalyFactor,
                )}
              </div>
            </div>

            {/* ⑤ Resistance Factor (nuevo) */}
            <div className="anomaly-grid-row">
              <div className="anomaly-row-cell step">⑤</div>
              <div className="anomaly-row-cell calculation">
                <span className="calc-label">Resistance Factor</span>
                <span className="calc-detail">
                  {((1 - result.resMultiplier) * 100).toFixed(1)}% RES
                </span>
              </div>
              <div className="anomaly-row-cell before">
                {formatNumber(
                  result.voidflare *
                    result.totalLuminizeMult *
                    result.globalFactor *
                    result.anomalyFactor,
                )}
              </div>
              <div className="anomaly-row-cell arrow">×</div>
              <div className="anomaly-row-cell after highlight-bonus">
                {formatNumber(result.damageAfterRes)}
              </div>
            </div>

            {/* Stun (si > 0) */}
            {result.stunMultiplier > 0 && (
              <div className="anomaly-grid-row stun-row">
                <div className="anomaly-row-cell step">⑥</div>
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
                <span className="total-target">vs {selectedEnemy?.name}</span>
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
