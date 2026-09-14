import { useEffect, useMemo } from "react";
import type { Agent, UnifiedStats } from "@/types/Agent";
import type { Enemy } from "@/types/Enemy";
import type { DamageSkill } from "@/types/DamageSkill";
import type { CollectedBonuses } from "@/utils/damageBonusCollector";
import type { AnomalyBonuses } from "@/utils/anomalyBonusCollector";
import NeonSelect from "@/components/NeonSelect";
import { calculateElementalResistance } from "@/utils/resistanceCalculator";
import type { CalculatorUIState } from "@/context/SessionContext";

interface Props {
  agent: Agent;
  unifiedStats: UnifiedStats;
  selectedEnemy: Enemy | null;
  stunMultiplier: number;
  damageBonuses: CollectedBonuses;
  anomalyBonuses?: AnomalyBonuses;
  activeEffects: Record<string, { enabled: boolean; stacks: number }>;
  teamSlotsInfo?: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
    stats?: UnifiedStats;
    agent?: Agent;
  }>;
  currentSlotIndex?: number;
  theme?: string;
  calculatorState: CalculatorUIState;
  onCalculatorStateChange: (
    updater: (prev: CalculatorUIState) => CalculatorUIState,
  ) => void;
}

const MS1_MULTIPLIER = 1.3;
const ALC = 794;
const BANQUET_EFFECT_ID = "claret_flint-mindscape_1-bloodstained_chronicle";
const DEFAULT_MAIM_LEVEL = 11;

export default function MaimCalculator({
  agent,
  unifiedStats,
  selectedEnemy,
  stunMultiplier,
  damageBonuses,
  activeEffects,
  theme: propTheme,
  calculatorState,
  onCalculatorStateChange,
}: Props) {
  const theme = propTheme || agent.themeColor || "#8995D6";

  const { maimSelectedSkillId, maimSkillLevel, maimMindscape1Active } =
    calculatorState;

  const setMaimSelectedSkillId = (value: string | null) =>
    onCalculatorStateChange((prev) => ({
      ...prev,
      maimSelectedSkillId: value,
    }));
  const setMaimSkillLevel = (value: number) =>
    onCalculatorStateChange((prev) => ({
      ...prev,
      maimSkillLevel: value,
    }));
  const setMaimMindscape1Active = (value: boolean) =>
    onCalculatorStateChange((prev) => ({
      ...prev,
      maimMindscape1Active: value,
    }));

  const maimSkills = useMemo<DamageSkill[]>(() => {
    if (agent.specialty !== "Armorer") return [];
    const allSkills: DamageSkill[] = [
      ...(agent.skills?.basicAttacks || []),
      ...(agent.skills?.dashAttacks || []),
      ...(agent.skills?.dodgeCounters || []),
      ...(agent.skills?.specialAttacks || []),
      ...(agent.skills?.exSkills || []),
      ...(agent.skills?.ultimate || []),
      ...(agent.skills?.chainAttacks || []),
      ...(agent.skills?.quickAssists || []),
      ...(agent.skills?.perfectAssists || []),
      ...(agent.skills?.assistFollowup || []),
      ...(agent.skills?.mindscapeAbilities || []),
    ];
    return allSkills.filter((skill) =>
      skill.hits?.some((hit: any) => hit.name === "Maim Multiplier"),
    );
  }, [agent]);

  useEffect(() => {
    if (maimSkills.length > 0 && !maimSelectedSkillId) {
      setMaimSelectedSkillId(maimSkills[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maimSkills, maimSelectedSkillId]);

  const selectedSkill = maimSkills.find((s) => s.id === maimSelectedSkillId);

  useEffect(() => {
    if (!selectedSkill) return;
    const availableLevels = selectedSkill.levels.map((l) => l.level);
    if (availableLevels.length === 0) return;
    const maxLevel = Math.max(...availableLevels);
    const desired = maimSkillLevel ?? DEFAULT_MAIM_LEVEL;
    const clamped = Math.min(desired, maxLevel);
    if (!availableLevels.includes(clamped)) {
      const nearest = availableLevels.reduce((prev, curr) =>
        Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev,
      );
      if (nearest !== maimSkillLevel) setMaimSkillLevel(nearest);
    } else if (clamped !== maimSkillLevel) {
      setMaimSkillLevel(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkill, maimSkillLevel]);

  const effectiveSkillLevel = selectedSkill
    ? (maimSkillLevel ?? Math.max(...selectedSkill.levels.map((l) => l.level)))
    : DEFAULT_MAIM_LEVEL;

  const hasBanquetOfPaleBlood = useMemo(() => {
    if (agent.id !== "claret") return false;
    if (activeEffects[BANQUET_EFFECT_ID]?.enabled) return true;
    const effectDef: any = (agent as any).ingameEffects?.find(
      (e: any) => e.id === BANQUET_EFFECT_ID,
    );
    if (effectDef?.infoOnly) return true;

    return false;
  }, [agent, activeEffects]);

  const getBaseMaimMultiplier = (): number => {
    if (!selectedSkill) return 0;
    const levelData = selectedSkill.levels.find(
      (l) => l.level === effectiveSkillLevel,
    );
    if (!levelData) return 0;
    const hitIndex = selectedSkill.hits.findIndex(
      (hit: any) => hit.name === "Maim Multiplier",
    );
    if (hitIndex === -1) return 0;
    return levelData.multipliers[hitIndex] / 100;
  };

  const baseMaimMult = getBaseMaimMultiplier();
  const effectiveMaimMult =
    maimMindscape1Active && hasBanquetOfPaleBlood
      ? baseMaimMult * MS1_MULTIPLIER
      : baseMaimMult;

  const result = useMemo(() => {
    if (!selectedSkill || !selectedEnemy || effectiveMaimMult === 0)
      return null;

    const rawDamageType = (selectedSkill as any).damageType;
    const damageType =
      !rawDamageType || rawDamageType === "sharp"
        ? agent.attribute?.toLowerCase() || "electric"
        : rawDamageType;

    const base = unifiedStats.def * effectiveMaimMult;

    const enemyDef = selectedEnemy.stats.def;
    const penRatio = unifiedStats.penRatio || 0;
    const penFlat = unifiedStats.pen || 0;
    const defenseAfterPenRatio = enemyDef * (1 - penRatio);
    const defenseAfterPen = Math.max(0, defenseAfterPenRatio - penFlat);
    const defMultiplier = ALC / (ALC + defenseAfterPen);

    let dmgMod = 1;
    dmgMod += damageBonuses.global || 0;
    dmgMod += damageBonuses.elements?.[damageType] || 0;
    dmgMod +=
      unifiedStats.attributeDmgBonus[
        damageType as keyof typeof unifiedStats.attributeDmgBonus
      ] || 0;
    dmgMod += damageBonuses.skillTypes?.[selectedSkill.skillType] || 0;
    dmgMod += damageBonuses.exclusive?.[selectedSkill.id] || 0;

    const lacDmg = unifiedStats.lacerationDmg || 1.5;
    const lac1Multiplier = 1 + lacDmg;
    const lac2Multiplier = 1 + lacDmg;

    const sharpBonus =
      1 +
      (damageBonuses.sharpDmgBonus || 0) +
      (damageBonuses.elementSharpDmgBonus?.[damageType] || 0) +
      (damageBonuses.skillTypeElementalSharp?.[selectedSkill.skillType]?.[
        damageType
      ] || 0);

    const stunMult = 1 + stunMultiplier / 100;

    const resCalc = calculateElementalResistance(
      selectedEnemy,
      damageType,
      activeEffects,
      undefined,
      undefined,
      false,
      false,
      false,
    );
    const resMult = resCalc.damageMultiplier;

    const afterDefMult = base * defMultiplier;
    const afterDmgMod = afterDefMult * dmgMod;
    const afterLac1 = afterDmgMod * lac1Multiplier;
    const afterLac2 = afterLac1 * lac2Multiplier;
    const afterSharp = afterLac2 * sharpBonus;
    const afterStun = afterSharp * stunMult;
    const finalDamage = Math.round(afterStun * resMult);

    return {
      base,
      defenseAfterPen,
      defMultiplier,
      dmgMod,
      lac1Multiplier,
      lac2Multiplier,
      sharpBonus,
      stunMult,
      resMult,
      afterDefMult,
      afterDmgMod,
      afterLac1,
      afterLac2,
      afterSharp,
      afterStun,
      finalDamage,
      maimMult: effectiveMaimMult,
      damageType,
    };
  }, [
    selectedSkill,
    selectedEnemy,
    unifiedStats,
    damageBonuses,
    stunMultiplier,
    activeEffects,
    effectiveMaimMult,
    agent.attribute,
  ]);

  const formatNumber = (num: number) => Math.round(num).toLocaleString("en-US");

  const skillOptions = maimSkills.map((s) => ({ value: s.id, label: s.name }));

  const availableLevels = selectedSkill?.levels?.map((l) => l.level) || [];
  if (availableLevels.length === 0) availableLevels.push(1);
  const maxLevel = Math.max(...availableLevels, 1);
  const dynamicLevels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <div
      className="calculator-main_wrapper"
      style={{ "--theme": theme } as React.CSSProperties}
    >
      <div className="calculator-calculator_title">
        <p className="slot-agent_stats-title">MAIM DMG CALCULATOR</p>
        <div className="slot-divider" />
      </div>

      {maimSkills.length === 0 ? (
        <div className="skill_selector-main_wrapper">
          <div className="extra-panel-empty">
            <p>No Maim skills available</p>
            <p className="extra-panel-empty-sub">
              This Armorer agent doesn't have any skill with a "Maim Multiplier"
              hit.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Selector de skill + nivel + descripción + checkbox MS1 */}
          <div className="skill_selector-main_wrapper">
            <div className="skill_selector-header">
              <label>Maim Skill:</label>
            </div>
            <div className="skill_selector-neon_wrapper">
              <NeonSelect
                value={selectedSkill?.name || "Select a skill..."}
                options={skillOptions}
                onChange={(value: string) => setMaimSelectedSkillId(value)}
                theme={theme}
                variant="enemy"
              />
            </div>

            {/* Selector de nivel */}
            <div
              className="skill_selector-level_setter"
              style={{ marginTop: 12 }}
            >
              <label className="skill_selector-header">Maim Skill Level:</label>
              <div className="skill_selector-buttons_container">
                {dynamicLevels.map((level) => {
                  const isAvailable = availableLevels.includes(level);
                  const isSelected = effectiveSkillLevel === level;
                  const isActive =
                    isSelected || (isAvailable && level < effectiveSkillLevel);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        if (isAvailable) setMaimSkillLevel(level);
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

            {/* Multiplier description */}
            <div className="skill_selector-description">
              <p className="luminize-description-text">
                Multiplier: {(baseMaimMult * 100).toFixed(1)}% (Lv.{" "}
                {effectiveSkillLevel})
                {maimMindscape1Active && hasBanquetOfPaleBlood && (
                  <span style={{ color: theme }}>
                    {" "}
                    → {(effectiveMaimMult * 100).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>

            {/* ⭐ Checkbox MS1 — solo si el Core Passive de Claret está presente */}
            {hasBanquetOfPaleBlood && (
              <div
                className="maim-mindscape-row"
                style={{ "--theme": theme } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  id="maim-ms1-checkbox"
                  checked={maimMindscape1Active}
                  onChange={(e) => setMaimMindscape1Active(e.target.checked)}
                />
                <label
                  htmlFor="maim-ms1-checkbox"
                  className="maim-checkbox-box"
                />
                <span className="maim-checkbox-label">
                  <span className="highlight-ms1">Mindscape Cinema N°1: </span>{" "}
                  Maim Multiplier → 130%
                </span>
              </div>
            )}
          </div>

          {/* Grid de resultados */}
          {result ? (
            <div className="anomaly_summary-main_wrapper">
              <div className="anomaly-grid-header">
                <div className="anomaly-title-with-icon">
                  <img
                    src="/resources/images/icons/attributes/Electric.png"
                    alt="Electric"
                    className="anomaly-attribute-icon"
                  />
                  <span className="anomaly-title-text">
                    {agent.displayName || agent.name}'s Maim DMG
                  </span>
                </div>
              </div>

              <div className="anomaly-grid">
                <div className="anomaly-grid-header-row">
                  <div className="anomaly-header-cell step">#</div>
                  <div className="anomaly-header-cell calculation">
                    Calculation
                  </div>
                  <div className="anomaly-header-cell before">Before</div>
                  <div className="anomaly-header-cell arrow">→</div>
                  <div className="anomaly-header-cell after">After</div>
                </div>

                {/* ① Base */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">①</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Base DMG</span>
                    <span className="calc-detail">
                      DEF × {(result.maimMult * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(unifiedStats.def)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-value">
                    {formatNumber(result.base)}
                  </div>
                </div>

                {/* ② DefMult */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">②</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">DEF Multiplier</span>
                    <span className="calc-detail">
                      {ALC} / ({ALC} + {formatNumber(result.defenseAfterPen)})
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(result.base)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-ap">
                    {result.defMultiplier.toFixed(4)}×
                  </div>
                </div>

                {/* ③ DMG% */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">③</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">DMG% Mod</span>
                    <span className="calc-detail">
                      +{((result.dmgMod - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(result.afterDefMult)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-bonus">
                    {formatNumber(result.afterDmgMod)}
                  </div>
                </div>

                {/* ④ Lac₁ */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">④</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Laceration DMG</span>
                    <span className="calc-detail">
                      × (1 +{" "}
                      {((unifiedStats.lacerationDmg || 1.5) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(result.afterDmgMod)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-bonus">
                    {formatNumber(result.afterLac1)}
                  </div>
                </div>

                {/* ⑤ Lac₂ */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">⑤</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Sharp DMG</span>
                    <span className="calc-detail">
                      × (1 +{" "}
                      {((unifiedStats.lacerationDmg || 1.5) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(result.afterLac1)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-bonus">
                    {formatNumber(result.afterLac2)}
                  </div>
                </div>

                {/* ⑥ Sharp Bonus (solo si aplica) */}
                {result.sharpBonus !== 1 && (
                  <div className="anomaly-grid-row">
                    <div className="anomaly-row-cell step">⑥</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Sharp DMG Bonus</span>
                      <span className="calc-detail">
                        +{((result.sharpBonus - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {formatNumber(result.afterLac2)}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-bonus">
                      {formatNumber(result.afterSharp)}
                    </div>
                  </div>
                )}

                {/* Stun (solo si > 0) */}
                {stunMultiplier > 0 && (
                  <div className="anomaly-grid-row stun-row">
                    <div className="anomaly-row-cell step">⑦</div>
                    <div className="anomaly-row-cell calculation">
                      <span className="calc-label">Stun</span>
                      <span className="calc-detail">+{stunMultiplier}%</span>
                    </div>
                    <div className="anomaly-row-cell before">
                      {formatNumber(result.afterSharp)}
                    </div>
                    <div className="anomaly-row-cell arrow">×</div>
                    <div className="anomaly-row-cell after highlight-stun">
                      {formatNumber(result.afterStun)}
                    </div>
                  </div>
                )}

                {/* RES */}
                <div className="anomaly-grid-row">
                  <div className="anomaly-row-cell step">⑧</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="calc-label">Enemy RES</span>
                    <span className="calc-detail">
                      {((1 - result.resMult) * 100).toFixed(1)}% RES
                    </span>
                  </div>
                  <div className="anomaly-row-cell before">
                    {formatNumber(result.afterStun)}
                  </div>
                  <div className="anomaly-row-cell arrow">×</div>
                  <div className="anomaly-row-cell after highlight-bonus">
                    {result.resMult.toFixed(3)}×
                  </div>
                </div>

                {/* Total */}
                <div className="anomaly-grid-total-row">
                  <div className="anomaly-row-cell step">☑</div>
                  <div className="anomaly-row-cell calculation">
                    <span className="total-label">Final Maim DMG</span>
                    <span className="total-target">
                      vs {selectedEnemy.name}
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
              <div className="extra-panel-empty">
                <p>Select a Maim skill</p>
                <p className="extra-panel-empty-sub">
                  Choose a skill and level to see the Maim DMG output
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
