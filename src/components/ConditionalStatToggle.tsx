import type { IngameEffect } from "@/types/IngameEffect";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  onToggle: () => void;
  onConditionalToggle?: (enabled: boolean) => void;
  conditionalEnabled?: boolean;
  showOwnerIcon?: boolean;
  disabled?: boolean;
  theme: string;
}

const ConditionalStatToggle = ({
  effect,
  enabled,
  onToggle,
  onConditionalToggle,
  conditionalEnabled = false,
  showOwnerIcon = false,
  disabled = false,
  theme,
}: Props) => {
  const baseStats = effect.baseStats || {};
  const conditionalStats = effect.conditionalStats?.stats || {};

  const formatStatValue = (stat: string, value: number): string => {
    const percentStats = ["defShred", "critRate", "critDmg", "atkPercent"];
    if (percentStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toString();
  };

  const formatStatName = (stat: string): string => {
    const names: Record<string, string> = {
      defShred: "DEF Shred",
      critRate: "CRIT Rate",
      critDmg: "CRIT DMG",
      atkPercent: "ATK%",
      atkFlat: "ATK",
      hpFlat: "HP",
      defFlat: "DEF",
    };
    return names[stat] || stat;
  };

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11)`,
  };

  return (
    <div
      className="ingame_toggle-main_container"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <div className="ingame_toggle-main_wrapper" style={emptyObjectsStyle}>
        {/* HEADER */}
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && effect.ownerAgentId && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={`/ztunner/resources/images/agents/icons/${effect.ownerAgentId}.png`}
                alt={effect.ownerDisplayName || effect.ownerAgentId}
                title={effect.ownerDisplayName || effect.ownerAgentId}
              />
            </div>
          )}
          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
          </div>
          {effect.description && (
            <InfoTooltip
              content={`${effect.label}\n\n${effect.description}`}
              theme={theme}
            />
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="ingame_toggle-description_section">
          <p>{effect.shortDescription || effect.description}</p>
        </div>

        {/* TOGGLE PRINCIPAL */}
        <div className="ingame_toggle-toggle_section">
          <div className="ingame_toggle-toggle_section-switch">
            <input
              className="ingame_toggle-toggle_section-input"
              id={`conditional-stat-toggle-${effect.id}`}
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={disabled}
            />
            <label
              className="ingame_toggle-toggle_section-label"
              htmlFor={`conditional-stat-toggle-${effect.id}`}
              style={
                enabled
                  ? ({
                      backgroundColor: theme,
                      "--toggle-color": theme,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          </div>
        </div>

        {/* CONTROLS / STATS - SOLO SI enabled === true */}
        <div className="ingame_toggle-controls_section">
          {!disabled ? (
            <>
              {enabled && (
                <>
                  {/* Base Stats */}
                  {Object.entries(baseStats).length > 0 && (
                    <div className="ingame_toggle-stats_section">
                      <div
                        className="ingame_toggle-stats_header"
                        style={{ color: theme }}
                      >
                        Active Bonus
                      </div>
                      {Object.entries(baseStats).map(([stat, value]) => (
                        <div key={stat} className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            {formatStatName(stat)}:
                          </span>
                          <span className="ingame_toggle-stat_value">
                            +{formatStatValue(stat, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conditional Stats */}
                  {Object.entries(conditionalStats).length > 0 && (
                    <div className="ingame_toggle-stats_section">
                      <div
                        className="ingame_toggle-stats_header ingame_toggle-conditional_stat_header"
                        style={{ color: conditionalEnabled ? theme : "#888" }}
                      >
                        <span>
                          During{" "}
                          {effect.conditionalStats?.requiresBuff || "Condition"}
                        </span>
                        {onConditionalToggle && (
                          <div className="ingame_toggle-conditional_stat_subheader">
                            <div className="conditional-toggle-switch">
                              <input
                                className="conditional-toggle-input"
                                id={`conditional-switch-${effect.id}`}
                                type="checkbox"
                                checked={conditionalEnabled}
                                onChange={() =>
                                  onConditionalToggle(!conditionalEnabled)
                                }
                                disabled={!enabled || disabled}
                              />
                              <label
                                className="conditional-toggle-label"
                                htmlFor={`conditional-switch-${effect.id}`}
                                style={{
                                  backgroundColor: conditionalEnabled
                                    ? theme
                                    : "#ccc",
                                  boxShadow: conditionalEnabled
                                    ? `0 0 8px ${theme}`
                                    : "none",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {Object.entries(conditionalStats).map(([stat, value]) => (
                        <div key={stat} className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            {formatStatName(stat)}:
                          </span>
                          <span
                            className="ingame_toggle-stat_value"
                            style={{
                              color: conditionalEnabled ? theme : "#888",
                            }}
                          >
                            +
                            {conditionalEnabled
                              ? formatStatValue(stat, value)
                              : "0"}
                          </span>
                        </div>
                      ))}
                      {effect.conditionalStats?.requiresStacks && (
                        <div className="ingame_toggle-stat_row">
                          <span className="ingame_toggle-stat_name">
                            Requires:
                          </span>
                          <span className="ingame_toggle-stat_value">
                            {effect.conditionalStats.requiresStacks} stacks
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="ingame_toggle-disabled_section">
              <p>Controlled by another slot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditionalStatToggle;
