import { useState, useEffect } from "react";
import type { CollectedBonuses } from "@/utils/damageBonusCollector";

interface Props {
  bonuses: CollectedBonuses;
  selectedSkillId: string;
  selectedSkillType?: string;
  selectedSkillElement?: string;
  agentAttribute: string;
  agentSpecialty: string;
  className?: string;
}

export default function ActiveBonusesPanel({
  bonuses,
  selectedSkillId,
  selectedSkillType,
  selectedSkillElement,
  agentAttribute,
  agentSpecialty,
  className = "",
}: Props) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    global: true,
    elements: true,
    skillTypes: true,
    skillTypeElemental: true,
    skillTypeStats: true,
    elementSheerDmg: true,
    sheerDmg: true,
    skillTypeElementalSheer: true,
    critDamageElemental: true,
    exclusive: true,
    stats: true,
    hitExclusive: true,
    hitStatExclusive: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const globalSources = bonuses.sources.filter((s) => s.type === "global");

  const elementSources = bonuses.sources.filter(
    (s) => s.type === "element" && s.element,
  );

  const skillTypeSources = bonuses.sources.filter(
    (s) => s.type === "skillType" && s.skillType,
  );

  const exclusiveSources = bonuses.sources.filter(
    (s) => s.type === "exclusive" && s.skillId === selectedSkillId,
  );

  const statSources = bonuses.sources.filter(
    (s) => s.type === "stat" && s.skillId === selectedSkillId,
  );

  const hitExclusiveBonuses = bonuses.sources.filter(
    (s) => s.type === "hitExclusive" && s.skillId === selectedSkillId,
  );

  const statBonusesByType = statSources.reduce(
    (acc, source) => {
      const statType = source.stat || "unknown";
      if (!acc[statType]) {
        acc[statType] = {
          total: 0,
          sources: [],
        };
      }
      acc[statType].total += source.value;
      acc[statType].sources.push(source);
      return acc;
    },
    {} as Record<string, { total: number; sources: typeof statSources }>,
  );
  const elements = Array.from(new Set(elementSources.map((s) => s.element)));

  const skillTypes = Array.from(
    new Set(skillTypeSources.map((s) => s.skillType)),
  );

  const hitBonusesByHit = hitExclusiveBonuses.reduce(
    (acc, source) => {
      const hitName = source.hitName || "unknown";
      if (!acc[hitName]) {
        acc[hitName] = {
          total: 0,
          sources: [],
        };
      }
      acc[hitName].total += source.value;
      acc[hitName].sources.push(source);
      return acc;
    },
    {} as Record<
      string,
      { total: number; sources: typeof hitExclusiveBonuses }
    >,
  );

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatStatValue = (stat: string, value: number) => {
    if (
      stat.includes("crit") ||
      stat.includes("Rate") ||
      stat.includes("Dmg") ||
      stat.includes("ResShred") ||
      stat.includes("PenRatio") ||
      stat === "dmgBonus" ||
      stat === "penRatio"
    ) {
      return `${(value * 100).toFixed(1)}%`;
    }

    return value.toFixed(1);
  };

  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const getSkillTypeDisplayName = (skillType: string) => {
    const skillTypeNames: Record<string, string> = {
      basic: "Basic Attacks",
      dash: "Dash Attacks",
      counter: "Dodge Counters",
      quickAssist: "Quick Assists",
      followup: "Assist Follow-Ups",
      special: "Special Attacks",
      ex: "EX Special Attacks",
      chain: "Chain Attacks",
      ultimate: "Ultimates",
      mindscape: "Other Abilities",
      core: "Other Abilities",
    };

    return skillTypeNames[skillType] || capitalize(skillType);
  };

  const getStatDisplayName = (stat: string) => {
    const statNames: Record<string, string> = {
      critDmg: "CRIT DMG",
      critRate: "CRIT Rate",
      atkPercent: "ATK%",
      impact: "Impact",
      anomalyMastery: "Anomaly Mastery",
      fireResShred: "Fire RES Ignore",
      iceResShred: "Ice RES Ignore",
      electricResShred: "Electric RES Ignore",
      physicalResShred: "Physical RES Ignore",
      etherResShred: "Ether RES Ignore",
      penRatio: "PEN Ratio",
    };
    return statNames[stat] || stat;
  };

  const getSourceIcon = (source: BonusSource) => {
    if (source.source === "gameMode") {
      return (
        <img
          src="/ztunner/resources/images/agents/icons/game_mode.png"
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
          src={`/ztunner/resources/images/agents/icons/${source.ownerAgentId}.png`}
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
    if (element?.toLowerCase() === "aftershock") {
      return null;
    }

    const elementMap: Record<string, string> = {
      fire: "/ztunner/resources/images/icons/attributes/Fire.png",
      ice: "/ztunner/resources/images/icons/attributes/Ice.png",
      electric: "/ztunner/resources/images/icons/attributes/Electric.png",
      physical: "/ztunner/resources/images/icons/attributes/Physical.png",
      ether: "/ztunner/resources/images/icons/attributes/Ether.png",
      wind: "/ztunner/resources/images/icons/attributes/Wind.png",
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

  const hasRelevantSkillTypeElemental =
    selectedSkillType &&
    bonuses.skillTypeElemental?.[selectedSkillType] &&
    Object.values(bonuses.skillTypeElemental[selectedSkillType]).some(
      (v) => v > 0,
    );

  const hasRelevantSkillTypeStats =
    selectedSkillType &&
    bonuses.skillTypeStats?.[selectedSkillType] &&
    Object.values(bonuses.skillTypeStats[selectedSkillType]).some((v) => v > 0);

  const currentSkillTypeElementalTotal =
    selectedSkillType && selectedSkillElement
      ? bonuses.skillTypeElemental?.[selectedSkillType]?.[
          selectedSkillElement
        ] || 0
      : 0;

  const isRuptureAgent = agentSpecialty === "Rupture";

  const hitStatBonusesForCurrentSkill =
    selectedSkillId && bonuses.hitStatExclusive?.[selectedSkillId]
      ? Object.entries(bonuses.hitStatExclusive[selectedSkillId])
      : [];

  const hasActiveBonuses = () => {
    if (globalSources.length > 0) return true;

    if (elements.some((el) => (bonuses.elements[el!] || 0) > 0)) return true;

    if (
      skillTypes.some(
        (st) => st === selectedSkillType && (bonuses.skillTypes[st!] || 0) > 0,
      )
    )
      return true;

    if (
      (bonuses.exclusive[selectedSkillId] || 0) > 0 ||
      exclusiveSources.length > 0
    )
      return true;

    if (Object.keys(statBonusesByType).length > 0) return true;

    if (hasRelevantSkillTypeElemental && currentSkillTypeElementalTotal > 0)
      return true;

    if (hasRelevantSkillTypeStats) return true;

    if (isRuptureAgent && bonuses.sheerDmgBonus > 0) return true;

    if (
      isRuptureAgent &&
      Object.values(bonuses.elementSheerDmgBonus || {}).some((v) => v > 0)
    )
      return true;

    if (
      bonuses.skillTypeElementalSheer &&
      Object.entries(bonuses.skillTypeElementalSheer).filter(
        ([skillType]) => skillType === selectedSkillType,
      ).length > 0
    )
      return true;

    if (
      bonuses.critDamageElementalBonus &&
      Object.values(bonuses.critDamageElementalBonus).some((v) => v > 0)
    )
      return true;

    if (Object.keys(hitBonusesByHit).length > 0) return true;

    if (hitStatBonusesForCurrentSkill.length > 0) return true;

    return false;
  };

  return (
    <div className={`damage_bonuses_panel-main_wrapper ${className}`}>
      {/* Resumen rápido */}
      <div className="damage_panel-header_container">
        <span className="damage_panel-header_text">Total DMG Bonus:</span>
        <span className="damage_panel-header_tag">
          {formatPercentage(
            bonuses.global +
              Object.values(bonuses.elements).reduce((a, b) => a + b, 0) +
              (bonuses.skillTypes[selectedSkillType || ""] || 0) +
              (bonuses.exclusive[selectedSkillId] || 0) +
              (() => {
                if (!selectedSkillType) return 0;
                let total = 0;
                if (bonuses.skillTypeElemental?.[selectedSkillType]) {
                  Object.values(
                    bonuses.skillTypeElemental[selectedSkillType],
                  ).forEach((value) => {
                    total += value;
                  });
                }
                return total;
              })(),
          )}
        </span>
      </div>

      {/* ⭐ TOTAL SHEER DMG BONUS - Solo para Rupture */}
      {isRuptureAgent && bonuses.sheerDmgBonus > 0 && (
        <div className="damage_panel-header_container">
          <span className="damage_panel-header_text">
            Total Sheer DMG Bonus:
          </span>
          <span className="damage_panel-header_tag">
            {formatPercentage(bonuses.sheerDmgBonus)}
          </span>
        </div>
      )}

      {/* ⭐ TOTAL ELEMENT SHEER DMG BONUS - Solo para Rupture */}
      {isRuptureAgent &&
        Object.values(bonuses.elementSheerDmgBonus).some((v) => v > 0) && (
          <div className="damage_panel-header_container">
            <span className="damage_panel-header_text">
              Total Element Sheer DMG Bonus:
            </span>
            <span className="damage_panel-header_tag">
              {formatPercentage(
                Object.values(bonuses.elementSheerDmgBonus).reduce(
                  (a, b) => a + b,
                  0,
                ),
              )}
            </span>
          </div>
        )}

      {/* GLOBAL BONUSES */}
      {globalSources.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("global")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.global ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Global DMG Bonuses
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(bonuses.global)}
            </span>
          </div>
          {expandedSections.global && (
            <div className="damage_panel-item_summary">
              {globalSources.map((source, index) => (
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

      {/* ELEMENT BONUSES - Solo globales con valor > 0 */}
      {elements.filter((element) => (bonuses.elements[element!] || 0) > 0)
        .length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("elements")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.elements ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Elemental DMG Bonuses
            </span>
          </div>
          {expandedSections.elements && (
            <div className="damage_panel-item_summary">
              {elements
                .filter((element) => (bonuses.elements[element!] || 0) > 0)
                .map((element) => {
                  const elementTotal = bonuses.elements[element!] || 0;
                  const elementSourcesList = elementSources.filter(
                    (s) => s.element === element,
                  );
                  return (
                    <div
                      key={element}
                      className="damage_panel-item_summary-subitem_container"
                    >
                      <div className="damage_panel-item_summary-subitem_header">
                        <span>{getElementIcon(element)}</span>
                        <span className="damage_panel-item_summary-subitem_title">
                          {capitalize(element || "")} DMG
                        </span>
                        <span className="damage_panel-item_summary-subitem_tag">
                          +{formatPercentage(elementTotal)}
                        </span>
                      </div>
                      <div className="damage_panel-item_summary-subitem_subcontainer">
                        {elementSourcesList.map((source, idx) => (
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
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ⭐ GENERAL SHEER DMG BONUS */}
      {isRuptureAgent && bonuses.sheerDmgBonus > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("sheerDmg")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.sheerDmg ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Global Sheer DMG Bonuses
            </span>
            <span className="damage_panel-item_header-tag">
              +{formatPercentage(bonuses.sheerDmgBonus)}
            </span>
          </div>
          {expandedSections.sheerDmg && (
            <div className="damage_panel-item_summary">
              {bonuses.sources
                .filter((s) => s.type === "sheerDmg")
                .map((source, idx) => (
                  <div
                    key={`${source.id}-${idx}`}
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

      {/* ⭐ ELEMENT SHEER DMG BONUSES - Mismo formato que elementales */}
      {isRuptureAgent &&
        Object.entries(bonuses.elementSheerDmgBonus || {}).filter(
          ([_, value]) => value > 0,
        ).length > 0 && (
          <div className="damage_panel-item_container">
            <div
              className="damage_panel-item_header"
              onClick={() => toggleSection("elementSheerDmg")}
            >
              <span className="damage_panel-item_header-arrow">
                {expandedSections.elementSheerDmg ? "▼" : "▶"}
              </span>
              <span className="damage_panel-item_header-title">
                Elemental Sheer DMG Bonuses
              </span>
            </div>
            {expandedSections.elementSheerDmg && (
              <div className="damage_panel-item_summary">
                {Object.entries(bonuses.elementSheerDmgBonus)
                  .filter(([_, value]) => value > 0)
                  .map(([element, elementTotal]) => {
                    const elementSourcesList = bonuses.sources.filter(
                      (s) =>
                        s.type === "elementSheerDmg" && s.element === element,
                    );
                    return (
                      <div
                        key={element}
                        className="damage_panel-item_summary-subitem_container"
                      >
                        {/* Header del elemento */}
                        <div className="damage_panel-item_summary-subitem_header">
                          <span>{getElementIcon(element)}</span>
                          <span className="damage_panel-item_summary-subitem_title">
                            {capitalize(element || "")} Sheer DMG
                          </span>
                          <span className="damage_panel-item_summary-subitem_tag">
                            +{formatPercentage(elementTotal)}
                          </span>
                        </div>
                        {/* Subtarjetas con las fuentes */}
                        {elementSourcesList.length > 0 && (
                          <div className="damage_panel-item_summary-subitem_subcontainer">
                            {elementSourcesList.map((source, idx) => (
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
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      {/* SKILL TYPE BONUSES */}
      {skillTypes.filter((skillType) => skillType === selectedSkillType)
        .length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("skillTypes")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.skillTypes ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill Type DMG Bonuses
            </span>
          </div>
          {expandedSections.skillTypes && (
            <div className="damage_panel-item_summary">
              {skillTypes
                .filter((skillType) => skillType === selectedSkillType)
                .map((skillType) => {
                  const typeTotal = bonuses.skillTypes[skillType!] || 0;
                  const typeSources = skillTypeSources.filter(
                    (s) => s.skillType === skillType,
                  );
                  return (
                    <div
                      key={skillType}
                      className="damage_panel-item_summary-subitem_container"
                    >
                      <div className="damage_panel-item_summary-subitem_header">
                        <span className="damage_panel-item_summary-subitem_title">
                          {getSkillTypeDisplayName(skillType || "")}
                        </span>
                        <span className="damage_panel-item_summary-subitem_tag">
                          +{formatPercentage(typeTotal)}
                        </span>
                      </div>
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
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ⭐ SKILL TYPE + ELEMENT BONUSES - Solo si hay bonuses para el skill type actual */}
      {hasRelevantSkillTypeElemental && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("skillTypeElemental")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.skillTypeElemental ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill Type & Elemental DMG Bonuses
            </span>
            {/* Mostrar el total que aplica a la skill actual si tenemos el elemento 
            {selectedSkillElement && currentSkillTypeElementalTotal > 0 && (
              <span className="damage_panel-item_header-tag">
                +{formatPercentage(currentSkillTypeElementalTotal)}
              </span>
            )}*/}
          </div>
          {expandedSections.skillTypeElemental && (
            <div className="damage_panel-item_summary">
              {Object.entries(bonuses.skillTypeElemental || {})
                .filter(([skillType]) => skillType === selectedSkillType)
                .map(([skillType, elements]) =>
                  Object.entries(elements).map(
                    ([element, value]) =>
                      value > 0 && (
                        <div
                          key={`${skillType}-${element}`}
                          className="damage_panel-item_summary-subitem_container"
                        >
                          <div className="damage_panel-item_summary-subitem_header">
                            <span>{getElementIcon(element)}</span>
                            <span className="damage_panel-item_summary-subitem_title">
                              {capitalize(element)} DMG (
                              {getSkillTypeDisplayName(skillType || "")})
                              {/* Indicador si aplica a la skill actual */}
                              {element === selectedSkillElement && (
                                <span className="damage_panel-item_summary-current_skill">
                                  Current skill
                                </span>
                              )}
                            </span>
                            <span className="damage_panel-item_summary-subitem_tag">
                              +{formatPercentage(value)}
                            </span>
                          </div>
                          {/* Aquí podrías mostrar las fuentes si quieres */}
                          <div className="damage_panel-item_summary-subitem_subcontainer">
                            {bonuses.sources
                              .filter(
                                (s) =>
                                  s.type === "skillTypeElemental" &&
                                  s.skillType === skillType &&
                                  s.element === element,
                              )
                              .map((source, idx) => (
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
                  ),
                )}
            </div>
          )}
        </div>
      )}

      {/* ⭐ SKILL TYPE STAT BONUSES */}
      {hasRelevantSkillTypeStats && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("skillTypeStats")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.skillTypeStats ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill Type Stat Bonuses
            </span>
          </div>
          {expandedSections.skillTypeStats && (
            <div className="damage_panel-item_summary">
              {Object.entries(bonuses.skillTypeStats || {})
                .filter(([skillType]) => skillType === selectedSkillType)
                .map(([skillType, stats]) =>
                  Object.entries(stats).map(([stat, value]) => {
                    let displayValue = value;
                    let displayUnit = "";
                    if (stat === "defShred") {
                      displayValue = value * 100;
                      displayUnit = "%";
                    } else if (
                      stat.includes("crit") ||
                      stat.includes("Rate") ||
                      stat.includes("Dmg")
                    ) {
                      displayValue = value * 100;
                      displayUnit = "%";
                    } else if (
                      stat === "atkPercent" ||
                      stat === "hpPercent" ||
                      stat === "defPercent"
                    ) {
                      displayValue = value * 100;
                      displayUnit = "%";
                    }
                    return (
                      <div
                        key={`${skillType}-${stat}`}
                        className="damage_panel-item_summary-subitem_container"
                      >
                        <div className="damage_panel-item_summary-subitem_header">
                          <span className="damage_panel-item_summary-subitem_title">
                            {stat === "defShred"
                              ? "DEF Ignore"
                              : getStatDisplayName(stat)}
                            ({getSkillTypeDisplayName(skillType || "")})
                            {stat === "defShred" && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  color: "#FF6B35",
                                  fontSize: 11,
                                }}
                              >
                                ⚔️
                              </span>
                            )}
                          </span>
                          <span className="damage_panel-item_summary-subitem_tag">
                            +{displayValue.toFixed(1)} {displayUnit}
                          </span>
                        </div>
                        {/* Mostrar fuentes */}
                        <div className="damage_panel-item_summary-subitem_subcontainer">
                          {bonuses.sources
                            .filter(
                              (s) =>
                                s.type === "skillTypeStat" &&
                                s.skillType === skillType &&
                                s.stat === stat,
                            )
                            .map((source, idx) => (
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
                                  +{(source.value * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  }),
                )}
            </div>
          )}
        </div>
      )}

      {/* ⭐ SKILL TYPE + ELEMENT SHEER BONUSES */}
      {bonuses.skillTypeElementalSheer &&
        Object.entries(bonuses.skillTypeElementalSheer).filter(
          ([skillType]) => skillType === selectedSkillType,
        ).length > 0 && (
          <div className="damage_panel-item_container">
            <div
              className="damage_panel-item_header"
              onClick={() => toggleSection("skillTypeElementalSheer")}
            >
              <span className="damage_panel-item_header-arrow">
                {expandedSections.skillTypeElementalSheer ? "▼" : "▶"}
              </span>
              <span className="damage_panel-item_header-title">
                Skill Type & Elemental Sheer DMG Bonuses
              </span>
            </div>
            {expandedSections.skillTypeElementalSheer && (
              <div className="damage_panel-item_summary">
                {Object.entries(bonuses.skillTypeElementalSheer)
                  .filter(([skillType]) => skillType === selectedSkillType)
                  .map(([skillType, elements]) =>
                    Object.entries(elements).map(
                      ([element, value]) =>
                        value > 0 && (
                          <div
                            key={`${skillType}-${element}`}
                            className="damage_panel-item_summary-subitem_container"
                          >
                            <div className="damage_panel-item_summary-subitem_header">
                              <span>{getElementIcon(element)}</span>
                              <span className="damage_panel-item_summary-subitem_title">
                                {capitalize(element)} Sheer DMG (
                                {getSkillTypeDisplayName(skillType || "")})
                                {element === selectedSkillElement && (
                                  <span className="damage_panel-item_summary-current_skill">
                                    Current skill
                                  </span>
                                )}
                              </span>
                              <span className="damage_panel-item_summary-subitem_tag">
                                +{formatPercentage(value)}
                              </span>
                            </div>
                            <div className="damage_panel-item_summary-subitem_subcontainer">
                              {bonuses.sources
                                .filter(
                                  (s) =>
                                    s.type === "skillTypeElementalSheer" &&
                                    s.skillType === skillType &&
                                    s.element === element,
                                )
                                .map((source, idx) => (
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
                    ),
                  )}
              </div>
            )}
          </div>
        )}

      {/* ⭐ CRIT DAMAGE ELEMENTAL BONUSES */}
      {bonuses.critDamageElementalBonus &&
        Object.entries(bonuses.critDamageElementalBonus).filter(
          ([_, value]) => value > 0,
        ).length > 0 && (
          <div className="damage_panel-item_container">
            <div
              className="damage_panel-item_header"
              onClick={() => toggleSection("critDamageElemental")}
            >
              <span className="damage_panel-item_header-arrow">
                {expandedSections.critDamageElemental ? "▼" : "▶"}
              </span>
              <span className="damage_panel-item_header-title">
                Elemental CRIT DMG Bonuses
              </span>
            </div>
            {expandedSections.critDamageElemental && (
              <div className="damage_panel-item_summary">
                {Object.entries(bonuses.critDamageElementalBonus)
                  .filter(([_, value]) => value > 0)
                  .map(([element, totalValue]) => {
                    const sourcesForElement = bonuses.sources.filter(
                      (s) =>
                        s.type === "critDamageElementalBonus" &&
                        s.element === element,
                    );
                    return (
                      <div
                        key={element}
                        className="damage_panel-item_summary-subitem_container"
                      >
                        <div className="damage_panel-item_summary-subitem_header">
                          <span>{getElementIcon(element)}</span>
                          <span className="damage_panel-item_summary-subitem_title">
                            {capitalize(element)} CRIT DMG
                          </span>
                          <span className="damage_panel-item_summary-subitem_tag">
                            +{(totalValue * 100).toFixed(1)}%
                          </span>
                        </div>
                        {/* Subtarjetas con las fuentes */}
                        {sourcesForElement.length > 0 && (
                          <div className="damage_panel-item_summary-subitem_subcontainer">
                            {sourcesForElement.map((source, idx) => (
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
                                  +{(source.value * 100).toFixed(1)}%
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

      {/* EXCLUSIVE DMG BONUSES FOR SELECTED SKILL */}
      {(exclusiveSources.length > 0 ||
        (bonuses.exclusive[selectedSkillId] || 0) > 0) && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("exclusive")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.exclusive ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill-Exclusive DMG Bonuses
            </span>
            {bonuses.exclusive[selectedSkillId] > 0 && (
              <span className="damage_panel-item_header-tag">
                +{formatPercentage(bonuses.exclusive[selectedSkillId])}
              </span>
            )}
          </div>
          {expandedSections.exclusive && exclusiveSources.length > 0 && (
            <div className="damage_panel-item_summary">
              {exclusiveSources.map((source, index) => (
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

      {/* ⭐ NUEVA SECCIÓN: STAT BONUSES (CRIT DMG, etc) */}
      {Object.keys(statBonusesByType).length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("stats")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.stats ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Skill-Exclusive Stat Bonuses
            </span>
          </div>
          {expandedSections.stats && (
            <div className="damage_panel-item_summary">
              {Object.entries(statBonusesByType).map(
                ([statType, { total, sources }]) => (
                  <div
                    key={statType}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {getStatDisplayName(statType)}
                      </span>
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatStatValue(statType, total)}
                        {sources.some((s) => s.stacks > 1) && (
                          <span className="damage_panel-item_summary-stacks">
                            total
                          </span>
                        )}
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
                            +{formatStatValue(statType, source.value)}
                            {source.stacks > 1 && `(each)`}
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

      {/* ⭐ NUEVA SECCIÓN: Hit Exclusive Bonuses */}
      {Object.keys(hitBonusesByHit).length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("hitExclusive")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.hitExclusive ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Hit-Specific DMG Bonuses
            </span>
            {/*
            <span className="damage_panel-item_header-tag">
              
              +
              {formatPercentage(
                Object.values(hitBonusesByHit).reduce(
                  (sum, h) => sum + h.total,
                  0,
                ),
              )}
            </span>*/}
          </div>
          {expandedSections.hitExclusive && (
            <div className="damage_panel-item_summary">
              {Object.entries(hitBonusesByHit).map(
                ([hitName, { total, sources }]) => (
                  <div
                    key={hitName}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    {/* Header del hit */}
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {hitName}
                        {sources.some((s) => s.element) && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              color: "#7EFFDB",
                            }}
                          >
                            {sources.find((s) => s.element)?.element ===
                              "ether" && "🌀"}
                            {sources.find((s) => s.element)?.element ===
                              "fire" && "🔥"}
                            {sources.find((s) => s.element)?.element ===
                              "ice" && "❄️"}
                            {sources.find((s) => s.element)?.element ===
                              "electric" && "⚡"}
                            {sources.find((s) => s.element)?.element ===
                              "physical" && "👊"}
                          </span>
                        )}
                      </span>
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatPercentage(total)}
                      </span>
                    </div>
                    {/* Subtarjetas con las fuentes */}
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
                              {source.stacks && source.stacks > 1 && (
                                <span className="damage_panel-subitem_summary-tag">
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

      {/* ⭐ NUEVA SECCIÓN: Hit-Exclusive Stat Bonuses */}
      {hitStatBonusesForCurrentSkill.length > 0 && (
        <div className="damage_panel-item_container">
          <div
            className="damage_panel-item_header"
            onClick={() => toggleSection("hitStatExclusive")}
          >
            <span className="damage_panel-item_header-arrow">
              {expandedSections.hitStatExclusive ? "▼" : "▶"}
            </span>
            <span className="damage_panel-item_header-title">
              Hit-Specific Stat Bonuses
            </span>
          </div>
          {expandedSections.hitStatExclusive && (
            <div className="damage_panel-item_summary">
              {hitStatBonusesForCurrentSkill.map(([hitName, stats]) => {
                const statsTotals = Object.entries(stats).reduce(
                  (acc, [stat, value]) => {
                    acc[stat] = (acc[stat] || 0) + value;
                    return acc;
                  },
                  {} as Record<string, number>,
                );

                const totalGeneral = Object.values(statsTotals).reduce(
                  (sum, val) => sum + val,
                  0,
                );

                return (
                  <div
                    key={hitName}
                    className="damage_panel-item_summary-subitem_container"
                  >
                    <div className="damage_panel-item_summary-subitem_header">
                      <span className="damage_panel-item_summary-subitem_title">
                        {hitName}
                      </span>
                      {/* Tag solo con el porcentaje total */}
                      <span className="damage_panel-item_summary-subitem_tag">
                        +{formatPercentage(totalGeneral)}
                      </span>
                    </div>
                    <div className="damage_panel-item_summary-subitem_subcontainer">
                      {Object.entries(stats).map(([stat, value]) => {
                        const sources = bonuses.sources.filter(
                          (s) =>
                            s.type === "hitStatExclusive" &&
                            s.skillId === selectedSkillId &&
                            s.hitName === hitName &&
                            s.stat === stat,
                        );
                        return (
                          <div
                            key={`${hitName}-${stat}`}
                            className="damage_panel-item_summary-container"
                          >
                            <div className="damage_panel-item_summary-text">
                              <div className="damage_panel-subitem_summary-grid_area_1">
                                <span>
                                  {sources[0] && getSourceIcon(sources[0])}
                                </span>
                              </div>
                              <div className="damage_panel-subitem_summary-grid_area_2">
                                {sources.length > 0 && (
                                  <div className="ABP-sources">
                                    {sources.map((s, idx) => (
                                      <span key={idx} style={{ marginLeft: 4 }}>
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="damage_panel-subitem_summary-tag">
                              +
                              {stat.includes("crit") ||
                              stat.includes("Dmg") ||
                              stat === "defShred"
                                ? `${(value * 100).toFixed(1)}%`
                                : value.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!hasActiveBonuses() && (
        <div className="damage_panel-no_active_bonuses">
          <p className="damage_panel-no_effects_found">
            No active damage bonuses
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
