import { InfoTooltip } from "./InfoTooltip";

interface Props {
  enabled: boolean;
  onToggle: () => void;
  selectedVanguardSlot: number | null;
  onVanguardSlotChange: (slot: number | null) => void;
  availableAttackSlots: { slot: number; agentName: string }[];
  disabled?: boolean;
  theme?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

const SeedVanguardSelector = ({
  enabled,
  onToggle,
  selectedVanguardSlot,
  onVanguardSlotChange,
  availableAttackSlots,
  disabled = false,
  theme = "#7EFFDB",
  ownerAgentId,
  ownerDisplayName,
}: Props) => {
  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11)`,
  };

  return (
    <div
      className="ingame_toggle-main_container"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <div className="ingame_toggle-main_wrapper" style={emptyObjectsStyle}>
        {/* 1° SECCIÓN - HEADER */}
        <div className="ingame_toggle-first_row">
          <div style={{ display: "flex", alignItems: "center" }}>
            {ownerAgentId && (
              <div className="ingame_toggle-agent_icon">
                <img
                  src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${ownerAgentId}.png`}
                  alt={ownerDisplayName || ownerAgentId}
                  title={ownerDisplayName || ownerAgentId}
                />
              </div>
            )}
            <div className="ingame_toggle-title-section seed-title">
              <strong>Flower Chain Protocol (Core Passive)</strong>
            </div>
          </div>
          <InfoTooltip
            content="Select which Attack agent is Seed's Vanguard. Both receive ATK +1000 and CRIT DMG +30%."
            theme={theme}
          />
        </div>

        {/* 2° SECCIÓN - DESCRIPCIÓN */}
        <div className="ingame_toggle-description_section">
          <p>
            Select an Attack agent as Vanguard. Both Seed and the Vanguard gain
            ATK +1000 and CRIT DMG +30%.
          </p>
        </div>

        {/* 2° SECCIÓN - TOGGLE */}
        <div className="ingame_toggle-toggle_section">
          <div className="ingame_toggle-toggle_section-switch">
            <input
              className="ingame_toggle-toggle_section-input"
              id="seed-flower-chain-toggle"
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={disabled}
            />
            <label
              className="ingame_toggle-toggle_section-label"
              htmlFor="seed-flower-chain-toggle"
              style={
                enabled
                  ? { backgroundColor: theme, ["--toggle-color" as any]: theme }
                  : undefined
              }
            />
          </div>
        </div>

        {/* 3° SECCIÓN - CONTROLES */}
        <div className="ingame_toggle-controls_section">
          {enabled && (
            <>
              <div className="slotref-selector_section">
                <label className="slotref-label">
                  Select Vanguard (Attack Agent):
                </label>
                <div className="slotref-button_group">
                  {availableAttackSlots.map((slotInfo) => {
                    const isSelected = selectedVanguardSlot === slotInfo.slot;
                    return (
                      <button
                        key={slotInfo.slot}
                        type="button"
                        onClick={() => onVanguardSlotChange(slotInfo.slot)}
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
                        <img
                          src="{`${import.meta.env.BASE_URL}resources/images/icons/specialties/Attack.png"
                          alt="Attack"
                          className="slotref-specialty-icon"
                        />
                        <span className="slotref-name">
                          Slot {slotInfo.slot + 1}
                        </span>
                        <span className="slotref-agent">
                          {slotInfo.agentName}
                        </span>
                        <span className="slotref-specialty">(Attack)</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onVanguardSlotChange(null)}
                    className={`slotref-button ${selectedVanguardSlot === null ? "is-active is-none" : ""}`}
                    style={{
                      backgroundColor:
                        selectedVanguardSlot === null
                          ? "#ff6b6b"
                          : "rgba(40, 40, 40, 0.6)",
                    }}
                  >
                    <span className="slotref-icon">❌</span>
                    <span className="slotref-name">None</span>
                  </button>
                </div>
              </div>
              {selectedVanguardSlot !== null && (
                <div className="ingame_toggle-stats_section">
                  <div
                    className="ingame_toggle-stats_header"
                    style={{ color: theme }}
                  >
                    📊 Active Buffs
                  </div>
                  <div className="ingame_toggle-stat_row">
                    <span className="ingame_toggle-stat_name">ATK Bonus:</span>
                    <span className="ingame_toggle-stat_value">+1000</span>
                  </div>
                  <div className="ingame_toggle-stat_row">
                    <span className="ingame_toggle-stat_name">
                      CRIT DMG Bonus:
                    </span>
                    <span className="ingame_toggle-stat_value">+30%</span>
                  </div>
                  <div className="ingame_toggle-stat_row">
                    <span className="ingame_toggle-stat_name">Target:</span>
                    <span
                      className="ingame_toggle-stat_value"
                      style={{ color: theme }}
                    >
                      Seed + Slot {selectedVanguardSlot + 1}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeedVanguardSelector;
