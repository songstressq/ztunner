import { useState } from "react";
import type {
  CollectedDefenseBonuses,
  DefenseBonusSource,
} from "@/utils/defensesBonusCollector";

interface Props {
  defensesBonuses: CollectedDefenseBonuses;
  className?: string;
}

export default function DefensesBonusesPanel({
  defensesBonuses,
  className = "",
}: Props) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    defShred: true,
    allResShred: true,
    resShred: true,
    skillTypeDefShred: true,
    aftershockDefShred: true,
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

  const defShredSources = defensesBonuses.sources.filter(
    (s) => s.type === "defShred",
  );
  const aftershockSources = defensesBonuses.sources.filter(
    (s) => s.type === "aftershockDefShred",
  );
  const allResSources = defensesBonuses.allResShred.sources;
  const resShredEntries = Object.entries(defensesBonuses.resShreds);
  const skillTypeDefShredEntries = Object.entries(
    defensesBonuses.skillTypeDefShred,
  );

  const hasActiveBonuses = () => {
    return (
      defensesBonuses.totalDefShred > 0 ||
      defensesBonuses.totalAftershockDefShred > 0 ||
      allResSources.length > 0 ||
      resShredEntries.length > 0 ||
      skillTypeDefShredEntries.length > 0
    );
  };

  const getSourceIcon = (source: DefenseBonusSource) => {
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

  const getElementIcon = (element: string) => {
    const elementMap: Record<string, string> = {
      fire: "/resources/images/icons/attributes/Fire.png",
      ice: "/resources/images/icons/attributes/Ice.png",
      electric: "/resources/images/icons/attributes/Electric.png",
      physical: "/resources/images/icons/attributes/Physical.png",
      ether: "/resources/images/icons/attributes/Ether.png",
      wind: "/resources/images/icons/attributes/Wind.png",
    };
    const iconPath = elementMap[element?.toLowerCase()];
    if (!iconPath) return null;
    return (
      <img
        src={iconPath}
        alt={element}
        className="damage_panel-item_summary-element"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  };

  return (
    <div className={`damage_bonuses_panel-main_wrapper ${className}`}>
      {/* HEADER: Total DEF Shred - SIEMPRE visible */}
      <div className="damage_panel-header_container">
        <span className="damage_panel-header_text">Total DEF Shred:</span>
        <span className="damage_panel-header_tag">
          {formatPercentage(defensesBonuses.totalDefShred)}
        </span>
      </div>

      {/* HEADER: All-Attribute RES Ignore - solo si > 0 */}
      {defensesBonuses.allResShred.total > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            All-Attribute RES Ignore:
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(defensesBonuses.allResShred.total)}
          </span>
        </div>
      )}

      {/* HEADER: Aftershock DEF Ignore - solo si > 0 */}
      {defensesBonuses.totalAftershockDefShred > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            Total Aftershock DEF Ignore:
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(defensesBonuses.totalAftershockDefShred)}
          </span>
        </div>
      )}

      {/* SECCIÓN: DEF Shred Global (solo si hay fuentes) */}
      {defShredSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("defShred")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.defShred ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              DEF Shred Bonuses
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(defensesBonuses.totalDefShred)}
            </span>
          </div>
          {expandedSections.defShred && (
            <div className="damage_panel-item_summary">
              {defShredSources.map((source, index) => (
                <div
                  key={`${source.id}-${index}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.name}</span>
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

      {/* SECCIÓN: All-Attribute RES Ignore */}
      {allResSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("allResShred")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.allResShred ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              All-Attribute RES Ignore
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(defensesBonuses.allResShred.total)}
            </span>
          </div>
          {expandedSections.allResShred && (
            <div className="damage_panel-item_summary">
              {allResSources.map((source, index) => (
                <div
                  key={`${source.id}-${index}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.name}</span>
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

      {/* SECCIÓN: Elemental RES Ignore (individual) */}
      {resShredEntries.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("resShred")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.resShred ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Elemental RES Ignore
            </span>
          </div>
          {expandedSections.resShred && (
            <div className="damage_panel-item_summary">
              {resShredEntries.map(([element, { total, sources }]) => (
                <div
                  key={element}
                  className="damage_panel-item_summary-subitem_container"
                >
                  <div className="damage_panel-item_summary-subitem_header">
                    <span>{getElementIcon(element)}</span>
                    <span className="damage_panel-item_summary-subitem_title">
                      {capitalize(element)} RES Ignore
                    </span>
                    <span className="damage_panel-item_summary-subitem_tag">
                      +{formatPercentage(total)}
                    </span>
                  </div>
                  <div className="damage_panel-item_summary-subitem_subcontainer">
                    {sources.map((source, idx) => (
                      <div
                        key={`${source.id}-${idx}`}
                        className="damage_panel-item_summary-container"
                      >
                        <div className="damage_panel-item_summary-text">
                          <div className="damage_panel-subitem_summary-grid_area_1">
                            <span>{getSourceIcon(source)}</span>
                          </div>
                          <div className="damage_panel-subitem_summary-grid_area_2">
                            <span>{source.name}</span>
                            {source.stacks > 1 && (
                              <span className="damage_panel-item_summary-stacks">
                                x{source.stacks}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN: Skill Type DEF Shred */}
      {skillTypeDefShredEntries.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("skillTypeDefShred")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.skillTypeDefShred ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill Type DEF Shred
            </span>
          </div>
          {expandedSections.skillTypeDefShred && (
            <div className="damage_panel-item_summary">
              {skillTypeDefShredEntries.map(
                ([skillType, { total, sources }]) => (
                  <div
                    key={skillType}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {capitalize(skillType)} Skills
                      </span>
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatPercentage(total)}
                      </span>
                    </div>
                    <div className="damage_panel-item_summary-subitem_subcontainer">
                      {sources.map((source, idx) => (
                        <div
                          key={`${source.id}-${idx}`}
                          className="damage_panel-item_summary-container"
                        >
                          <div className="damage_panel-item_summary-text">
                            <div className="damage_panel-subitem_summary-grid_area_1">
                              <span>{getSourceIcon(source)}</span>
                            </div>
                            <div className="damage_panel-subitem_summary-grid_area_2">
                              <span>{source.name}</span>
                              {source.stacks > 1 && (
                                <span className="damage_panel-item_summary-stacks">
                                  x{source.stacks}
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
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN: Aftershock DEF Ignore */}
      {aftershockSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("aftershockDefShred")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.aftershockDefShred ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Aftershock DEF Ignore
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(defensesBonuses.totalAftershockDefShred)}
            </span>
          </div>
          {expandedSections.aftershockDefShred && (
            <div className="damage_panel-item_summary">
              {aftershockSources.map((source, index) => (
                <div
                  key={`${source.id}-${index}`}
                  className="damage_panel-item_summary-container"
                >
                  <div className="damage_panel-item_summary-text">
                    <div className="damage_panel-item_summary-grid_area_1">
                      <span>{getSourceIcon(source)}</span>
                    </div>
                    <div className="damage_panel-item_summary-grid_area_2">
                      <span>{source.name}</span>
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

      {/* Mensaje "No active bonuses" - solo si no hay ningún bono activo */}
      {!hasActiveBonuses() && (
        <div className="damage_panel-no_active_bonuses">
          <p className="damage_panel-no_effects_found">
            No active DEF Shred or RES Ignore bonuses
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
