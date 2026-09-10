import React, { useState, useEffect, useMemo } from "react";
import gameModesData from "@/data/gameModes.json";
import { InfoTooltip } from "./InfoTooltip";
import { useSession } from "@/context/SessionContext";

import { formatStatName, formatStatValue } from "@/utils/statFormatters";

interface GameModeTogglePanelProps {
  activeEffectId: string | null;
  onSelectEffect: (effectId: string | null) => void;
  onTeamEffectToggle: (
    effectId: string,
    enabled: boolean,
    stacks: number,
    sourceSlot: number,
    ownerAgentId: string,
  ) => void;
  slotIndex: number;
  theme?: string;
}

type SectionDef = { id: string; label: string; effects: any[] };
type ModeDef = {
  id: string;
  label: string;
  rooms: SectionDef[];
  buffs?: SectionDef[];
};

const GameModeTogglePanel: React.FC<GameModeTogglePanelProps> = ({
  activeEffectId,
  onSelectEffect,
  onTeamEffectToggle,
  slotIndex,
  theme: propTheme = "#7EFFDB",
}) => {
  const { homeSession, setHomeSession } = useSession();
  const teamEffects = homeSession.teamEffects;
  const modes = (gameModesData as any).modes as ModeDef[];

  const initialModeId = homeSession.gameModeCurrentModeId || modes[0]?.id || "";
  const initialRoomId =
    homeSession.gameModeCurrentRoomId || modes[0]?.rooms[0]?.id || "";
  const initialBuffId = homeSession.gameModeCurrentBuffId || "";

  const [currentModeId, setCurrentModeId] = useState(initialModeId);
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [currentBuffId, setCurrentBuffId] = useState(initialBuffId);
  const [localStacks, setLocalStacks] = useState<Record<string, number>>({});

  const currentMode = modes.find((m) => m.id === currentModeId);
  const currentRooms = currentMode?.rooms || [];
  const currentBuffs = currentMode?.buffs || [];

  const currentRoom = currentRooms.find((r) => r.id === currentRoomId);
  const currentEffects = currentRoom?.effects || [];

  // Si el buff guardado en sesión no pertenece al modo actual, caemos al primero
  const resolvedBuffId = useMemo(() => {
    if (!currentBuffs.length) return "";
    return currentBuffs.some((b) => b.id === currentBuffId)
      ? currentBuffId
      : currentBuffs[0].id;
  }, [currentBuffs, currentBuffId]);

  const currentBuff = currentBuffs.find((b) => b.id === resolvedBuffId);
  const currentBuffEffects = currentBuff?.effects || [];

  const isDeadlyAssault = currentModeId === "deadly_assault";
  const hasBuffs = isDeadlyAssault && currentBuffs.length > 0;

  // ── Deriva el estado activo directamente de teamEffects ──
  // No hay Sets locales: no pueden desincronizarse.
  const isEffectActive = (id: string) => !!teamEffects[id]?.enabled;
  const isBuffEffectActive = (id: string) => !!teamEffects[id]?.enabled;

  // ── Sincroniza mode / room / buff a sesión ──
  useEffect(() => {
    setHomeSession((prev) => ({
      ...prev,
      gameModeCurrentModeId: currentModeId,
      gameModeCurrentRoomId: currentRoomId,
      gameModeCurrentBuffId: resolvedBuffId,
    }));
  }, [currentModeId, currentRoomId, resolvedBuffId, setHomeSession]);

  // ── Al montar, si el buff guardado no es válido, corrígelo en estado local ──
  useEffect(() => {
    if (resolvedBuffId && resolvedBuffId !== currentBuffId) {
      setCurrentBuffId(resolvedBuffId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedBuffId]);

  const theme = propTheme || "#7EFFDB";
  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11)`,
    backgroundColor: "rgba(51, 53, 52, 0.75)",
    boxShadow:
      "0 0 6px rgba(43, 42, 42, 0.6), 0 0 12px rgba(0, 0, 0, 0.4), 0 0 18px rgba(116, 116, 116, 0.2)",
    borderRadius: "6.4px",
  };

  const disableEffects = (effects: any[]) => {
    effects.forEach((e) => {
      const st = teamEffects[e.id];
      if (st?.enabled && st.ownerAgentId === "gameMode") {
        onTeamEffectToggle(e.id, false, 1, slotIndex, "gameMode");
      }
    });
  };

  // ── Handlers ──
  const handleModeChange = (modeId: string) => {
    if (modeId === currentModeId) return;
    disableEffects(currentEffects);
    disableEffects(currentBuffEffects);
    setCurrentModeId(modeId);
    const newMode = modes.find((m) => m.id === modeId);
    if (newMode?.rooms?.length) setCurrentRoomId(newMode.rooms[0].id);
    if (newMode?.buffs?.length) setCurrentBuffId(newMode.buffs[0].id);
    else setCurrentBuffId("");
    if (activeEffectId) onSelectEffect(null);
  };

  const handleRoomChange = (roomId: string) => {
    if (roomId === currentRoomId) return;
    disableEffects(currentEffects);
    setCurrentRoomId(roomId);
    if (activeEffectId) onSelectEffect(null);
  };

  const handleBuffChange = (buffId: string) => {
    if (buffId === resolvedBuffId) return;
    disableEffects(currentBuffEffects);
    setCurrentBuffId(buffId);
  };

  const handleRoomToggle = (effectId: string) => {
    const nowActive = !!teamEffects[effectId]?.enabled;
    const stacks = localStacks[effectId] || 1;
    onTeamEffectToggle(effectId, !nowActive, stacks, slotIndex, "gameMode");
    // Solo los rooms actualizan el "efecto principal"
    if (!nowActive) onSelectEffect(effectId);
    else if (activeEffectId === effectId) onSelectEffect(null);
  };

  const handleBuffToggle = (effectId: string) => {
    const nowActive = !!teamEffects[effectId]?.enabled;
    const stacks = localStacks[effectId] || 1;
    onTeamEffectToggle(effectId, !nowActive, stacks, slotIndex, "gameMode");
    // Los buffs NO tocan gameModeEffectId
  };

  const handleStackChange = (effectId: string, newStacks: number) => {
    const pool = [...currentEffects, ...currentBuffEffects];
    const effect = pool.find((e) => e.id === effectId);
    const maxStacks = effect?.maxStacks || 1;
    const clamped = Math.max(1, Math.min(newStacks, maxStacks));
    setLocalStacks((prev) => ({ ...prev, [effectId]: clamped }));
    if (teamEffects[effectId]?.enabled) {
      onTeamEffectToggle(effectId, true, clamped, slotIndex, "gameMode");
    }
  };

  const SKILL_TYPE_LABELS: Record<string, string> = {
    basic: "Basic",
    dash: "Dash",
    counter: "Dodge Counter",
    quickAssist: "Quick Assist",
    followup: "Assist Follow-Up",
    special: "Special",
    ex: "EX Special",
    chain: "Chain",
    ultimate: "Ultimate",
    mindscape: "Other",
  };

  const getBonusLabel = (bonus: any): string => {
    const skillName = bonus.skillType
      ? SKILL_TYPE_LABELS[bonus.skillType] || bonus.skillType
      : "";

    switch (bonus.type) {
      case "global":
        return "All DMG";

      case "element":
        return bonus.element
          ? `${bonus.element.toUpperCase()} DMG`
          : "Element DMG";

      case "skillType":
        return skillName ? `${skillName} DMG` : "Skill DMG";

      case "skillTypeElemental":
        return bonus.element && bonus.skillType
          ? `${bonus.element.toUpperCase()} ${skillName} DMG`
          : "Skill/Element DMG";

      case "skillTypeStat": {
        // El nombre del stat viene formateado por el helper
        const statLabel = bonus.stat ? formatStatName(bonus.stat) : "Stat";
        return skillName ? `${skillName} ${statLabel}` : statLabel;
      }

      case "exclusive":
        return "Skill-Exclusive DMG";

      case "elementExclusive":
        return bonus.element
          ? `${bonus.element.toUpperCase()} Skill-Exclusive DMG`
          : "Skill-Exclusive DMG";

      case "hitExclusive":
        return bonus.hitName ? `${bonus.hitName} DMG` : "Hit-Specific DMG";

      case "sheerDmg":
        return "Sheer DMG";

      case "elementSheerDmg":
        return bonus.element
          ? `${bonus.element.toUpperCase()} Sheer DMG`
          : "Sheer DMG";

      case "skillTypeElementalSheer":
        return bonus.element && bonus.skillType
          ? `${bonus.element.toUpperCase()} ${skillName} Sheer DMG`
          : "Skill Sheer DMG";

      case "critDamageElementalBonus":
        return bonus.element
          ? `${bonus.element.toUpperCase()} CRIT DMG`
          : "Elemental CRIT DMG";

      default:
        return bonus.type || "Bonus";
    }
  };

  const modeIcons: Record<string, string> = {
    deadly_assault: "/resources/images/other/deadly_assault.png",
    shiyu_defense: "/resources/images/other/shiyu_defense.png",
  };

  // ── Render de efectos (reusable rooms + buffs) ──
  const renderEffects = (
    effects: any[],
    isActiveFn: (id: string) => boolean,
    onToggle: (id: string) => void,
  ) => (
    <div className="game_mode-ingame_toggles_wrapper">
      {effects.map((effect) => {
        const isActive = isActiveFn(effect.id);
        const effectId = effect.id;
        const stacks = localStacks[effectId] || 1;
        const hasStacks = effect.maxStacks && effect.maxStacks > 1;
        const hasFlat = effect.flat && Object.keys(effect.flat).length > 0;
        const hasDamageBonuses =
          effect.damageBonuses && effect.damageBonuses.length > 0;

        return (
          <div key={effect.id} className="ingame_toggle-main_container">
            <div
              className="ingame_toggle-main_wrapper"
              style={emptyObjectsStyle}
            >
              <div className="ingame_toggle-first_row">
                <div className="ingame_toggle-agent_icon">
                  <img
                    src="/resources/images/agents/icons/game_mode.png"
                    alt="Game Mode"
                    className="ingame_toggle-agent_icon-img"
                  />
                </div>
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
              <div className="ingame_toggle-description_section">
                {effect.shortDescription && <p>{effect.shortDescription}</p>}
              </div>
              <div className="ingame_toggle-toggle_section">
                <div className="ingame_toggle-toggle_section-switch">
                  <input
                    className="ingame_toggle-toggle_section-input"
                    id={`gm-${effectId}`}
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggle(effect.id)}
                  />
                  <label
                    className="ingame_toggle-toggle_section-label"
                    htmlFor={`gm-${effectId}`}
                    style={
                      isActive
                        ? ({
                            backgroundColor: theme,
                            "--toggle-color": theme,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </div>
              </div>
              <div className="ingame_toggle-controls_section">
                {isActive && hasStacks && (
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
                        onChange={(e) =>
                          handleStackChange(effect.id, Number(e.target.value))
                        }
                        style={{ accentColor: theme }}
                      />
                      <div className="ingame_toggle-stacks_section-number">
                        <button
                          onClick={() =>
                            handleStackChange(effect.id, stacks - 1)
                          }
                          disabled={stacks <= 1}
                        >
                          −
                        </button>
                        <span>{stacks}</span>
                        <button
                          onClick={() =>
                            handleStackChange(effect.id, stacks + 1)
                          }
                          disabled={stacks >= effect.maxStacks}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {isActive && hasFlat && (
                  <div className="ingame_toggle-stats_section">
                    <div className="ingame_toggle-stats_header">
                      📊 Active Bonuses
                    </div>
                    {Object.entries(effect.flat).map(([stat, value]) => (
                      <div key={stat} className="ingame_toggle-stat_row">
                        <span className="ingame_toggle-stat_name">
                          {formatStatName(stat)}:
                        </span>
                        <span className="ingame_toggle-stat_value">
                          {formatStatValue(stat, Number(value))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {isActive && hasDamageBonuses && (
                  <div className="ingame_toggle-stats_section">
                    <div className="ingame_toggle-stats_header">
                      📊 Damage Bonuses
                    </div>
                    {effect.damageBonuses.map((bonus: any, idx: number) => (
                      <div
                        key={idx}
                        className="ingame_toggle-stat_row is-bonus"
                      >
                        <span className="ingame_toggle-stat_name">
                          {getBonusLabel(bonus)}:
                        </span>
                        <span className="ingame_toggle-stat_value is-bonus">
                          +{(bonus.value * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {effects.length === 0 && <div>No effects available</div>}
    </div>
  );

  return (
    <div
      className="game_mode-main_wrapper"
      style={{ "--theme": theme } as React.CSSProperties}
    >
      <div
        className={`game_mode-main_grid ${
          hasBuffs ? "game_mode-main_grid--with-buffs" : ""
        }`}
      >
        {/* Columna 1: modos */}
        <div className="game_mode-main_grid-left_column">
          {modes.map((mode) => {
            const isActive = currentModeId === mode.id;
            const icon = modeIcons[mode.id] || "🎮";
            return (
              <div className="game_mode-button_wrapper" key={mode.id}>
                <div className="game_mode-button_background">
                  <button
                    onClick={() => handleModeChange(mode.id)}
                    className={`game_mode-button ${isActive ? "active" : ""}`}
                    disabled={isActive}
                  >
                    {typeof icon === "string" && icon.startsWith("/") ? (
                      <img
                        src={icon}
                        alt={mode.label}
                        className="game_mode-button_icon"
                      />
                    ) : (
                      <span className="game_mode-button_icon">{icon}</span>
                    )}
                    <div className="game_mode-button_label">
                      {mode.label.split(" ").map((word, idx) => (
                        <span key={idx} className="game_mode-button_word">
                          {word}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Columna 2: rooms + efectos */}
        <div className="game_mode-main_grid-right_column">
          <div className="game_mode-button_wrapper-rooms">
            <div className="game_mode-rooms_row" style={emptyObjectsStyle}>
              {currentRooms.map((room) => {
                const isActive = currentRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleRoomChange(room.id)}
                    className={`game_mode-room_button ${
                      isActive ? "active" : ""
                    }`}
                    disabled={isActive}
                  >
                    {room.label}
                  </button>
                );
              })}
            </div>
          </div>
          {renderEffects(currentEffects, isEffectActive, handleRoomToggle)}
        </div>

        {/* Columna 3: buffs — SOLO Deadly Assault */}
        {hasBuffs && (
          <div className="game_mode-main_grid-buffs_column">
            <div className="game_mode-button_wrapper-rooms">
              <div className="game_mode-rooms_row" style={emptyObjectsStyle}>
                {currentBuffs.map((buff) => {
                  const isActive = resolvedBuffId === buff.id;
                  return (
                    <button
                      key={buff.id}
                      onClick={() => handleBuffChange(buff.id)}
                      className={`game_mode-room_button ${
                        isActive ? "active" : ""
                      }`}
                      disabled={isActive}
                    >
                      {buff.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {renderEffects(
              currentBuffEffects,
              isBuffEffectActive,
              handleBuffToggle,
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameModeTogglePanel;
