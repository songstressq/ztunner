import type { IngameEffect } from "@/types/IngameEffect";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  stacks: number;
  onToggle: () => void;
  onStacksChange?: (stacks: number) => void;
  onTargetSlotChange: (slot: number | null) => void;
  disabled?: boolean;
  sourceNote?: string;
  showOwnerIcon?: boolean;
  targetSlots: Array<{ slot: number; agentName: string; specialty: string }>;
  selectedTargetSlot: number | null;
  theme?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

const SlotTargetedEffectToggle = ({
  effect,
  enabled,
  stacks,
  onToggle,
  onStacksChange,
  onTargetSlotChange,
  disabled = false,
  sourceNote,
  showOwnerIcon = false,
  targetSlots,
  selectedTargetSlot,
  theme = "#ffffff",
  ownerAgentId,
  ownerDisplayName,
}: Props) => {
  const showStackSelector = enabled && effect.maxStacks && effect.maxStacks > 1;
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              id={`slottarget-toggle-${effect.id}`}
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={disabled}
            />
            <label
              className="ingame_toggle-toggle_section-label"
              htmlFor={`slottarget-toggle-${effect.id}`}
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
              {/* Selector de slot objetivo - SOLO visible cuando enabled está activo */}
              {enabled && (
                <div className="slotref-selector_section">
                  <label className="slotref-label">Select Target Agent:</label>
                  <div className="slotref-button_group">
                    {targetSlots.map((slotInfo) => {
                      const isSelected = selectedTargetSlot === slotInfo.slot;
                      return (
                        <button
                          key={slotInfo.slot}
                          type="button"
                          onClick={() => onTargetSlotChange(slotInfo.slot)}
                          className={`slotref-button ${isSelected ? "is-active" : ""}`}
                          style={{
                            backgroundColor: isSelected
                              ? theme
                              : "rgba(40, 40, 40, 0.6)",
                            borderColor: isSelected
                              ? theme
                              : "rgba(255, 255, 255, 0.15)",
                          }}
                        >
                          <span className="slotref-name">
                            Slot {slotInfo.slot + 1}
                          </span>
                          <span className="slotref-agent">
                            {slotInfo.agentName}
                          </span>
                          <span className="slotref-specialty">
                            ({slotInfo.specialty})
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onTargetSlotChange(null)}
                      className={`slotref-button ${selectedTargetSlot === null ? "is-active is-none" : ""}`}
                      style={{
                        backgroundColor:
                          selectedTargetSlot === null
                            ? "#ff6b6b"
                            : "rgba(40, 40, 40, 0.6)",
                      }}
                    >
                      <span className="slotref-name">❌ None</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selector de stacks */}
              {enabled && showStackSelector && onStacksChange && (
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
                          onStacksChange(
                            Math.min(effect.maxStacks!, stacks + 1),
                          )
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

export default SlotTargetedEffectToggle;
