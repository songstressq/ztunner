import type { IngameEffect } from "@/types/IngameEffect";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  stacks: number;
  onToggle: () => void;
  onStacksChange: (stacks: number) => void;
  disabled?: boolean;
  sourceNote?: string;
  showOwnerIcon?: boolean;
  theme?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

const EffectToggle = ({
  effect,
  enabled,
  stacks,
  onToggle,
  onStacksChange,
  disabled = false,
  sourceNote,
  showOwnerIcon = false,
  theme = "#ffffff",
  ownerAgentId,
  ownerDisplayName,
}: Props) => {
  const showStackSelector = enabled && effect.maxStacks && effect.maxStacks > 1;

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient( to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11 )`,
  };

  const tooltipText = effect.description
    ? `${effect.label}\n\n${effect.description}`
    : effect.label;

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
        {/* Título con icono de información */}
        <div className="ingame_toggle-first_row">
          {showOwnerIcon && (
            <div className="ingame_toggle-agent_icon">
              <img
                src={
                  (ownerAgentId || effect.ownerAgentId) === "gameMode"
                    ? "/ztunner/resources/images/agents/icons/game_mode.png"
                    : ownerAgentId || effect.ownerAgentId
                      ? `/ztunner/resources/images/agents/icons/${ownerAgentId || effect.ownerAgentId}.png`
                      : "/ztunner/resources/images/agents/icons/game_mode.png"
                }
                alt={ownerDisplayName || effect.ownerDisplayName || "Game Mode"}
                title={
                  ownerDisplayName || effect.ownerDisplayName || "Game Mode"
                }
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
          <div className="ingame_toggle-title-section">
            <strong>{effect.label}</strong>
          </div>
          {effect.description && <InfoTooltip content={tooltipText} />}
        </div>
        <div className="ingame_toggle-description_section">
          <p>{effect.shortDescription || effect.description}</p>
        </div>
        {!disabled ? (
          <>
            <div className="ingame_toggle-toggle_section">
              <div className="ingame_toggle-toggle_section-switch">
                <input
                  className="ingame_toggle-toggle_section-input"
                  id={`toggle-${effect.id}`}
                  type="checkbox"
                  checked={enabled}
                  onChange={onToggle}
                  disabled={disabled}
                />
                <label
                  className="ingame_toggle-toggle_section-label"
                  htmlFor={`toggle-${effect.id}`}
                  style={
                    enabled
                      ? {
                          backgroundColor: theme,
                          ["--toggle-color" as any]: theme,
                        }
                      : undefined
                  }
                ></label>
              </div>
            </div>

            {showStackSelector && (
              <div className="ingame_toggle-stacks_section">
                <label>
                  Stacks: {stacks} / {effect.maxStacks}
                </label>
                <div className="ingame_toggle-stacks_section-range">
                  <input
                    type="range"
                    min={1}
                    max={effect.maxStacks}
                    value={stacks}
                    onChange={(e) => onStacksChange(Number(e.target.value))}
                    disabled={disabled}
                    style={{ accentColor: theme }}
                  />
                  <div className="ingame_toggle-stacks_section-number">
                    <button
                      onClick={() => onStacksChange(Math.max(1, stacks - 1))}
                    >
                      −
                    </button>
                    <span>{stacks}</span>
                    <button
                      onClick={() =>
                        onStacksChange(Math.min(effect.maxStacks, stacks + 1))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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

export default EffectToggle;
