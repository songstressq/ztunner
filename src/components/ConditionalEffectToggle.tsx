import type { IngameEffect } from "@/types/IngameEffect";
import { useState, useEffect } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  onToggle: () => void;
  onSkillLevelChange?: (level: number) => void;
  initialStatValue: number;
  unifiedStats?: UnifiedStats;
  ownerStats?: UnifiedStats;
  currentSkillLevel?: number;
  disabled?: boolean;
  sourceNote?: string;
  showOwnerIcon?: boolean;
  theme?: string;
}

const ConditionalEffectToggle = ({
  effect,
  enabled,
  onToggle,
  onSkillLevelChange,
  initialStatValue,
  unifiedStats,
  ownerStats,
  currentSkillLevel = 1,
  disabled = false,
  sourceNote,
  showOwnerIcon = false,
  theme = "#ffffff",
}: Props) => {
  const [skillLevel, setSkillLevel] = useState(currentSkillLevel);

  const calculateSkillLevelBasedBonus = () => {
    if (!effect.conditional || effect.conditional.type !== "skillLevelBased") {
      return {
        total: 0,
        fromBase: 0,
        fromStat: 0,
        maxReached: false,
        basedOn: undefined,
        statUsed: 0,
        excessStat: 0,
        units: 0,
        maxPossible: undefined,
      };
    }
    const { skillBonusTable } = effect.conditional;
    const currentLevel = skillBonusTable?.find((l) => l.level === skillLevel);
    if (!currentLevel) {
      return {
        total: 0,
        bonuses: null,
        maxReached: false,
        basedOn: undefined,
        statUsed: 0,
        excessStat: 0,
        units: 0,
        maxPossible: undefined,
      };
    }
    let totalValue = currentLevel.critDmg || 0;
    if (currentLevel.damageBonuses) {
      currentLevel.damageBonuses.forEach((bonus) => {
        if (bonus.type === "global") {
          totalValue += bonus.value;
        }
      });
    }
    return {
      total: totalValue,
      bonuses: currentLevel,
      maxReached: skillLevel === (skillBonusTable?.length || 0),
      level: skillLevel,
      basedOn: undefined,
      statUsed: 0,
      excessStat: 0,
      units: 0,
      maxPossible: undefined,
    };
  };

  const calculateCurrentStatBonus = () => {
    if (!effect.conditional || effect.conditional.type !== "currentStatBased") {
      return { total: 0, fromBase: 0, fromStat: 0, maxReached: false };
    }
    const {
      basedOn,
      maxStat = Infinity,
      baseBonus = 0,
      perUnit = 1,
      threshold = 0,
      maxBonus = Infinity,
      perUnitBonus = 0,
    } = effect.conditional;
    const statsToUse = ownerStats || unifiedStats;
    if (!statsToUse) {
      return { total: 0, fromBase: 0, fromStat: 0, maxReached: false };
    }
    let currentStatValue = 0;
    switch (basedOn) {
      case "anomalyMastery":
        currentStatValue = statsToUse.anomalyMastery || 0;
        break;
      case "anomalyProficiency":
        currentStatValue = statsToUse.anomalyProficiency || 0;
        break;
      case "hp":
        currentStatValue = statsToUse.hp || 0;
        break;
      case "atk":
        currentStatValue = statsToUse.atk || 0;
        break;
      case "def":
        currentStatValue = statsToUse.def || 0;
        break;
      case "impact":
        currentStatValue = statsToUse.impact || 0;
        break;
      case "critRate":
        currentStatValue = (statsToUse.critRate || 0) * 100;
        break;
      case "energyRegen":
        currentStatValue = statsToUse.energyRegen || 0;
        break;
      case "penRatio":
        currentStatValue = (statsToUse.penRatio || 0) * 100;
        break;
      case "sheerForce":
        currentStatValue = statsToUse.sheerForce || 0;
        break;
      default:
        currentStatValue = 0;
    }
    if (basedOn === "critRate" || basedOn === "penRatio") {
      if (currentStatValue <= 1 && basedOn === "critRate") {
        currentStatValue = currentStatValue * 100;
      }
    }
    const cappedStat =
      maxStat !== Infinity
        ? Math.min(currentStatValue, maxStat)
        : currentStatValue;
    const excess = Math.max(0, cappedStat - threshold);
    const units = Math.floor(excess / perUnit);
    let fromStat = units * perUnitBonus;
    if (maxBonus !== Infinity) {
      fromStat = Math.min(fromStat, maxBonus);
    }
    const fromBase = baseBonus;
    const total = fromBase + fromStat;
    const maxReached = fromStat >= maxBonus;
    return {
      total,
      fromBase,
      fromStat,
      maxReached,
      statUsed: currentStatValue,
      excessStat: excess,
      units,
      basedOn,
      maxPossible: maxBonus,
      perUnitBonusDisplay: perUnitBonus * 100,
    };
  };

  const calculateInitialStatBasedBonus = () => {
    if (
      !effect.conditional ||
      (effect.conditional.type !== "initialStatBased" &&
        effect.conditional.type !== "initialStatBasedDamageBonus")
    ) {
      return { total: 0, fromBase: 0, fromStat: 0, maxReached: false };
    }

    const {
      basedOn,
      maxStat = Infinity,
      baseBonus = 0,
      perUnit = 1,
      skillLevels,
      threshold = 0,
    } = effect.conditional;

    const currentLevel =
      skillLevels?.find((l) => l.level === skillLevel) || skillLevels?.[0];
    if (!currentLevel)
      return {
        total: baseBonus,
        fromBase: baseBonus,
        fromStat: 0,
        maxReached: false,
      };

    const levelBaseBonus =
      currentLevel.baseBonus !== undefined ? currentLevel.baseBonus : baseBonus;
    const perUnitBonus = currentLevel.perUnitBonus || 0;
    const maxBonus = currentLevel.maxBonus || Infinity;
    let excessStat = Math.max(0, initialStatValue - threshold);
    excessStat = Math.round(excessStat * 100) / 100;
    if (maxStat !== Infinity) {
      excessStat = Math.min(excessStat, maxStat);
    }
    const units = Math.round(excessStat / perUnit);

    const fromStat = units * perUnitBonus;
    const total = levelBaseBonus + fromStat;
    const finalTotal =
      maxBonus !== Infinity ? Math.min(total, maxBonus) : total;
    const maxReached = finalTotal >= maxBonus;

    const affectedStat =
      effect.conditional.affectedStats?.[0] ||
      (effect.conditional.type === "initialStatBasedDamageBonus"
        ? "dmgBonus"
        : "atkFlat");

    return {
      total: finalTotal,
      fromBase: levelBaseBonus,
      fromStat: finalTotal - levelBaseBonus,
      maxReached,
      maxPossible: maxBonus !== Infinity ? maxBonus : undefined,
      statUsed: initialStatValue,
      excessStat,
      units,
      basedOn,
      affectedStat,
      isDamageBonus: effect.conditional.type === "initialStatBasedDamageBonus",
      damageBonusType: effect.conditional.damageBonusType,
    };
  };

  const calculateBonus = () => {
    if (!effect.conditional) {
      return { total: 0, fromBase: 0, fromStat: 0, maxReached: false };
    }
    if (effect.conditional.type === "skillLevelBased") {
      return calculateSkillLevelBasedBonus();
    }
    if (effect.conditional.type === "currentStatBased") {
      return calculateCurrentStatBonus();
    }
    if (
      effect.conditional.type === "initialStatBased" ||
      effect.conditional.type === "initialStatBasedDamageBonus"
    ) {
      return calculateInitialStatBasedBonus();
    }
    return { total: 0, fromBase: 0, fromStat: 0, maxReached: false };
  };

  const bonus = calculateBonus();

  const formatStatValue = (
    value: number,
    statType: string,
    isDamageBonus: boolean = false,
  ): string => {
    if (isDamageBonus) {
      return `${(value * 100).toFixed(1)}%`;
    }

    const percentStats = [
      "critRate",
      "critDmg",
      "penRatio",
      "dmgBonus",
      "attributeDmgBonus",
      "anomalyDmgBonus",
      "disorderDmgBonus",
      "sheerDmgBonus",
      "fireResShred",
      "iceResShred",
      "electricResShred",
      "physicalResShred",
      "etherResShred",
      "defShred",
      "atkPercent",
      "hpPercent",
      "defPercent",
      "impactPercent",
      "atkPercentRaw",
      "hpPercentRaw",
      "defPercentRaw",
      "refringeCoefficient",
    ];

    const flatStats = [
      "atkFlat",
      "hpFlat",
      "defFlat",
      "atk",
      "hp",
      "def",
      "anomalyProficiency",
      "anomalyMastery",
      "impact",
      "pen",
      "sheerForce",
      "atkFlatRaw",
      "hpFlatRaw",
      "defFlatRaw",
    ];

    const decimalStats = ["energyRegen"];

    if (
      percentStats.includes(statType) ||
      statType.includes("Percent") ||
      statType.includes("Bonus") ||
      statType.includes("ResShred")
    ) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (decimalStats.includes(statType)) {
      return value.toFixed(2);
    }
    if (flatStats.includes(statType)) {
      return Math.round(value).toString();
    }
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  };

  const formatStatName = (stat: string): string => {
    const statNames: Record<string, string> = {
      hp: "HP",
      atk: "ATK",
      def: "DEF",
      hpFlat: "HP",
      atkFlat: "ATK",
      defFlat: "DEF",
      hpPercent: "HP%",
      atkPercent: "ATK%",
      defPercent: "DEF%",
      critRate: "CRIT Rate",
      critDmg: "CRIT DMG",
      impact: "Impact",
      impactPercent: "Impact%",
      anomalyProficiency: "Anomaly Proficiency",
      anomalyMastery: "Anomaly Mastery",
      penRatio: "PEN Ratio",
      pen: "PEN",
      energyRegen: "Energy Regen",
      sheerForce: "Sheer Force",
      attributeDmgBonus: "DMG Bonus",
      anomalyDmgBonus: "Anomaly DMG",
      disorderDmgBonus: "Disorder DMG",
      sheerDmgBonus: "Sheer DMG",
      defShred: "DEF Reduction",
      fireResShred: "Fire RES Ignore",
      iceResShred: "Ice RES Ignore",
      electricResShred: "Electric RES Ignore",
      physicalResShred: "Physical RES Ignore",
      etherResShred: "Ether RES Ignore",
      dmgBonus: "DMG Bonus",
    };
    return statNames[stat] || stat;
  };

  const getRecommendedSkillLevel = () => {
    if (
      !effect.useManualThresholds ||
      effect.conditional?.type !== "initialStatBased" ||
      !effect.conditional?.skillLevels
    ) {
      return null;
    }
    const sortedLevels = [...effect.conditional.skillLevels].sort(
      (a, b) => a.level - b.level,
    );
    for (let i = sortedLevels.length - 1; i >= 0; i--) {
      const level = sortedLevels[i];
      if (
        level.impactThreshold !== undefined &&
        bonus.statUsed >= level.impactThreshold
      ) {
        return level.level;
      }
    }
    return 1;
  };

  const recommendedSkillLevel = getRecommendedSkillLevel();
  const isSkillLevelBased = effect.conditional?.type === "skillLevelBased";
  const skillLevelBonus = isSkillLevelBased ? bonus.bonuses : null;
  const showSkillSelector =
    enabled &&
    (effect.conditional?.skillLevels || effect.conditional?.skillBonusTable) &&
    !disabled;

  useEffect(() => {
    if (onSkillLevelChange) {
      onSkillLevelChange(skillLevel);
    }
  }, [skillLevel]);

  useEffect(() => {
    setSkillLevel(currentSkillLevel);
  }, [currentSkillLevel]);

  const handleSkillLevelChange = (level: number) => {
    setSkillLevel(level);
    if (onSkillLevelChange) {
      onSkillLevelChange(level);
    }
  };

  const affectedStat =
    bonus.affectedStat || effect.conditional?.affectedStats?.[0] || "atkFlat";
  const isDamageBonus = bonus.isDamageBonus || false;
  const damageBonusType = bonus.damageBonusType || "global";

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(
      to right bottom, 
      ${theme}11, 
      ${theme}22, 
      ${theme}55, 
      ${theme}22, 
      ${theme}11
    )`,
  };

  return (
    <div className="ingame_toggle-main_container">
      <div
        className="ingame_toggle-main_wrapper"
        style={{
          ...emptyObjectsStyle,
          ...(disabled && {
            opacity: 0.6,
            backgroundColor: "rgb(34, 34, 34)",
          }),
        }}
      >
        {/* Fila 1: Icono + Título + Tooltip */}
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && effect.ownerAgentId && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${effect.ownerAgentId}.png`}
                alt={effect.ownerDisplayName || effect.ownerAgentId}
                title={effect.ownerDisplayName}
              />
            </div>
          )}

          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
            {/* Mostrar especialidad si aplica */}
            {effect.condition?.requiresSpecialty && (
              <div
                className="ingame_toggle-agent_specialty"
                style={{
                  color: "#7EFFDB",
                  backgroundColor: "#1a3a2a",
                }}
              >
                <img
                  src={`{`${import.meta.env.BASE_URL}resources/images/icons/specialties/${effect.condition.requiresSpecialty}.png`}
                  alt={effect.condition.requiresSpecialty}
                />
                {effect.condition.requiresSpecialty}
              </div>
            )}
          </div>

          {effect.description && (
            <InfoTooltip
              content={`${effect.label}\n\n${effect.description}`}
              theme={theme}
            />
          )}
        </div>
        {/* Fila 2: Descripción (izquierda) + Toggle (derecha) */}
        <div className="ingame_toggle-description_section">
          <p>{effect.shortDescription || effect.description}</p>
        </div>
        {!disabled ? (
          <div className="ingame_toggle-toggle_section">
            <div className="ingame_toggle-toggle_section-switch">
              <input
                className="ingame_toggle-toggle_section-input"
                id={`conditional-toggle-${effect.id}`}
                type="checkbox"
                checked={enabled}
                onChange={onToggle}
                disabled={disabled}
              />
              <label
                className="ingame_toggle-toggle_section-label"
                htmlFor={`conditional-toggle-${effect.id}`}
                style={
                  enabled
                    ? {
                        backgroundColor: theme,
                        ["--toggle-color" as any]: theme,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        ) : null}{" "}
        {/* Fila 3: Controles y Stats */}
        {!disabled ? (
          <div className="ingame_toggle-controls_section">
            {/* Selector de Skill Level */}
            {showSkillSelector && (
              <div className="ingame_toggle-overclock_section">
                <label className="ingame_toggle-label">
                  Skill Level: {skillLevel}
                  {recommendedSkillLevel &&
                    recommendedSkillLevel !== skillLevel && (
                      <span
                        style={{
                          marginLeft: "8px",
                          color: "#4CAF50",
                          fontSize: "0.7rem",
                        }}
                      >
                        (Recommended: Lv.{recommendedSkillLevel})
                      </span>
                    )}
                </label>
                <div className="ingame_toggle-button_group">
                  {(
                    effect.conditional?.skillLevels ||
                    effect.conditional?.skillBonusTable
                  )?.map((levelData: any) => {
                    const isRecommended =
                      effect.useManualThresholds &&
                      recommendedSkillLevel === levelData.level;
                    return (
                      <button
                        key={levelData.level}
                        type="button"
                        className={`ingame_toggle-button ${skillLevel === levelData.level ? "is-active" : ""}`}
                        onClick={() => handleSkillLevelChange(levelData.level)}
                        style={
                          isRecommended && skillLevel !== levelData.level
                            ? { borderColor: "#4CAF50", color: "#4CAF50" }
                            : undefined
                        }
                      >
                        {levelData.level}
                        {isRecommended &&
                          skillLevel !== levelData.level &&
                          " ✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats Section */}
            {enabled && effect.conditional && (
              <div className="ingame_toggle-stats_section">
                <div className="ingame_toggle-stats_header">
                  Active Bonus{" "}
                  {isSkillLevelBased && ` (Skill Lv.${skillLevel})`}
                  {isDamageBonus &&
                    ` - ${damageBonusType.toUpperCase()} DMG BONUS`}
                </div>

                {/* INITIAL STAT BASED DAMAGE BONUS */}
                {isDamageBonus && (
                  <>
                    <div className="ingame_toggle-stat_row">
                      <span className="ingame_toggle-stat_name">
                        {" "}
                        Initial {formatStatName(bonus.basedOn || "hp")}:{" "}
                      </span>
                      <span className="ingame_toggle-stat_value">
                        {Math.round(bonus.statUsed).toLocaleString()}
                      </span>
                    </div>
                    {bonus.excessStat > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Excess (above {effect.conditional.threshold}):{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          {Math.round(bonus.excessStat).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {bonus.units > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {bonus.units} ×{" "}
                          {(
                            (effect.conditional.perUnitBonus || 0) * 100
                          ).toFixed(1)}
                          %:
                        </span>
                        <span className="ingame_toggle-stat_value is-bonus">
                          +{(bonus.fromStat * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {bonus.fromBase > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Base Bonus:{" "}
                        </span>
                        <span className="ingame_toggle-stat_value is-bonus">
                          +{(bonus.fromBase * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div
                      className="ingame_toggle-stat_row"
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        color: bonus.maxReached ? "#4CAF50" : "#FFD700",
                      }}
                    >
                      <span className="ingame_toggle-stat_name">
                        {" "}
                        Total DMG Bonus:{" "}
                      </span>
                      <span className="ingame_toggle-stat_value">
                        +{(bonus.total * 100).toFixed(1)}%{" "}
                        {bonus.maxReached && "(MAX)"}
                      </span>
                    </div>
                  </>
                )}

                {/* INITIAL STAT BASED (normal) */}
                {effect.conditional.type === "initialStatBased" &&
                  !isDamageBonus && (
                    <>
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Initial {formatStatName(bonus.basedOn || "hp")}:{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          {bonus.basedOn === "penRatio" ||
                          bonus.basedOn === "critRate"
                            ? `${bonus.statUsed.toFixed(1)}%`
                            : bonus.basedOn === "energyRegen"
                              ? `${bonus.statUsed.toFixed(2)}/s`
                              : Math.round(bonus.statUsed).toLocaleString()}
                        </span>
                      </div>
                      {bonus.excessStat > 0 && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            {" "}
                            Excess (above {effect.conditional.threshold ||
                              0}{" "}
                            ):{" "}
                          </span>
                          <span className="ingame_toggle-stat_value">
                            {bonus.basedOn === "penRatio" ||
                            bonus.basedOn === "critRate"
                              ? `${bonus.excessStat.toFixed(1)}%`
                              : bonus.basedOn === "energyRegen"
                                ? `${bonus.excessStat.toFixed(2)}/s`
                                : Math.round(bonus.excessStat).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {bonus.fromStat > 0 && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            From {formatStatName(bonus.basedOn || "hp")} (
                            {bonus.units} × {effect.conditional.perUnitBonus}):
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{formatStatValue(bonus.fromStat, affectedStat)}
                          </span>
                        </div>
                      )}
                      {bonus.fromBase > 0 && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            {" "}
                            Base Bonus:{" "}
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{formatStatValue(bonus.fromBase, affectedStat)}
                          </span>
                        </div>
                      )}
                      <div
                        className="ingame_toggle-stat_row"
                        style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(255,255,255,0.1)",
                          color: bonus.maxReached ? "#4CAF50" : "inherit",
                        }}
                      >
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Total {formatStatName(affectedStat)}:{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          +{formatStatValue(bonus.total, affectedStat)}{" "}
                          {bonus.maxReached && "(MAX)"}
                        </span>
                      </div>
                    </>
                  )}

                {/* SKILL LEVEL BASED */}
                {isSkillLevelBased && bonus.bonuses && (
                  <>
                    {bonus.bonuses.critDmg && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          CRIT DMG:{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          +{formatStatValue(bonus.bonuses.critDmg, "critDmg")}
                        </span>
                      </div>
                    )}
                    {bonus.bonuses.impactPercentRaw && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">Impact:</span>
                        <span className="ingame_toggle-stat_value">
                          +{(bonus.bonuses.impactPercentRaw * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {bonus.bonuses.damageBonuses?.map(
                      (dmgBonus: any, idx: number) => {
                        let label = "";
                        if (dmgBonus.type === "global") label = "All DMG";
                        else if (
                          dmgBonus.type === "element" &&
                          dmgBonus.element
                        )
                          label = `${dmgBonus.element.toUpperCase()} DMG`;
                        else if (
                          dmgBonus.type === "skillType" &&
                          dmgBonus.skillType
                        )
                          label = `${dmgBonus.skillType.toUpperCase()} DMG`;
                        else label = "DMG Bonus";
                        return (
                          <div
                            className="ingame_toggle-stat_row is-bonus"
                            key={idx}
                          >
                            <span className="ingame_toggle-stat_name">
                              {" "}
                              {label}:{" "}
                            </span>
                            <span className="ingame_toggle-stat_value is-bonus">
                              +{formatStatValue(dmgBonus.value, "dmgBonus")}
                            </span>
                          </div>
                        );
                      },
                    )}
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "#888",
                        marginTop: "6px",
                        paddingTop: "6px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      Level {skillLevel}/
                      {effect.conditional.skillBonusTable?.length || 0}
                    </div>
                  </>
                )}

                {/* CURRENT STAT BASED */}
                {effect.conditional?.type === "currentStatBased" && (
                  <>
                    <div className="ingame_toggle-stat_row">
                      <span className="ingame_toggle-stat_name">
                        {" "}
                        Current{" "}
                        {formatStatName(effect.conditional.basedOn || "")}:{" "}
                      </span>
                      <span className="ingame_toggle-stat_value">
                        {formatStatValue(
                          bonus.statUsed,
                          effect.conditional.basedOn || "atk",
                        )}
                      </span>
                    </div>
                    {effect.conditional.threshold > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Excess (above {effect.conditional.threshold}):{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          {formatStatValue(
                            bonus.excessStat,
                            effect.conditional.basedOn || "atk",
                          )}
                        </span>
                      </div>
                    )}
                    {bonus.fromBase > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {" "}
                          Base Bonus:{" "}
                        </span>
                        <span className="ingame_toggle-stat_value">
                          +{formatStatValue(bonus.fromBase, affectedStat)}
                        </span>
                      </div>
                    )}
                    {bonus.fromStat > 0 && (
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          From {formatStatName(bonus.basedOn || "")} (
                          {bonus.units} × {effect.conditional.perUnitBonus}):
                        </span>
                        <span className="ingame_toggle-stat_value">
                          +{formatStatValue(bonus.fromStat, affectedStat)}
                        </span>
                      </div>
                    )}
                    <div
                      className="ingame_toggle-stat_row"
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        color: bonus.maxReached ? "#4CAF50" : "inherit",
                      }}
                    >
                      <span className="ingame_toggle-stat_name">Total:</span>
                      <span className="ingame_toggle-stat_value">
                        +{formatStatValue(bonus.total, affectedStat)}{" "}
                        {bonus.maxReached && "(MAX)"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="ingame_toggle-controls_section">
            <div className="ingame_toggle-disabled_section">
              <p>
                {sourceNote
                  ? `Effect received from ${sourceNote}`
                  : "Controlled by another slot"}
              </p>
            </div>
          </div>
        )}
        {/* Info adicional al pie 
        <div
          style={{
            gridColumn: "1 / 3",
            display: "flex",
            gap: "16px",
            marginTop: "8px",
            fontSize: "0.65rem",
            color: "#888",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "6px",
          }}
        >
          {effect.condition?.requiresSpecialty && (
            <div>Only for: {effect.condition.requiresSpecialty} agents</div>
          )}
        </div>*/}
      </div>
    </div>
  );
};

export default ConditionalEffectToggle;
