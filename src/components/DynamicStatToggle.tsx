import type { IngameEffect } from "@/types/IngameEffect";
import type { UnifiedStats } from "@/types/Agent";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  onToggle: () => void;
  unifiedStats: UnifiedStats;
  disabled?: boolean;
  sourceNote?: string;
  showOwnerIcon?: boolean;
  theme?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

const DynamicStatToggle = ({
  effect,
  enabled,
  onToggle,
  unifiedStats,
  disabled = false,
  sourceNote,
  showOwnerIcon = false,
  theme = "#ffffff",
  ownerAgentId,
  ownerDisplayName,
}: Props) => {
  const calculateBonus = () => {
    if (!effect.dynamicStatBonuses?.[0] || !enabled) return null;
    const dynamicBonus = effect.dynamicStatBonuses[0];
    const baseStat = (unifiedStats[dynamicBonus.stat] as number) || 0;
    let bonusValue = baseStat * dynamicBonus.multiplier;
    if (dynamicBonus.maxValue) {
      bonusValue = Math.min(bonusValue, dynamicBonus.maxValue);
    }
    return {
      value: bonusValue,
      percentage: bonusValue * 100,
      baseStat,
      multiplier: dynamicBonus.multiplier * 100,
      maxValue: dynamicBonus.maxValue,
    };
  };

  const bonus = calculateBonus();

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient( to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11 )`,
  };

  return (
    <div
      className="ingame_toggle-main_container"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <div className="ingame_toggle-main_wrapper" style={emptyObjectsStyle}>
        {/* 1° SECCIÓN - HEADER (grid-column: 1 / 3, grid-row: 1) */}
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && (ownerAgentId || effect.ownerAgentId) && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${ownerAgentId || effect.ownerAgentId}.png`}
                alt={
                  ownerDisplayName ||
                  effect.ownerDisplayName ||
                  ownerAgentId ||
                  effect.ownerAgentId
                }
                title={ownerDisplayName || effect.ownerDisplayName}
              />
              {effect.target === "team" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  T
                </div>
              )}
            </div>
          )}
          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
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

        {/* 2° SECCIÓN - DESCRIPCIÓN (grid-column: 1 / 2, grid-row: 2) */}
        <div className="ingame_toggle-description_section">
          <p>{effect.shortDescription || effect.description}</p>
        </div>

        {/* 2° SECCIÓN - TOGGLE (grid-column: 2 / 3, grid-row: 2) */}
        <div className="ingame_toggle-toggle_section">
          <div className="ingame_toggle-toggle_section-switch">
            <input
              className="ingame_toggle-toggle_section-input"
              id={`dynamic-toggle-${effect.id}`}
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={disabled}
            />
            <label
              className="ingame_toggle-toggle_section-label"
              htmlFor={`dynamic-toggle-${effect.id}`}
              style={
                enabled
                  ? { backgroundColor: theme, ["--toggle-color" as any]: theme }
                  : undefined
              }
            />
          </div>
        </div>

        {/* 3° SECCIÓN - CONTROLES (grid-column: 1 / 3, grid-row: 3) */}
        <div className="ingame_toggle-controls_section">
          {!disabled ? (
            <>
              {/* Mostrar bonus dinámico */}
              {enabled && bonus && (
                <div className="ingame_toggle-stats_section">
                  <div
                    className="ingame_toggle-stats_header"
                    style={{ color: theme }}
                  >
                    📊 Dynamic Bonus Calculation
                  </div>
                  <div className="ingame_toggle-stat_row">
                    <span className="ingame_toggle-stat_name">
                      Current CRIT DMG:
                    </span>
                    <span className="ingame_toggle-stat_value">
                      {(unifiedStats.critDmg * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="ingame_toggle-stat_row">
                    <span className="ingame_toggle-stat_name">
                      Bonus multiplier:
                    </span>
                    <span className="ingame_toggle-stat_value">
                      {bonus.multiplier.toFixed(0)}%
                    </span>
                  </div>
                  <div className="ingame_toggle-stat_row is-bonus">
                    <span className="ingame_toggle-stat_name">
                      ⚡ Aftershock CRIT DMG Bonus:
                    </span>
                    <span className="ingame_toggle-stat_value is-bonus">
                      +{bonus.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="ingame_toggle-stat_row"
                    style={{ fontSize: "11px", opacity: 0.7 }}
                  >
                    <span className="ingame_toggle-stat_name">
                      {(unifiedStats.critDmg * 100).toFixed(1)}% ×{" "}
                      {bonus.multiplier.toFixed(0)}% = +
                      {bonus.percentage.toFixed(1)}%
                    </span>
                  </div>
                  {bonus.value >= (bonus.maxValue || Infinity) && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "6px",
                        backgroundColor: "rgba(255, 107, 53, 0.2)",
                        borderRadius: "4px",
                        color: "#FF6B35",
                        fontSize: "11px",
                        textAlign: "center",
                      }}
                    >
                      ⚠️ Max bonus reached (cap:{" "}
                      {(bonus.maxValue! * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="ingame_toggle-disabled_section">
              <p>
                {sourceNote
                  ? `Effect received from ${sourceNote}`
                  : "Controlled by another slot"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicStatToggle;
