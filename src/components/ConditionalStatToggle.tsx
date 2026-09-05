import type { IngameEffect } from "@/types/IngameEffect";
import { useState } from "react";

interface Props {
  effect: IngameEffect;
  enabled: boolean;
  onToggle: () => void;
  onConditionalToggle?: (enabled: boolean) => void;
  conditionalEnabled?: boolean;
  showOwnerIcon?: boolean;
  disabled?: boolean;
}

const ConditionalStatToggle = ({
  effect,
  enabled,
  onToggle,
  onConditionalToggle,
  conditionalEnabled = false,
  showOwnerIcon = false,
  disabled = false,
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
      defShred: "DEF Ignore",
      critRate: "CRIT Rate",
      critDmg: "CRIT DMG",
      atkPercent: "ATK%",
      atkFlat: "ATK",
    };
    return names[stat] || stat;
  };

  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "10px",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: disabled ? "#222" : "transparent",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        {showOwnerIcon && effect.ownerAgentId && (
          <img
            src={`/resources/images/agents/icons/${effect.ownerAgentId}.png`}
            alt={effect.ownerDisplayName || effect.ownerAgentId}
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
          />
        )}
        <strong style={{ fontSize: 14, color: "black" }}>{effect.label}</strong>
        {effect.description && (
          <div className="info-icon" data-tooltip={effect.description}>
            i
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#ccc", marginBottom: "12px" }}>
        {effect.shortDescription || effect.description}
      </p>

      {/* Base Stats */}
      {Object.entries(baseStats).length > 0 && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "8px",
            borderRadius: "6px",
            marginBottom: "8px",
            borderLeft: "3px solid #7EFFDB",
          }}
        >
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: "4px" }}>
            Always Active:
          </div>
          {Object.entries(baseStats).map(([stat, value]) => (
            <div
              key={stat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span>{formatStatName(stat)}:</span>
              <span style={{ color: "#7EFFDB" }}>
                +{formatStatValue(stat, value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Conditional Stats */}
      {Object.entries(conditionalStats).length > 0 && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "8px",
            borderRadius: "6px",
            marginBottom: "8px",
            borderLeft: conditionalEnabled
              ? "3px solid #FFD700"
              : "3px solid #666",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: 11, color: "#aaa" }}>
              During {effect.conditionalStats?.requiresBuff || "Condition"}:
            </span>
            {onConditionalToggle && (
              <label
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={conditionalEnabled}
                  onChange={() => onConditionalToggle(!conditionalEnabled)}
                  disabled={!enabled || disabled}
                />
                Activate
              </label>
            )}
          </div>
          {Object.entries(conditionalStats).map(([stat, value]) => (
            <div
              key={stat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span>{formatStatName(stat)}:</span>
              <span style={{ color: conditionalEnabled ? "#FFD700" : "#888" }}>
                +{conditionalEnabled ? formatStatValue(stat, value) : "0"}
              </span>
            </div>
          ))}
          {effect.conditionalStats?.requiresStacks && (
            <div style={{ fontSize: 10, color: "#888", marginTop: "4px" }}>
              Requires: {effect.conditionalStats.requiresStacks} stacks
            </div>
          )}
        </div>
      )}

      {/* Main Toggle */}
      <div style={{ marginTop: "8px" }}>
        <label
          style={{
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            disabled={disabled}
          />
          {effect.target === "team" ? "Activate (Team)" : "Activate"}
        </label>
      </div>

      {/* Target info */}
      <div style={{ fontSize: 11, color: "#666", marginTop: "8px" }}>
        Target: {effect.target === "self" ? "Self" : "Team"}
      </div>
    </div>
  );
};

export default ConditionalStatToggle;
