import type { IngameEffect } from "@/types/IngameEffect";
import { useState, useEffect } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  stacks: number;
  overclockLevel: number;
  onToggle: () => void;
  onStacksChange: (stacks: number) => void;
  onOverclockChange: (level: number) => void;
  disabled?: boolean;
  sourceNote?: string;
  agentSpecialty?: string;
  theme?: string;
  showOwnerIcon?: boolean;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

const WEngineEffectToggle = ({
  effect,
  enabled,
  stacks,
  overclockLevel,
  onToggle,
  onStacksChange,
  onOverclockChange,
  disabled = false,
  sourceNote,
  agentSpecialty,
  theme = "#ffffff",
  showOwnerIcon = false,
  ownerAgentId,
  ownerDisplayName,
}: Props) => {
  const [localStacks, setLocalStacks] = useState(stacks);
  const [localOverclock, setLocalOverclock] = useState(overclockLevel);

  const isApplicable =
    effect.target === "self"
      ? !effect.condition?.requiresSpecialty ||
        agentSpecialty === effect.condition.requiresSpecialty
      : true;

  const hasWEngineConfig = effect.wEngineOverclock?.levels?.length > 0;
  const maxOverclock = effect.wEngineOverclock?.levels?.length || 5;
  const maxStacks = effect.wEngineOverclock?.maxStacks || effect.maxStacks || 1;
  const stackMultiplier = effect.wEngineOverclock?.stackMultiplier || false;

  const calculateStats = () => {
    if (!hasWEngineConfig || !enabled || !isApplicable) return {};

    const currentLevel =
      effect.wEngineOverclock!.levels.find((l) => l.level === localOverclock) ||
      effect.wEngineOverclock!.levels[0];

    if (!currentLevel) return {};

    const baseStats = { ...currentLevel.stats };
    const result: Record<string, number> = {};

    if (currentLevel.baseStats) {
      Object.entries(currentLevel.baseStats).forEach(([stat, value]) => {
        if (stat === "attributeDmgBonus" && typeof value === "object") {
          Object.entries(value as Record<string, number>).forEach(
            ([element, elementValue]) => {
              const key = `${element}DmgBonus`;
              result[key] = (result[key] || 0) + (elementValue as number);
            },
          );
        } else {
          result[stat] = (result[stat] || 0) + (value as number);
        }
      });
    }

    if (currentLevel.stats) {
      Object.entries(currentLevel.stats).forEach(([stat, value]) => {
        if (stat === "attributeDmgBonus" && typeof value === "object") {
          Object.entries(value as Record<string, number>).forEach(
            ([element, elementValue]) => {
              const key = `${element}DmgBonus`;
              result[key] =
                (result[key] || 0) + (elementValue as number) * localStacks;
            },
          );
        } else {
          result[stat] = (result[stat] || 0) + (value as number) * localStacks;
        }
      });
    }

    const damageBonusesInfo: Array<{
      type: string;
      value: number;
      element?: string;
      skillType?: string;
    }> = [];

    if (currentLevel.damageBonuses) {
      currentLevel.damageBonuses.forEach((bonus) => {
        const finalValue = bonus.value * localStacks;
        const key = `damageBonus_${bonus.type}_${bonus.element || bonus.skillType || "global"}`;
        result[key] = finalValue;
        damageBonusesInfo.push({
          type: bonus.type,
          value: finalValue,
          element: bonus.element,
          skillType: bonus.skillType,
          stat: bonus.stat,
        });
      });
    }

    (result as any)._damageBonuses = damageBonusesInfo;
    return result;
  };

  const stats = calculateStats();
  const showStackSelector = enabled && maxStacks > 1 && isApplicable;
  const showOverclockSelector = enabled && hasWEngineConfig && isApplicable;

  useEffect(() => {
    setLocalStacks(stacks);
  }, [stacks]);

  useEffect(() => {
    setLocalOverclock(overclockLevel);
  }, [overclockLevel]);

  const handleStackChange = (newStacks: number) => {
    const clamped = Math.max(1, Math.min(newStacks, maxStacks));
    setLocalStacks(clamped);
    onStacksChange(clamped);
  };

  const handleOverclockChange = (level: number) => {
    setLocalOverclock(level);
    onOverclockChange(level);
  };

  const formatStatValue = (stat: string, value: number): string => {
    const percentStats = [
      "atkPercent",
      "hpPercent",
      "defPercent",
      "critRate",
      "critDmg",
      "penRatio",
      "energyRegen",
      "impactPercent",
      "attributeDmgBonus",
      "iceDmgBonus",
      "fireDmgBonus",
      "etherDmgBonus",
      "physicalDmgBonus",
      "electricDmgBonus",
      "sheerDmgBonus",
      "fireSheerDmgBonus",
      "iceSheerDmgBonus",
      "electricSheerDmgBonus",
      "physicalSheerDmgBonus",
      "etherSheerDmgBonus",
    ];

    const isPercent =
      percentStats.includes(stat) ||
      stat.toLowerCase().includes("percent") ||
      stat.toLowerCase().includes("ratio") ||
      stat.toLowerCase().includes("rate") ||
      stat.toLowerCase().includes("bonus");

    if (isPercent) {
      return `${(value * 100).toFixed(2)}%`;
    }

    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  const formatStatName = (stat: string): string => {
    const statNames: Record<string, string> = {
      atk: "ATK",
      atkFlat: "ATK",
      atkPercent: "ATK%",
      hp: "HP",
      hpFlat: "HP",
      hpPercent: "HP%",
      def: "DEF",
      defFlat: "DEF",
      defPercent: "DEF%",
      critRate: "CRIT Rate",
      critDmg: "CRIT DMG",
      impact: "Impact",
      impactPercent: "Impact%",
      impactPercentRaw: "Impact%",
      energyRegen: "Energy Regen",
      energyRegenRaw: "Energy Regen",
      penRatio: "PEN Ratio",
      attributeDmgBonus: "Attribute DMG Bonus",
      fireDmgBonus: "Fire DMG Bonus",
      iceDmgBonus: "Ice DMG Bonus",
      electricDmgBonus: "Electric DMG Bonus",
      physicalDmgBonus: "Physical DMG Bonus",
      etherDmgBonus: "Ether DMG Bonus",
      anomalyProficiency: "Anomaly Proficiency",
      anomalyMastery: "Anomaly Mastery",
      anomalyMasteryRaw: "Anomaly Mastery",
      sheerForce: "Sheer Force",
      defShred: "DEF Reduction",
      fireResShred: "Fire RES Ignore",
      iceResShred: "Ice RES Ignore",
      electricResShred: "Electric RES Ignore",
      physicalResShred: "Physical RES Ignore",
      etherResShred: "Ether RES Ignore",
      sheerDmgBonus: "Sheer DMG Bonus",
      fireSheerDmgBonus: "Fire Sheer DMG Bonus",
      iceSheerDmgBonus: "Ice Sheer DMG Bonus",
      electricSheerDmgBonus: "Electric Sheer DMG Bonus",
      physicalSheerDmgBonus: "Physical Sheer DMG Bonus",
      etherSheerDmgBonus: "Ether Sheer DMG Bonus",
    };

    return statNames[stat] || stat.replace(/([A-Z])/g, " $1").trim();
  };

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
          ...((!isApplicable || disabled) && {
            opacity: 0.6,
            backgroundColor: "rgb(34, 34, 34)",
          }),
        }}
      >
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && (ownerAgentId || effect.ownerAgentId) && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={`/resources/images/agents/icons/${ownerAgentId || effect.ownerAgentId}.png`}
                alt={
                  ownerDisplayName ||
                  effect.ownerDisplayName ||
                  ownerAgentId ||
                  effect.ownerAgentId
                }
                title={ownerDisplayName || effect.ownerDisplayName}
              />
            </div>
          )}
          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
            {/* Mostrar icono de especialidad si aplica */}
            {effect.condition?.requiresSpecialty && (
              <div
                className="ingame_toggle-agent_specialty"
                style={{
                  color: isApplicable ? "#7EFFDB" : "#ff6b6b",
                  backgroundColor: isApplicable ? "#1a3a2a" : "#3a1a1a",
                }}
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
          {/*{sourceNote && (
            <span className="WET005" style={{ fontSize: 11, color: "#888" }}>
              ({sourceNote})
            </span>
          )}*/}
        </div>

        {/* Descripción */}
        <div className="ingame_toggle-description_section">
          <p>{effect.shortDescription || effect.description}</p>
        </div>
        {/* Controles de W-Engine - SOLO si es aplicable */}
        {!disabled && isApplicable && (
          <>
            {/* Toggle principal */}
            <div className="ingame_toggle-toggle_section">
              <div className="ingame_toggle-toggle_section-switch">
                <input
                  className="ingame_toggle-toggle_section-input"
                  id={`wengine-toggle-${effect.id}`}
                  type="checkbox"
                  checked={enabled}
                  onChange={onToggle}
                  disabled={disabled}
                />
                <label
                  className="ingame_toggle-toggle_section-label"
                  htmlFor={`wengine-toggle-${effect.id}`}
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

              {/*<span className="ingame_toggle-toggle_text">
                  {effect.target === "team" ? "Activate (Team)" : "Activate"}
                </span>*/}
            </div>
            <div className="ingame_toggle-controls_section">
              {/* Selector de Stacks */}
              {showStackSelector && (
                <div className="ingame_toggle-stacks_section">
                  <label>
                    Stacks: {localStacks} / {maxStacks}
                  </label>

                  <div className="ingame_toggle-stacks_section-range">
                    <input
                      type="range"
                      min={1}
                      max={maxStacks}
                      value={localStacks}
                      onChange={(e) =>
                        handleStackChange(Number(e.target.value))
                      }
                      disabled={disabled}
                      style={{ accentColor: theme }}
                    />

                    <div className="ingame_toggle-stacks_section-number">
                      <button
                        onClick={() => handleStackChange(localStacks - 1)}
                      >
                        −
                      </button>

                      <span>{localStacks}</span>

                      <button
                        onClick={() => handleStackChange(localStacks + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de Overclock */}
              {showOverclockSelector && (
                <div className="ingame_toggle-overclock_section">
                  <label className="ingame_toggle-label">
                    W-Engine Overclock:
                  </label>

                  <div className="ingame_toggle-button_group">
                    {effect.wEngineOverclock!.levels.map((levelData) => {
                      const isActive = localOverclock === levelData.level;

                      return (
                        <button
                          key={levelData.level}
                          type="button"
                          className={`ingame_toggle-button ${isActive ? "is-active" : ""}`}
                          onClick={() => handleOverclockChange(levelData.level)}
                          style={{ ["--theme" as any]: theme }}
                          title={
                            levelData.label ||
                            `Overclock Level ${levelData.level}`
                          }
                        >
                          {levelData.level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mostrar stats calculados */}
              {enabled && Object.keys(stats).length > 0 && (
                <div className="ingame_toggle-stats_section">
                  <div className="ingame_toggle-stats_header">
                    Active Buffs (Overclock {localOverclock})
                  </div>

                  {/* Stats normales */}
                  {Object.entries(stats)
                    .filter(
                      ([key]) =>
                        !key.startsWith("_") && !key.startsWith("damageBonus_"),
                    )
                    .map(([stat, value]) => (
                      <div className="ingame_toggle-stat_row" key={stat}>
                        <span className="ingame_toggle-stat_name">
                          {formatStatName(stat)}:
                        </span>

                        <span className="ingame_toggle-stat_value">
                          +{formatStatValue(stat, value)}
                          {stackMultiplier &&
                            maxStacks > 1 &&
                            ` (×${localStacks})`}
                        </span>
                      </div>
                    ))}

                  {/* Damage bonuses */}
                  {(stats as any)._damageBonuses?.map(
                    (bonus: any, index: number) => {
                      let description = "";

                      if (
                        bonus.type === "skillTypeElementalSheer" &&
                        bonus.element &&
                        bonus.skillType
                      ) {
                        const skillTypeName =
                          bonus.skillType === "ultimate"
                            ? "ULTIMATE"
                            : bonus.skillType === "ex"
                              ? "EX SPECIAL"
                              : bonus.skillType.toUpperCase();

                        description = `${bonus.element.toUpperCase()} Sheer DMG (${skillTypeName})`;
                      } else if (
                        bonus.type === "elementSheerDmg" &&
                        bonus.element
                      ) {
                        description = `${bonus.element.toUpperCase()} Sheer DMG`;
                      } else if (
                        bonus.type === "skillTypeElemental" &&
                        bonus.element &&
                        bonus.skillType
                      ) {
                        description = `${bonus.element.toUpperCase()} DMG (${bonus.skillType.toUpperCase()})`;
                      } else if (bonus.type === "global") {
                        description = "All DMG";
                      } else if (bonus.type === "element" && bonus.element) {
                        description = `${bonus.element.toUpperCase()} DMG`;
                      } else if (
                        bonus.type === "skillType" &&
                        bonus.skillType
                      ) {
                        description = `${bonus.skillType.toUpperCase()} DMG`;
                      } else {
                        description = bonus.type || "Bonus";
                      }

                      return (
                        <div
                          className="ingame_toggle-stat_row is-bonus"
                          key={index}
                        >
                          <span className="ingame_toggle-stat_name">
                            {description}:
                          </span>
                          <span className="ingame_toggle-stat_value is-bonus">
                            +{(bonus.value * 100).toFixed(1)}%
                            {stackMultiplier &&
                              maxStacks > 1 &&
                              ` (×${localStacks})`}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Mensaje si está deshabilitado o no aplica */}
        {(!isApplicable || disabled) && (
          <div className="ingame_toggle-disabled_section">
            <p>
              {!isApplicable
                ? `Not applicable for ${agentSpecialty} agents`
                : sourceNote
                  ? `Effect received from ${sourceNote}`
                  : "Controlled by another slot"}
            </p>
          </div>
        )}

        {/* Info adicional */}
        {/*<div className="WET026">
          <div>Target: {effect.target === "self" ? "Self" : "Team"}</div>
          {effect.condition?.requiresSpecialty && (
            <div>Requires: {effect.condition.requiresSpecialty} agent</div>
          )}
          {hasWEngineConfig && (
            <div>
              W-Engine Overclock: Level {localOverclock} of {maxOverclock}
            </div>
          )}
          {maxStacks > 1 && <div>Max Stacks: {maxStacks}</div>}
        </div>*/}
      </div>
    </div>
  );
};

export default WEngineEffectToggle;
