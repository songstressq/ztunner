import type { IngameEffect } from "@/types/IngameEffect";
import { useState, useEffect } from "react";
import { InfoTooltip } from "./InfoTooltip";
import { formatStatName, formatStatValue } from "@/utils/statFormatters";

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
      damageBonuses,
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

    const rawFromStat = units * perUnitBonus;
    const fromBase = baseBonus;
    const rawTotal = fromBase + rawFromStat;

    let maxReached = false;
    let total = rawTotal;
    if (maxBonus !== Infinity) {
      maxReached = rawTotal >= maxBonus;
      total = Math.min(rawTotal, maxBonus);
    }

    const fromStatCapped = Math.max(0, total - fromBase);

    let damageBonusTotal = 0;
    let damageBonusType = "global";
    if (damageBonuses && damageBonuses.length > 0) {
      const firstBonus = damageBonuses[0];
      damageBonusType = firstBonus.type || "global";
      damageBonusTotal = total * (firstBonus.value || 1);
    }

    return {
      total: damageBonusTotal || total,
      fromBase: damageBonuses ? 0 : fromBase,
      fromStat: damageBonuses ? total : rawFromStat,
      fromStatCapped,
      rawFromStat,
      rawTotal,
      maxReached,
      statUsed: currentStatValue,
      excessStat: excess,
      units,
      basedOn,
      maxPossible: maxBonus,
      perUnitBonusDisplay: perUnitBonus * 100,
      isDamageBonus: !!damageBonuses,
      damageBonusType,
      damageBonusValue: damageBonusTotal,
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
      unitMultiplier: perUnitBonus,
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

  const fmtVal = (value: number, statType: string) =>
    formatStatValue(statType, value, { showSign: false });

  const damageStatLabel = (() => {
    if (!isDamageBonus) return formatStatName(affectedStat || "");
    const scope = formatStatName(damageBonusType || "global");
    // Si el scope ya es un stat con "Bonus" (ej. "Anomaly DMG Bonus"), usarlo directo
    if (/bonus/i.test(scope)) return scope;
    return `${scope} DMG Bonus`;
  })();

  return (
    <div className="ingame_toggle-main_container">
      <div
        className="ingame_toggle-main_wrapper"
        style={{
          ...emptyObjectsStyle,
          ...(disabled && { opacity: 0.6, backgroundColor: "rgb(34, 34, 34)" }),
        }}
      >
        {/* Fila 1: Icono + Título + Tooltip */}
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && effect.ownerAgentId && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={`/resources/images/agents/icons/${effect.ownerAgentId}.png`}
                alt={effect.ownerDisplayName || effect.ownerAgentId}
                title={effect.ownerDisplayName}
              />
            </div>
          )}
          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
            {effect.condition?.requiresSpecialty && (
              <div
                className="ingame_toggle-agent_specialty"
                style={{ color: "#7EFFDB", backgroundColor: "#1a3a2a" }}
              >
                <img
                  src={`/resources/images/icons/specialties/${effect.condition.requiresSpecialty}.png`}
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
        ) : null}

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
                        className={`ingame_toggle-button ${
                          skillLevel === levelData.level ? "is-active" : ""
                        }`}
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
                  Active Bonus
                  {isSkillLevelBased && ` (Skill Lv.${skillLevel})`}
                </div>

                {/* INITIAL STAT BASED DAMAGE BONUS */}
                {isDamageBonus &&
                  effect.conditional.type !== "currentStatBased" && (
                    <>
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          Initial{" "}
                          <span className="ingame_toggle-stat_tag">
                            {formatStatName(bonus.basedOn || "hp")}
                          </span>
                          :
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
                            Excess{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(bonus.basedOn)}
                            </span>{" "}
                            (❯  {effect.conditional.threshold || 0}):
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
                            Excess{" "}
                            <span className="ingame_toggle-stat_tag">
                              {damageStatLabel}
                            </span>{" "}
                            ({bonus.units} ×{" "}
                            {bonus.unitMultiplier !== undefined &&
                            bonus.unitMultiplier !== null
                              ? bonus.unitMultiplier < 1
                                ? `${(bonus.unitMultiplier * 100).toFixed(1)}%`
                                : bonus.unitMultiplier % 1 === 0
                                  ? bonus.unitMultiplier
                                  : bonus.unitMultiplier.toFixed(1)
                              : "0.0"}
                            ):
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{fmtVal(bonus.fromStat, affectedStat)}
                          </span>
                        </div>
                      )}
                      {bonus.fromBase > 0 && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            Base{" "}
                            <span className="ingame_toggle-stat_tag">
                              {damageStatLabel}
                            </span>
                            :
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{fmtVal(bonus.fromBase, affectedStat)}
                          </span>
                        </div>
                      )}
                      <div
                        className="ingame_toggle-stat_row ingame_toggle-total_row"
                        style={{
                          color: bonus.maxReached ? "#4CAF50" : "inherit",
                        }}
                      >
                        <span className="ingame_toggle-stat_name">
                          Total{" "}
                          <span className="ingame_toggle-total_stat_tag">
                            {damageStatLabel}
                          </span>{" "}
                          Increase:
                        </span>
                        <span className="ingame_toggle-stat_value stat_value_total">
                          +{fmtVal(bonus.total, affectedStat)}{" "}
                          {bonus.maxReached && "(MAX)"}
                        </span>
                      </div>
                    </>
                  )}

                {/* INITIAL STAT BASED */}
                {effect.conditional.type === "initialStatBased" &&
                  !isDamageBonus && (
                    <>
                      <div className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          Initial{" "}
                          <span className="ingame_toggle-stat_tag">
                            {formatStatName(bonus.basedOn || "hp")}
                          </span>
                          :
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
                            Excess{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(bonus.basedOn)}
                            </span>{" "}
                            (❯  
                            {effect.conditional.threshold || 0}):
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
                            Excess{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(affectedStat || "")}
                            </span>{" "}
                            Bonus ({bonus.excessStat} ×{" "}
                            {bonus.unitMultiplier !== undefined &&
                            bonus.unitMultiplier !== null
                              ? bonus.unitMultiplier < 1
                                ? `${(bonus.unitMultiplier * 100).toFixed(1)}%`
                                : bonus.unitMultiplier % 1 === 0
                                  ? bonus.unitMultiplier
                                  : bonus.unitMultiplier.toFixed(1)
                              : "0.0"}
                            ):
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{fmtVal(bonus.fromStat, affectedStat)}
                          </span>
                        </div>
                      )}
                      {bonus.fromBase > 0 && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            Base{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(affectedStat)}
                            </span>{" "}
                            Bonus:
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{fmtVal(bonus.fromBase, affectedStat)}
                          </span>
                        </div>
                      )}
                      <div
                        className="ingame_toggle-stat_row ingame_toggle-total_row"
                        style={{
                          color: bonus.maxReached ? "#4CAF50" : "inherit",
                        }}
                      >
                        <span className="ingame_toggle-stat_name">
                          Total{" "}
                          <span className="ingame_toggle-total_stat_tag">
                            {formatStatName(affectedStat)}
                          </span>{" "}
                          Increase:
                        </span>
                        <span className="ingame_toggle-stat_value stat_value_total">
                          +{fmtVal(bonus.total, affectedStat)}{" "}
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
                          CRIT DMG:
                        </span>
                        <span className="ingame_toggle-stat_value">
                          +{fmtVal(bonus.bonuses.critDmg, "critDmg")}
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
                        if (dmgBonus.type === "global") label = "Global DMG";
                        else if (
                          dmgBonus.type === "element" &&
                          dmgBonus.element
                        )
                          label = `${dmgBonus.element.toUpperCase()} DMG Bonus`;
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
                              {label}:
                            </span>
                            <span className="ingame_toggle-stat_value is-bonus">
                              +{fmtVal(dmgBonus.value, "dmgBonus")}
                            </span>
                          </div>
                        );
                      },
                    )}
                    <div className="ingame_toggle-skill_level_row">
                      Level {skillLevel}/
                      {effect.conditional.skillBonusTable?.length || 0}
                    </div>
                  </>
                )}

                {/* CURRENT STAT BASED */}
                {effect.conditional?.type === "currentStatBased" && (
                  <>
                    {!bonus.isDamageBonus ? (
                      <>
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            Current{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(effect.conditional.basedOn || "")}
                            </span>
                            :
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
                              Excess{" "}
                              <span className="ingame_toggle-stat_tag">
                                {formatStatName(bonus.basedOn)}
                              </span>{" "}
                              (❯  {effect.conditional.threshold || 0}):
                            </span>
                            <span className="ingame_toggle-stat_value">
                              {bonus.basedOn === "penRatio" ||
                              bonus.basedOn === "critRate"
                                ? `${bonus.excessStat.toFixed(1)}%`
                                : bonus.basedOn === "energyRegen"
                                  ? `${bonus.excessStat.toFixed(2)}/s`
                                  : Math.round(
                                      bonus.excessStat,
                                    ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {bonus.fromStat > 0 && (
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Excess{" "}
                              <span className="ingame_toggle-stat_tag">
                                {formatStatName(affectedStat || "")}
                              </span>{" "}
                              {!/bonus/i.test(
                                formatStatName(affectedStat || ""),
                              ) && "Bonus"}{" "}
                              ({bonus.units} ×{" "}
                              {effect.conditional.perUnitBonus !== undefined &&
                              effect.conditional.perUnitBonus !== null
                                ? effect.conditional.perUnitBonus < 1
                                  ? `${(effect.conditional.perUnitBonus * 100).toFixed(2)}%`
                                  : effect.conditional.perUnitBonus % 1 === 0
                                    ? effect.conditional.perUnitBonus
                                    : effect.conditional.perUnitBonus.toFixed(1)
                                : "0.0"}
                              ):
                            </span>
                            <span className="ingame_toggle-stat_value">
                              +{fmtVal(bonus.fromStat, affectedStat)}
                            </span>
                          </div>
                        )}
                        {bonus.fromBase > 0 && (
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Base{" "}
                              <span className="ingame_toggle-stat_tag">
                                {formatStatName(affectedStat)}
                              </span>{" "}
                              {!/bonus/i.test(
                                formatStatName(affectedStat || ""),
                              ) && "Bonus"}
                              :
                            </span>
                            <span className="ingame_toggle-stat_value">
                              +{fmtVal(bonus.fromBase, affectedStat)}
                            </span>
                          </div>
                        )}
                        <div
                          className="ingame_toggle-stat_row ingame_toggle-total_row"
                          style={{
                            color: bonus.maxReached ? "#4CAF50" : "inherit",
                          }}
                        >
                          <span className="ingame_toggle-stat_name">
                            Total{" "}
                            <span className="ingame_toggle-total_stat_tag">
                              {formatStatName(affectedStat)}
                            </span>{" "}
                            Increase:
                          </span>
                          <span className="ingame_toggle-stat_value stat_value_total">
                            +{fmtVal(bonus.total, affectedStat)}{" "}
                            {bonus.maxReached && "(MAX)"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            Current{" "}
                            <span className="ingame_toggle-stat_tag">
                              {formatStatName(effect.conditional.basedOn || "")}
                            </span>
                            :
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
                              Excess{" "}
                              <span className="ingame_toggle-stat_tag">
                                {formatStatName(bonus.basedOn)}
                              </span>{" "}
                              (❯ {effect.conditional.threshold || 0}):
                            </span>
                            <span className="ingame_toggle-stat_value">
                              {bonus.basedOn === "penRatio" ||
                              bonus.basedOn === "critRate"
                                ? `${bonus.excessStat.toFixed(1)}%`
                                : bonus.basedOn === "energyRegen"
                                  ? `${bonus.excessStat.toFixed(2)}/s`
                                  : Math.round(
                                      bonus.excessStat,
                                    ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {bonus.units > 0 && (
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Excess{" "}
                              <span className="ingame_toggle-stat_tag">
                                {formatStatName(bonus.damageBonusType || "")}{" "}
                                DMG Bonus
                              </span>{" "}
                              ({bonus.units} ×{" "}
                              {effect.conditional.perUnitBonus !== undefined &&
                              effect.conditional.perUnitBonus !== null
                                ? effect.conditional.perUnitBonus < 1
                                  ? `${(effect.conditional.perUnitBonus * 100).toFixed(1)}%`
                                  : effect.conditional.perUnitBonus % 1 === 0
                                    ? effect.conditional.perUnitBonus
                                    : effect.conditional.perUnitBonus.toFixed(1)
                                : "0.0"}
                              ):
                            </span>
                            <span className="ingame_toggle-stat_value is-bonus">
                              +{(bonus.rawFromStat * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        <div className="ingame_toggle-stat_row ingame_toggle-total_row">
                          <span className="ingame_toggle-stat_name">
                            Total{" "}
                            <span className="ingame_toggle-total_stat_tag stat_value_total">
                              {formatStatName(bonus.damageBonusType)} DMG Bonus
                            </span>{" "}
                            Increase:
                          </span>
                          <span
                            className="ingame_toggle-stat_value"
                            style={{
                              color: bonus.maxReached ? theme : "inherit",
                            }}
                          >
                            +{(bonus.total * 100).toFixed(1)}%{" "}
                            {bonus.maxReached && "(MAX)"}
                          </span>
                        </div>
                      </>
                    )}
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
      </div>
    </div>
  );
};

export default ConditionalEffectToggle;
