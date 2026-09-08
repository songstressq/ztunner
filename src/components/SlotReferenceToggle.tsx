import type { IngameEffect } from "@/types/IngameEffect";
import { useState } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  onToggle: () => void;
  onTargetSlotChange: (slot: number | null) => void;
  targetSlots: Array<{ slot: number; agentName: string; specialty: string }>;
  selectedTargetSlot: number | null;
  teamSlotsInfo: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
  }>;
  showOwnerIcon?: boolean;
  disabled?: boolean;
  mindscape2Active?: boolean;
  onMindscape2Toggle?: () => void;
  theme?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
  sourceNote?: string;
}

const SlotReferenceToggle = ({
  effect,
  enabled,
  onToggle,
  onTargetSlotChange,
  targetSlots,
  selectedTargetSlot,
  teamSlotsInfo,
  showOwnerIcon = false,
  disabled = false,
  mindscape2Active = false,
  onMindscape2Toggle,
  theme = "#ffffff",
  ownerAgentId,
  ownerDisplayName,
  sourceNote,
}: Props) => {
  const getSpecialtyIcon = (specialty: string) => {
    const iconMap: Record<string, string> = {
      Attack: "Attack",
      Rupture: "Rupture",
      Anomaly: "Anomaly",
      Stun: "Stun",
      Support: "Support",
    };
    const iconName = iconMap[specialty];
    if (!iconName) return <span className="slotref-icon">👤</span>;
    return (
      <img
        src={`/ztunner/resources/images/icons/specialties/${iconName}.png`}
        alt={specialty}
        className="slotref-specialty-icon"
      />
    );
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case "Attack":
        return "#FF6B35";
      case "Rupture":
        return "#7EFFDB";
      case "Anomaly":
        return "#9B59B6";
      case "Stun":
        return "#F1C40F";
      case "Support":
        return "#3498DB";
      default:
        return "#aaa";
    }
  };

  const selectedSlotInfo =
    selectedTargetSlot !== null
      ? teamSlotsInfo.find((slot) => slot.slotIndex === selectedTargetSlot)
      : null;

  const refEffect = effect.referenceStatEffect;
  const guaranteedCrit = refEffect?.guaranteedCrit || false;
  const bonusCritDmg = refEffect?.bonusCritDmg || 0;

  const getMultiplierDisplay = () => {
    if (!selectedSlotInfo || !refEffect) return null;
    const baseMultiplier =
      refEffect.specialtyMultipliers?.[selectedSlotInfo.specialty] ||
      refEffect.multiplier;
    if (!mindscape2Active) {
      return { base: baseMultiplier, total: baseMultiplier, bonus: 0 };
    }
    let bonus = 0;
    if (selectedSlotInfo.specialty === "Attack") {
      bonus = 2.0;
    } else if (selectedSlotInfo.specialty === "Anomaly") {
      bonus = 3.0;
    }
    return { base: baseMultiplier, total: baseMultiplier + bonus, bonus };
  };

  const multiplierDisplay = getMultiplierDisplay();
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
                  src={`/ztunner/resources/images/agents/icons/${ownerAgentId || effect.ownerAgentId}.png`}
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
                    src={`/ztunner/resources/images/icons/specialties/${effect.condition.requiresSpecialty}.png`}
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
              id={`slotref-toggle-${effect.id}`}
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={disabled}
            />
            <label
              className="ingame_toggle-toggle_section-label"
              htmlFor={`slotref-toggle-${effect.id}`}
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
              {/* ⭐ Selector de slot - SOLO visible cuando enabled está activo */}
              {enabled && (
                <>
                  <div className="slotref-selector_section">
                    <label className="slotref-label">
                      Select Reference Squad Member:
                    </label>
                    <div className="slotref-button_group">
                      {targetSlots.map((slotInfo) => {
                        const isSelected = selectedTargetSlot === slotInfo.slot;
                        const specialtyColor = getSpecialtyColor(
                          slotInfo.specialty,
                        );
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
                            <span className="slotref-icon">
                              {getSpecialtyIcon(slotInfo.specialty)}
                            </span>
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
                        <span className="slotref-icon">❌</span>
                        <span className="slotref-name">None</span>
                      </button>
                    </div>
                  </div>

                  {/* Info del bonus según specialty */}
                  {selectedSlotInfo && refEffect && multiplierDisplay && (
                    <div className="ingame_toggle-stats_section">
                      <div
                        className="ingame_toggle-stats_header"
                        style={{ color: theme }}
                      >
                        📊 Reference Bonus Details
                      </div>

                      {selectedSlotInfo.specialty === "Attack" && (
                        <>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              ⚔️ Attack Agent Selected
                            </span>
                          </div>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Will use {selectedSlotInfo.agentName}'s ATK ×{" "}
                              {multiplierDisplay.total.toFixed(1)}
                            </span>
                            <span className="ingame_toggle-stat_value">
                              {mindscape2Active &&
                                multiplierDisplay.bonus > 0 && (
                                  <span style={{ color: "#9B59B6" }}>
                                    (Base: {multiplierDisplay.base} + MS2: +
                                    {multiplierDisplay.bonus})
                                  </span>
                                )}
                            </span>
                          </div>
                        </>
                      )}

                      {selectedSlotInfo.specialty === "Anomaly" && (
                        <>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              🌀 Anomaly Agent Selected
                            </span>
                          </div>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Will use {selectedSlotInfo.agentName}'s ATK ×{" "}
                              {multiplierDisplay.total.toFixed(1)}
                            </span>
                            <span className="ingame_toggle-stat_value">
                              {mindscape2Active &&
                                multiplierDisplay.bonus > 0 && (
                                  <span style={{ color: "#9B59B6" }}>
                                    (Base: {multiplierDisplay.base} + MS2: +
                                    {multiplierDisplay.bonus})
                                  </span>
                                )}
                            </span>
                          </div>
                        </>
                      )}

                      {selectedSlotInfo.specialty === "Rupture" && (
                        <>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              💥 Rupture Agent Selected
                            </span>
                          </div>
                          <div className="ingame_toggle-stat_row">
                            <span className="ingame_toggle-stat_name">
                              Will use {selectedSlotInfo.agentName}'s Sheer
                              Force × {multiplierDisplay.total.toFixed(1)}
                            </span>
                          </div>
                        </>
                      )}

                      {guaranteedCrit && (
                        <div className="ingame_toggle-stat_row is-bonus">
                          <span className="ingame_toggle-stat_name">
                            ⚡ Guaranteed CRIT!
                          </span>
                          <span className="ingame_toggle-stat_value is-bonus">
                            +{(bonusCritDmg * 100).toFixed(0)}% CRIT DMG
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox para Mindscape 2 (solo para Sunna) */}
                  {effect.id === "sunna-core_2-cuteness_is_justice" &&
                    onMindscape2Toggle && (
                      <div className="slotref-mindscape_section">
                        <label className="slotref-checkbox_label">
                          <input
                            type="checkbox"
                            checked={mindscape2Active}
                            onChange={onMindscape2Toggle}
                            disabled={!enabled}
                          />
                          <span
                            style={{ color: "#9B59B6", fontWeight: "bold" }}
                          >
                            🧠 Mindscape 2 Active
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#aaa" }}>
                            (Attack: +200%, Anomaly: +300%)
                          </span>
                        </label>
                      </div>
                    )}
                </>
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

export default SlotReferenceToggle;
