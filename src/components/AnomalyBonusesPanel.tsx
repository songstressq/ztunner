import { useState } from "react";
import type { AnomalyBonuses } from "@/utils/anomalyBonusCollector";

interface Props {
  anomalyBonuses: AnomalyBonuses;
  className?: string;
  isWindAgent?: boolean;
  refringeCoefficient?: number;
  isLuminizeMode?: boolean;
}

export default function AnomalyBonusesPanel({
  anomalyBonuses,
  className = "",
  isWindAgent,
  refringeCoefficient = 0,
  isLuminizeMode = false,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    anomalySources: true,
    anomalyTypes: true,
    anomalyStats: true,
    disorderSources: true,
    disorderMultiplier: true,
    disorderTypes: true,
    disorderStats: true,
    vortexDmg: true,
    vortexMultiplier: true,
    refringe: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const getSourceIcon = (source: {
    ownerAgentId?: string;
    ownerDisplayName?: string;
    source?: string;
  }) => {
    if (source.source === "gameMode") {
      return (
        <img
          src="/resources/images/agents/icons/game_mode.png"
          alt="Game Mode"
          className="damage_panel-item_summary-icon"
          title="Game Mode"
          onError={(e) => {
            console.error("❌ Error cargando game_mode.png");
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    if (source.ownerAgentId) {
      return (
        <img
          src={`/resources/images/agents/icons/${source.ownerAgentId}.png`}
          alt={source.ownerDisplayName || source.ownerAgentId}
          className="damage_panel-item_summary-icon"
          title={source.ownerDisplayName || source.ownerAgentId}
          onError={(e) => {
            console.error(
              "❌ Error cargando imagen del agente:",
              source.ownerAgentId,
            );
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    switch (source.source) {
      case "core":
        return "⭐";
      case "wEngine":
        return "⚙️";
      case "discSet":
        return "💿";
      case "mindscape":
        return "🧠";
      default:
        return "📦";
    }
  };

  const anomalySources = anomalyBonuses?.anomalySources ?? [];
  const disorderSources = anomalyBonuses?.disorderSources ?? [];
  const disorderMultiplierSources =
    anomalyBonuses?.disorderMultiplierSources ?? [];
  const perAnomalyType = anomalyBonuses?.perAnomalyType ?? {};
  const currentStatBonuses = anomalyBonuses?.currentStatBonuses ?? [];

  const generalAnomalySources = anomalySources.filter((s) => !s.anomalyType);
  const generalDisorderSources = disorderSources.filter((s) => !s.anomalyType);

  const anomalyTypeEntries = Object.entries(perAnomalyType).filter(
    ([, v]) => v.dmgBonus > 0,
  );
  const disorderTypeEntries = Object.entries(perAnomalyType).filter(
    ([, v]) => v.disorderBonus > 0,
  );
  const anomalyStatBonuses = currentStatBonuses.filter(
    (bonus) =>
      bonus.appliesTo?.anomaly &&
      !bonus.label.toLowerCase().includes("refringe"),
  );
  const disorderStatBonuses = currentStatBonuses.filter(
    (bonus) => bonus.appliesTo?.disorder,
  );
  const vortexDmgBonus = anomalyBonuses?.vortexDmgBonus ?? 0;
  const vortexDmgSources = anomalyBonuses?.vortexDmgSources ?? [];
  const vortexMultiplierBonus = anomalyBonuses?.vortexMultiplierBonus ?? 0;
  const vortexMultiplierSources = anomalyBonuses?.vortexMultiplierSources ?? [];
  const refringeSources = anomalyBonuses.refringeSources ?? [];
  const totalRefringe = anomalyBonuses.breakdown?.totalRefringe ?? 0;
  const hasAnomalyBonuses =
    anomalySources.length > 0 ||
    Object.keys(perAnomalyType).length > 0 ||
    currentStatBonuses.length > 0 ||
    vortexMultiplierBonus > 0 ||
    vortexMultiplierSources.length > 0 ||
    vortexDmgBonus > 0 ||
    vortexDmgSources.length > 0 ||
    refringeSources.length > 0;

  const hasDisorderBonuses =
    disorderSources.length > 0 ||
    disorderMultiplierSources.length > 0 ||
    Object.values(perAnomalyType).some((v) => v.disorderBonus > 0) ||
    currentStatBonuses.some((bonus) => bonus.appliesTo?.disorder);

  return (
    <div className={`damage_bonuses_panel-main_wrapper ${className}`}>
      {/* Resumen rápido */}
      {/* ⭐ TOTAL ANOMALY DMG BONUS - Siempre visible */}
      <div className="damage_panel-header_container">
        <span className="damage_panel-header_text">
          Total Anomaly DMG Bonus:
        </span>
        <span className="damage_panel-header_tag">
          {formatPercentage(anomalyBonuses.anomalyDmgBonus)}
        </span>
      </div>

      {/* ⭐ TOTAL DISORDER DMG BONUS - Solo visible si NO es Wind */}
      {!isWindAgent && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            {" "}
            Total Disorder DMG Bonus:{" "}
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(anomalyBonuses.disorderDmgBonus)}
          </span>
        </div>
      )}

      {/* ⭐ TOTAL VORTEX DMG BONUS - Siempre visible para Wind */}
      {isWindAgent && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            {" "}
            Total Vortex DMG Bonus:{" "}
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(vortexDmgBonus)}
          </span>
        </div>
      )}

      {/* ⭐ TOTAL DISORDER MULTIPLIER BONUS - Solo visible si > 0 */}
      {anomalyBonuses.disorderMultiplierBonus > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            Total Disorder Multiplier Bonus:
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(anomalyBonuses.disorderMultiplierBonus)}
          </span>
        </div>
      )}

      {/* ⭐ TOTAL VORTEX MULTIPLIER BONUS - Solo visible si > 0 */}
      {vortexMultiplierBonus > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            Total Vortex Multiplier Bonus:
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(vortexMultiplierBonus)}
          </span>
        </div>
      )}

      {/* ⭐ REFRINGE COEFFICIENT - solo si > 0 */}
      {totalRefringe > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            Total Refringe Coefficient:
          </span>
          <span className="damage_panel-header_tag">
            {(totalRefringe * 100).toFixed(2)}%
          </span>
        </div>
      )}

      {/* ANOMALY DMG BONUSES */}
      {generalAnomalySources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("anomalySources")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.anomalySources ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Anomaly DMG Bonuses{" "}
            </span>
            <span className="damage_panel-item_header-tag">
              +
              {formatPercentage(
                generalAnomalySources.reduce((sum, s) => sum + s.value, 0),
              )}
            </span>
          </div>
          {expandedSections.anomalySources && (
            <div className="damage_panel-item_summary">
              {generalAnomalySources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          {" "}
                          x{source.stacks}{" "}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{formatPercentage(source.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANOMALY DMG BONUSES BY TYPE */}
      {anomalyTypeEntries.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("anomalyTypes")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.anomalyTypes ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Anomaly DMG Bonuses by Type{" "}
            </span>
          </div>
          {expandedSections.anomalyTypes && (
            <div className="damage_panel-item_summary">
              {anomalyTypeEntries.map(([type, bonuses]) => {
                const typeSources = anomalySources.filter(
                  (s) => s.anomalyType === type,
                );
                return (
                  <div
                    key={`anomaly-type-${type}`}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {capitalize(type)} Anomaly DMG
                      </span>
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatPercentage(bonuses.dmgBonus)}
                      </span>
                    </div>
                    {typeSources.length > 0 && (
                      <div className="damage_panel-item_summary-subitem_subcontainer">
                        {typeSources.map((source, idx) => (
                          <div
                            key={`${source.id}-${idx}`}
                            className="damage_panel-item_summary-container"
                          >
                            <div className="damage_panel-item_summary-text">
                              <div className="damage_panel-subitem_summary-grid_area_1">
                                <span>{getSourceIcon(source)}</span>
                              </div>
                              <div className="damage_panel-subitem_summary-grid_area_2">
                                <span>{source.label}</span>
                                {source.stacks > 1 && (
                                  <span
                                    className="damage_panel-item_summary-stacks"
                                    style={{ fontSize: 11 }}
                                  >
                                    {" "}
                                    x{source.stacks}{" "}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="damage_panel-subitem_summary-tag">
                              +{formatPercentage(source.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANOMALY STAT BONUSES */}
      {anomalyStatBonuses.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("anomalyStats")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.anomalyStats ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Anomaly Stat Bonuses{" "}
            </span>
          </div>
          {expandedSections.anomalyStats && (
            <div className="damage_panel-item_summary">
              {anomalyStatBonuses.map((bonus, idx) => (
                <div
                  key={`anomaly-stat-${idx}`}
                  className="damage_panel-item_summary-subitem_container"
                >
                  <div className="damage_panel-item_summary-subitem_header">
                    <span className="damage_panel-item_summary-subitem_title">
                      {bonus.label}
                    </span>
                    <span className="damage_panel-item_summary-subitem_tag">
                      +{formatPercentage(bonus.bonusValue)}
                    </span>
                  </div>
                  <div className="damage_panel-item_summary-subitem_subcontainer">
                    <div className="damage_panel-item_summary-container">
                      <div className="damage_panel-item_summary-text">
                        <div className="damage_panel-subitem_summary-grid_area_1">
                          <span>{getSourceIcon(bonus)}</span>
                        </div>
                        <span className="damage_panel-subitem_summary-grid_area_2">
                          based on {bonus.basedOn}:{" "}
                          {Math.round(bonus.currentValue).toLocaleString()}
                          {bonus.bonusValue >= (bonus.maxBonus ?? Infinity) &&
                            " (MAX)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISORDER DMG BONUSES */}
      {generalDisorderSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("disorderSources")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.disorderSources ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Disorder DMG Bonuses{" "}
            </span>
            <span className="damage_panel-item_header-tag">
              +
              {formatPercentage(
                generalDisorderSources.reduce((sum, s) => sum + s.value, 0),
              )}
            </span>
          </div>
          {expandedSections.disorderSources && (
            <div className="damage_panel-item_summary">
              {generalDisorderSources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          {" "}
                          x{source.stacks}{" "}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{formatPercentage(source.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISORDER MULTIPLIER BONUSES */}
      {disorderMultiplierSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("disorderMultiplier")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.disorderMultiplier ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Disorder Multiplier Bonuses{" "}
            </span>
            <span className="damage_panel-item_header-tag">
              +
              {formatPercentage(
                disorderMultiplierSources.reduce((sum, s) => sum + s.value, 0),
              )}
            </span>
          </div>
          {expandedSections.disorderMultiplier && (
            <div className="damage_panel-item_summary">
              {disorderMultiplierSources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          {" "}
                          x{source.stacks}{" "}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{formatPercentage(source.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISORDER DMG BONUSES BY TYPE */}
      {disorderTypeEntries.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("disorderTypes")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.disorderTypes ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Disorder DMG Bonuses by Type{" "}
            </span>
          </div>
          {expandedSections.disorderTypes && (
            <div className="damage_panel-item_summary">
              {disorderTypeEntries.map(([type, bonuses]) => {
                const typeSources = disorderSources.filter(
                  (s) => s.anomalyType === type,
                );
                return (
                  <div
                    key={`disorder-type-${type}`}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {capitalize(type)} Disorder DMG
                      </span>
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatPercentage(bonuses.disorderBonus)}
                      </span>
                    </div>
                    {typeSources.length > 0 && (
                      <div className="damage_panel-item_summary-subitem_subcontainer">
                        {typeSources.map((source, idx) => (
                          <div
                            key={`${source.id}-${idx}`}
                            className="damage_panel-item_summary-container"
                          >
                            <div className="damage_panel-item_summary-text">
                              <div className="damage_panel-subitem_summary-grid_area_1">
                                <span>{getSourceIcon(source)}</span>
                              </div>
                              <div className="damage_panel-subitem_summary-grid_area_2">
                                <span>{source.label}</span>
                                {source.stacks > 1 && (
                                  <span
                                    className="damage_panel-item_summary-stacks"
                                    style={{ fontSize: 11 }}
                                  >
                                    {" "}
                                    x{source.stacks}{" "}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="damage_panel-subitem_summary-tag">
                              +{formatPercentage(source.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DISORDER STAT BONUSES */}
      {disorderStatBonuses.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("disorderStats")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.disorderStats ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Disorder Stat Bonuses{" "}
            </span>
          </div>
          {expandedSections.disorderStats && (
            <div className="damage_panel-item_summary">
              {disorderStatBonuses.map((bonus, idx) => (
                <div
                  key={`disorder-stat-${idx}`}
                  className="damage_panel-item_summary-subitem_container"
                >
                  <div className="damage_panel-item_summary-subitem_header">
                    <span className="damage_panel-item_summary-subitem_title">
                      {bonus.label}
                    </span>
                    <span className="damage_panel-item_summary-subitem_tag">
                      +{formatPercentage(bonus.bonusValue)}
                    </span>
                  </div>
                  <div className="damage_panel-item_summary-subitem_subcontainer">
                    <div className="damage_panel-item_summary-container">
                      <div className="damage_panel-item_summary-text">
                        <div className="damage_panel-subitem_summary-grid_area_1">
                          <span>{getSourceIcon(bonus)}</span>
                        </div>
                        <span className="damage_panel-subitem_summary-grid_area_2">
                          based on {bonus.basedOn}:{" "}
                          {Math.round(bonus.currentValue).toLocaleString()}
                          {bonus.bonusValue >= (bonus.maxBonus ?? Infinity) &&
                            " (MAX)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⭐ VORTEX DMG SOURCES */}
      {vortexDmgSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("vortexDmg")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.vortexDmg ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              {" "}
              Vortex DMG Bonuses{" "}
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(vortexDmgBonus)}
            </span>
          </div>
          {expandedSections.vortexDmg && (
            <div className="damage_panel-item_summary">
              {vortexDmgSources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          {" "}
                          x{source.stacks}{" "}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{formatPercentage(source.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⭐ VORTEX MULTIPLIER SOURCES */}
      {vortexMultiplierSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("vortexMultiplier")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.vortexMultiplier ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Vortex Multiplier Bonuses
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(vortexMultiplierBonus)}
            </span>
          </div>
          {expandedSections.vortexMultiplier && (
            <div className="damage_panel-item_summary">
              {vortexMultiplierSources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          x{source.stacks}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{formatPercentage(source.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⭐ REFRINGE SOURCES */}
      {refringeSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("refringe")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.refringe ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Refringe Bonuses
            </span>
            <span className="damage_panel-item_header-tag">
              +{(totalRefringe * 100).toFixed(2)}%
            </span>
          </div>
          {expandedSections.refringe && (
            <div className="damage_panel-item_summary">
              {refringeSources.map((source, idx) => (
                <div
                  key={`${source.id}-${idx}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.label}</span>
                      {source.stacks > 1 && (
                        <span className="damage_panel-item_summary-stacks">
                          {" "}
                          x{source.stacks}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="damage_panel-item_summary-tag">
                    +{(source.value * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay bonos activos*/}
      {!hasAnomalyBonuses && !hasDisorderBonuses && (
        <div className="damage_panel-no_active_bonuses">
          <p className="damage_panel-no_effects_found">
            No active anomaly or disorder bonuses
          </p>
          <p className="damage_panel-enable_some_effects">
            Enable some in-game effects in the effects section above to see them
            here.
          </p>
        </div>
      )}
    </div>
  );
}
