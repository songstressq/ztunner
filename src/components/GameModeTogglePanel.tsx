import React, { useState, useEffect } from "react";
import gameModesData from "@/data/gameModes.json";
import { InfoTooltip } from "./InfoTooltip";
import { useSession } from "@/context/SessionContext";

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

const GameModeTogglePanel: React.FC<GameModeTogglePanelProps> = ({
  activeEffectId,
  onSelectEffect,
  onTeamEffectToggle,
  slotIndex,
  theme: propTheme = "#7EFFDB",
}) => {
  const { homeSession, setHomeSession } = useSession();
  const teamEffects = homeSession.teamEffects;

  const modes = (gameModesData as any).modes as {
    id: string;
    label: string;
    rooms: { id: string; label: string; effects: any[] }[];
  }[];

  const initialModeId = homeSession.gameModeCurrentModeId || modes[0]?.id || "";
  const initialRoomId =
    homeSession.gameModeCurrentRoomId || modes[0]?.rooms[0]?.id || "";
  const [currentModeId, setCurrentModeId] = useState<string>(initialModeId);
  const [currentRoomId, setCurrentRoomId] = useState<string>(initialRoomId);
  const [localStacks, setLocalStacks] = useState<Record<string, number>>({});
  const [activeEffectIds, setActiveEffectIds] = useState<Set<string>>(
    new Set(),
  );
  const currentMode = modes.find((m) => m.id === currentModeId);
  const currentRooms = currentMode?.rooms || [];
  const currentRoom = currentRooms.find((r) => r.id === currentRoomId);
  const currentEffects = currentRoom?.effects || [];
  const validEffectIds = new Set(currentEffects.map((e) => e.id));

  useEffect(() => {
    setHomeSession((prev) => ({
      ...prev,
      gameModeCurrentModeId: currentModeId,
      gameModeCurrentRoomId: currentRoomId,
    }));
  }, [currentModeId, currentRoomId, setHomeSession]);

  useEffect(() => {
    let hasGhost = false;
    Object.keys(teamEffects).forEach((effectId) => {
      const state = teamEffects[effectId];
      if (
        state?.enabled &&
        state.ownerAgentId === "gameMode" &&
        !validEffectIds.has(effectId)
      ) {
        hasGhost = true;
        onTeamEffectToggle(effectId, false, 1, slotIndex, "gameMode");
      }
    });
    if (hasGhost) {
      const active = new Set<string>();
      currentEffects.forEach((effect) => {
        if (teamEffects[effect.id]?.enabled) {
          active.add(effect.id);
        }
      });
      setActiveEffectIds(active);
      if (active.size === 0 && activeEffectId) {
        onSelectEffect(null);
      }
    }
  }, [currentEffects, teamEffects, validEffectIds]);

  useEffect(() => {
    Object.keys(teamEffects).forEach((effectId) => {
      const state = teamEffects[effectId];
      if (
        state?.enabled &&
        state.ownerAgentId === "gameMode" &&
        !validEffectIds.has(effectId)
      ) {
        onTeamEffectToggle(effectId, false, 1, slotIndex, "gameMode");
      }
    });
    clearCurrentRoomEffects();
    const active = new Set<string>();
    currentEffects.forEach((effect) => {
      if (teamEffects[effect.id]?.enabled) {
        active.add(effect.id);
      }
    });
    setActiveEffectIds(active);
  }, []);

  useEffect(() => {
    Object.keys(teamEffects).forEach((effectId) => {
      const state = teamEffects[effectId];
      if (
        state?.enabled &&
        state.ownerAgentId === "gameMode" &&
        !validEffectIds.has(effectId)
      ) {
        onTeamEffectToggle(effectId, false, 1, slotIndex, "gameMode");
      }
    });
    const active = new Set<string>();
    currentEffects.forEach((effect) => {
      if (teamEffects[effect.id]?.enabled) {
        active.add(effect.id);
      }
    });
    setActiveEffectIds(active);
  }, [currentRoomId, currentModeId, teamEffects]);

  useEffect(() => {
    return () => {
      clearCurrentRoomEffects();
    };
  }, [currentRoomId, currentModeId]);

  const theme = propTheme || "#7EFFDB";

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11)`,
    backgroundColor: "rgba(51, 53, 52, 0.75)",
    boxShadow:
      "0 0 6px rgba(43, 42, 42, 0.6), 0 0 12px rgba(0, 0, 0, 0.4), 0 0 18px rgba(116, 116, 116, 0.2)",
    borderRadius: "6.4px",
  };

  const syncAllEffectsToParent = (activeSet: Set<string>) => {
    currentEffects.forEach((effect) => {
      const shouldBeActive = activeSet.has(effect.id);
      const currentState = teamEffects[effect.id]?.enabled || false;
      if (shouldBeActive !== currentState) {
        const stacks = localStacks[effect.id] || 1;
        onTeamEffectToggle(
          effect.id,
          shouldBeActive,
          stacks,
          slotIndex,
          "gameMode",
        );
      }
    });
    if (activeSet.size > 0) {
      onSelectEffect(Array.from(activeSet)[0]);
    } else {
      onSelectEffect(null);
    }
  };

  const clearCurrentRoomEffects = () => {
    const activeSet = new Set<string>();
    currentEffects.forEach((effect) => {
      const state = teamEffects[effect.id];
      if (state?.enabled && state.ownerAgentId === "gameMode") {
        onTeamEffectToggle(effect.id, false, 1, slotIndex, "gameMode");
      }
    });
    setActiveEffectIds(activeSet);
    setLocalStacks((prev) => {
      const newStacks = { ...prev };
      currentEffects.forEach((effect) => {
        newStacks[effect.id] = 1;
      });
      return newStacks;
    });
    if (activeEffectId) {
      onSelectEffect(null);
    }
  };

  const handleModeChange = (modeId: string) => {
    if (modeId === currentModeId) return;
    clearCurrentRoomEffects();
    setCurrentModeId(modeId);
    const newMode = modes.find((m) => m.id === modeId);
    if (newMode?.rooms.length > 0) {
      setCurrentRoomId(newMode.rooms[0].id);
    }
  };

  const handleRoomChange = (roomId: string) => {
    if (roomId === currentRoomId) return;
    clearCurrentRoomEffects();
    setCurrentRoomId(roomId);
  };

  const handleToggleClick = (effectId: string) => {
    const newActiveSet = new Set(activeEffectIds);
    if (newActiveSet.has(effectId)) {
      newActiveSet.delete(effectId);
    } else {
      newActiveSet.add(effectId);
    }
    setActiveEffectIds(newActiveSet);
    syncAllEffectsToParent(newActiveSet);
  };

  const handleStackChange = (effectId: string, newStacks: number) => {
    const effect = currentEffects.find((e) => e.id === effectId);
    const maxStacks = effect?.maxStacks || 1;
    const clamped = Math.max(1, Math.min(newStacks, maxStacks));
    setLocalStacks((prev) => ({
      ...prev,
      [effectId]: clamped,
    }));
    if (activeEffectIds.has(effectId)) {
      onTeamEffectToggle(effectId, true, clamped, slotIndex, "gameMode");
    }
  };

  const formatStatName = (stat: string): string => {
    const names: Record<string, string> = {
      atkPercent: "ATK%",
      critDmg: "CRIT DMG",
      defPercent: "DEF%",
      hpPercent: "HP%",
      anomalyDmgBonus: "Anomaly DMG",
      disorderDmgBonus: "Disorder DMG",
      iceDmgBonus: "Ice DMG",
      penRatio: "PEN Ratio",
    };
    return names[stat] || stat;
  };

  const getBonusLabel = (bonus: any): string => {
    if (bonus.type === "element") {
      return `${bonus.element.toUpperCase()} DMG`;
    }
    if (bonus.type === "skillType") {
      const map: Record<string, string> = {
        ex: "EX Skill",
        ultimate: "Ultimate",
        basic: "Basic",
        chain: "Chain",
        special: "Special",
      };
      return `${map[bonus.skillType] || bonus.skillType} DMG`;
    }
    return bonus.type;
  };

  const modeIcons: Record<string, string> = {
    deadly_assault: "/resources/images/other/deadly_assault.png",
    shiyu_defense: "/resources/images/other/shiyu_defense.png",
  };

  return (
    <div
      className="game_mode-main_wrapper"
      style={{ "--theme": theme } as React.CSSProperties}
    >
      <div className="game_mode-main_grid">
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

        <div className="game_mode-main_grid-right_column">
          {/*<div>
            <p className="game_mode-main_title">
              End-Game Effects
              <div className="game_mode-divider" />
            </p>
          </div>*/}
          <div className="game_mode-button_wrapper-rooms">
            <div className="game_mode-rooms_row" style={emptyObjectsStyle}>
              {currentRooms.map((room) => {
                const isActive = currentRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleRoomChange(room.id)}
                    className={`game_mode-room_button ${isActive ? "active" : ""}`}
                    disabled={isActive}
                  >
                    {room.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="game_mode-ingame_toggles_wrapper">
            {currentEffects.map((effect) => {
              const isActive = activeEffectIds.has(effect.id);
              const effectId = effect.id;
              const stacks = localStacks[effectId] || 1;
              const hasStacks = effect.maxStacks && effect.maxStacks > 1;
              const hasFlat =
                effect.flat && Object.keys(effect.flat).length > 0;
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
                      {effect.shortDescription && (
                        <p>{effect.shortDescription}</p>
                      )}
                    </div>

                    <div className="ingame_toggle-toggle_section">
                      <div className="ingame_toggle-toggle_section-switch">
                        <input
                          className="ingame_toggle-toggle_section-input"
                          id={effectId}
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleToggleClick(effect.id)}
                        />
                        <label
                          className="ingame_toggle-toggle_section-label"
                          htmlFor={effectId}
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
                                handleStackChange(
                                  effect.id,
                                  Number(e.target.value),
                                )
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
                                +{(Number(value) * 100).toFixed(1)}%
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
                          {effect.damageBonuses.map(
                            (bonus: any, idx: number) => (
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
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {currentEffects.length === 0 && <div>No effects available</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeTogglePanel;
