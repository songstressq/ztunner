import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { loadAllBuilds } from "@/utils/savedBuilds";
import { agents } from "@/data/agents";
import { wEngines } from "@/data/wengines";
import { calculateUnifiedStats } from "@/utils/statScaling";
import type { SavedBuild } from "@/types/SavedBuild";
import IngameEffectsPanel from "@/components/IngameEffectsPanel";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";
import "../styles/home.css";
import DamageCalculatorPanel from "@/components/DamageCalculator";
import type { DamageSkill } from "@/types/DamageSkill";
import SkillCalculator from "@/components/SkillCalculator";
import type { UnifiedStats } from "@/types/UnifiedStats";
import { useSession } from "@/context/SessionContext";
import DiagonalMarquee from "@/components/DiagonalMarquee";
import NeonSelect from "@/components/NeonSelect";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  defaultCalculatorState,
  type CalculatorUIState,
} from "@/context/SessionContext";
import { collectIngameEffects } from "@/utils/collectIngameEffects";
import GameModeTogglePanel from "@/components/GameModeTogglePanel";
import SkillsProfileModal from "@/components/SkillsProfileModal";
import CustomPrompt from "@/components/CustomPrompt";

const DamageSimulator = () => {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [slotAnomalyResults, setSlotAnomalyResults] = useState<
    Record<number, any>
  >({});
  const { homeSession, setHomeSession } = useSession();
  const gameModeEffectId = homeSession.gameModeEffectId;
  const selectedBuildIds = homeSession.selectedBuildIds;
  const activeEffectsByBuild = homeSession.activeEffectsByBuild;
  const teamEffects = homeSession.teamEffects;
  const seedVanguardEffects = homeSession.seedVanguardEffects;
  const targetedEffects = homeSession.targetedEffects;
  const renderCount = useRef(0);
  const [showSkillsProfileModal, setShowSkillsProfileModal] = useState(false);
  const [selectedAgentIdForProfile, setSelectedAgentIdForProfile] = useState(
    agents[0]?.id || "",
  );
  const showGameModePanel = homeSession.showGameModePanel ?? true;

  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    type: "prompt" | "confirm";
    title: string;
    message?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "confirm",
    title: "",
    onConfirm: () => {},
  });

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setPromptState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm,
    });
  };

  // const [isLoading, setIsLoading] = useState(true);

  const getSlotCalculatorState = (slotIndex: number): CalculatorUIState => {
    return (
      homeSession.slotCalculatorStates[slotIndex] || defaultCalculatorState
    );
  };

  const updateSlotCalculatorState = (
    slotIndex: number,
    updater: (prev: CalculatorUIState) => CalculatorUIState,
  ) => {
    setHomeSession((prev) => ({
      ...prev,
      slotCalculatorStates: {
        ...prev.slotCalculatorStates,
        [slotIndex]: updater(
          prev.slotCalculatorStates[slotIndex] || defaultCalculatorState,
        ),
      },
    }));
  };

  /*const [fluxedAttributes, setFluxedAttributes] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);*/

  const handleTeamEffectToggle = (
    effectId: string,
    enabled: boolean,
    stacks: number,
    sourceSlot: number,
    ownerAgentId: string,
    ownerCurrentStats?: UnifiedStats,
    ownerInitialStats?: {
      hp: number;
      atk: number;
      def: number;
      critRate?: number;
      anomalyMastery?: number;
      anomalyProficiency?: number;
      energyRegen?: number;
      penRatio?: number;
      impact?: number;
    },
    skillLevel?: number,
    overclockLevel?: number,
  ) => {
    const ownerAgent = agents.find((a) => a.id === ownerAgentId);
    const ownerDisplayName = ownerAgent?.displayName || ownerAgent?.name;

    setHomeSession((prev) => ({
      ...prev,
      teamEffects: {
        ...prev.teamEffects,
        [effectId]: {
          enabled,
          stacks,
          sourceSlot,
          ownerAgentId,
          ownerDisplayName,
          ownerCurrentStats,
          ownerInitialStats,
          skillLevel: skillLevel ?? prev.teamEffects[effectId]?.skillLevel ?? 1,
          overclockLevel:
            overclockLevel ?? prev.teamEffects[effectId]?.overclockLevel ?? 1,
        },
      },
    }));
  };

  useEffect(() => {
    const currentGameModeEffect = Object.keys(homeSession.teamEffects).find(
      (id) =>
        id.startsWith("game_mode_") && homeSession.teamEffects[id]?.enabled,
    );

    if (!gameModeEffectId && currentGameModeEffect) {
      handleTeamEffectToggle(currentGameModeEffect, false, 1, 0, "gameMode");
    } else if (gameModeEffectId && currentGameModeEffect !== gameModeEffectId) {
      if (currentGameModeEffect) {
        handleTeamEffectToggle(currentGameModeEffect, false, 1, 0, "gameMode");
      }
      handleTeamEffectToggle(gameModeEffectId, true, 1, 0, "gameMode");
    }
  }, [gameModeEffectId, homeSession.teamEffects]);

  const handleSeedVanguardChange = (
    seedSlot: number,
    vanguardSlot: number | null,
    enabled: boolean,
  ) => {
    setHomeSession((prev) => {
      const newEffects = { ...prev.seedVanguardEffects };
      Object.keys(newEffects).forEach((effectId) => {
        if (effectId.startsWith(`seed_vanguard_${seedSlot}_to_`)) {
          delete newEffects[effectId];
        }
      });
      if (vanguardSlot !== null && enabled) {
        const effectId = `seed_vanguard_${seedSlot}_to_${vanguardSlot}`;
        newEffects[effectId] = { seedSlot, vanguardSlot, enabled: true };
      }
      return { ...prev, seedVanguardEffects: newEffects };
    });
  };

  const handleTargetEffectChange = (
    effectId: string,
    targetSlot: number | null,
    enabled: boolean,
    sourceSlot: number,
  ) => {
    setHomeSession((prev) => {
      const newEffects = { ...prev.targetedEffects };
      if (targetSlot === null || !enabled) {
        delete newEffects[effectId];
      } else {
        newEffects[effectId] = { sourceSlot, targetSlot, enabled: true };
      }
      return { ...prev, targetedEffects: newEffects };
    });
  };

  const handleGameModeEffectChange = (effectId: string | null) => {
    setHomeSession((prev) => ({
      ...prev,
      gameModeEffectId: effectId,
    }));
  };

  useEffect(() => {
    const freshBuilds = loadAllBuilds();
    setBuilds(freshBuilds);

    setHomeSession((prev) => {
      let teamChanged = false;
      let selfChanged = false;

      const updatedTeamEffects = { ...prev.teamEffects };
      const updatedActiveEffectsByBuild = { ...prev.activeEffectsByBuild };

      Object.entries(updatedTeamEffects).forEach(([effectId, state]) => {
        if (!state.enabled) return;

        const sourceBuildId = prev.selectedBuildIds[state.sourceSlot];
        if (!sourceBuildId) return;

        const sourceBuild = freshBuilds.find((b) => b.id === sourceBuildId);
        if (!sourceBuild) return;

        const ownerAgent = agents.find((a) => a.id === state.ownerAgentId);
        if (!ownerAgent) return;

        const isMindscapeEffect = (ownerAgent as any).ingameEffects?.some(
          (e: any) => e.id === effectId && e.source === "mindscape",
        );
        if (!isMindscapeEffect) return;

        if (!sourceBuild.activeMindscapes?.includes(effectId)) {
          updatedTeamEffects[effectId] = { ...state, enabled: false };
          teamChanged = true;
        }
      });

      freshBuilds.forEach((build) => {
        const buildEffects = updatedActiveEffectsByBuild[build.id];
        if (!buildEffects) return;

        const agent = agents.find((a) => a.id === build.agentId);
        if (!agent) return;

        const updatedBuildEffects = { ...buildEffects };
        let buildChanged = false;

        Object.entries(updatedBuildEffects).forEach(([effectId, state]) => {
          if (!state.enabled) return;

          const isMindscapeSelfEffect = (agent as any).ingameEffects?.some(
            (e: any) =>
              e.id === effectId &&
              e.source === "mindscape" &&
              e.target === "self",
          );
          if (!isMindscapeSelfEffect) return;

          if (!build.activeMindscapes?.includes(effectId)) {
            updatedBuildEffects[effectId] = { ...state, enabled: false };
            buildChanged = true;
          }
        });

        if (buildChanged) {
          updatedActiveEffectsByBuild[build.id] = updatedBuildEffects;
          selfChanged = true;
        }
      });

      if (!teamChanged && !selfChanged) return prev;

      return {
        ...prev,
        teamEffects: updatedTeamEffects,
        activeEffectsByBuild: updatedActiveEffectsByBuild,
      };
    });
  }, []);

  useEffect(() => {
    if (builds.length === 0) return;

    const updatedTeamEffects = { ...teamEffects };
    let needsUpdate = false;
    const agentToSlotMap = new Map();

    selectedBuildIds.forEach((buildId, slotIndex) => {
      if (!buildId) return;
      const build = builds.find((b) => b.id === buildId);
      if (build) agentToSlotMap.set(build.agentId, slotIndex);
    });

    Object.entries(updatedTeamEffects).forEach(([effectId, effectState]) => {
      if (!effectState.enabled) return;
      const currentSlot = agentToSlotMap.get(effectState.ownerAgentId);
      if (currentSlot === undefined) {
        updatedTeamEffects[effectId] = { ...effectState, enabled: false };
        needsUpdate = true;
      } else if (currentSlot !== effectState.sourceSlot) {
        updatedTeamEffects[effectId] = {
          ...effectState,
          sourceSlot: currentSlot,
        };
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setHomeSession((prev) => ({ ...prev, teamEffects: updatedTeamEffects }));
    }
  }, [selectedBuildIds, builds]);

  const isLarge = useMediaQuery("(min-width: 1367px)");
  const isMedium = useMediaQuery("(min-width: 926px) and (max-width: 1366px)");
  const isSmall = useMediaQuery("(max-width: 925px)");

  const slidesToShow = isLarge ? 3 : isMedium ? 2 : 1;

  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    if (currentSlide > totalSlides - slidesToShow) {
      setCurrentSlide(Math.max(0, totalSlides - slidesToShow));
    }
  }, [slidesToShow, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - slidesToShow));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.min(index, totalSlides - slidesToShow));
  };

  const formatPercent = (value: number, decimals = 1) =>
    `${(value * 100).toFixed(decimals)}%`;

  const emptyStats = {
    hp: 0,
    atk: 0,
    def: 0,
    critRate: 0,
    critDmg: 0,
    impact: 0,
    anomalyProficiency: 0,
    anomalyMastery: 0,
    penRatio: 0,
    pen: 0,
    energyRegen: 0,
    attributeDmgBonus: {
      fire: 0,
      ice: 0,
      electric: 0,
      physical: 0,
      ether: 0,
    },
    sheerForce: 0,
  };

  const getAllEffectsForSlot = (
    slotIndex: number,
    build: SavedBuild | null,
  ) => {
    const effects: Record<
      string,
      {
        enabled: boolean;
        stacks: number;
        overclockLevel?: number;
        skillLevel?: number;
      }
    > = {};

    if (build) {
      const buildEffects = activeEffectsByBuild[build.id] ?? {};
      Object.entries(buildEffects).forEach(([effectId, state]) => {
        if (state.enabled) {
          effects[effectId] = {
            enabled: true,
            stacks: state.stacks || 1,
            overclockLevel: (state as any).overclockLevel || 1,
            skillLevel: (state as any).skillLevel || 1,
          };
        }
      });
    }

    Object.entries(teamEffects).forEach(([effectId, state]) => {
      if (state.enabled) {
        effects[effectId] = {
          enabled: true,
          stacks: state.stacks || 1,
          overclockLevel: state.overclockLevel || 1,
          skillLevel: state.skillLevel || 1,
        };
      }
    });

    Object.entries(seedVanguardEffects).forEach(
      ([effectId, vanguardEffect]) => {
        if (
          vanguardEffect.enabled &&
          vanguardEffect.vanguardSlot === slotIndex
        ) {
          effects[effectId] = { enabled: true, stacks: 1 };
        }
      },
    );

    Object.entries(targetedEffects).forEach(([effectId, effectData]) => {
      if (
        effectData.enabled &&
        (effectData.sourceSlot === slotIndex ||
          effectData.targetSlot === slotIndex)
      ) {
        effects[effectId] = { enabled: true, stacks: 1 };
      }
    });

    return effects;
  };

  const getSpecificTeamEffects = () => {
    const specificEffects: Record<
      string,
      { enabled: boolean; stacks: number }
    > = {};
    Object.entries(teamEffects).forEach(([effectId, state]) => {
      if (state.enabled) {
        const effectFromRegistry = ingameEffectsRegistry[effectId];
        if (effectFromRegistry && effectFromRegistry.target === "team") {
          specificEffects[effectId] = { enabled: true, stacks: state.stacks };
        }
      }
    });
    return specificEffects;
  };

  const getOtherSelectedAgentIds = (excludeSlotIndex: number): string[] => {
    const selected: string[] = [];
    selectedBuildIds.forEach((buildId, idx) => {
      if (buildId && idx !== excludeSlotIndex) {
        const build = builds.find((b) => b.id === buildId);
        if (build) selected.push(build.agentId);
      }
    });
    return selected;
  };

  const formatStatName = (key: string): string => {
    const statNames: Record<string, string> = {
      hp: "HP",
      atk: "ATK",
      def: "DEF",
      critRate: "CRIT Rate",
      critDmg: "CRIT DMG",
      impact: "Impact",
      anomalyProficiency: "Anomaly Proficiency",
      anomalyMastery: "Anomaly Mastery",
      penRatio: "PEN Ratio",
      pen: "PEN",
      energyRegen: "Energy Regen",
      sheerForce: "Sheer Force",
      attributeDmgBonus: "Attribute DMG Bonus",
    };
    return statNames[key] || key;
  };

  const formatStatValue = (key: string, value: any): string => {
    if (key === "critRate" || key === "critDmg" || key === "penRatio") {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (key === "energyRegen") {
      return value.toFixed(2);
    }
    return value.toString();
  };

  const hasActiveGameModeEffects = useMemo(() => {
    return Object.values(teamEffects).some(
      (state) => state.enabled && state.ownerAgentId === "gameMode",
    );
  }, [teamEffects]);

  const isToggleDisabled = hasActiveGameModeEffects && showGameModePanel;

  const toggleGameModePanel = () => {
    if (hasActiveGameModeEffects && showGameModePanel) return;
    setHomeSession((prev) => ({
      ...prev,
      showGameModePanel: !prev.showGameModePanel,
    }));
  };

  useEffect(() => {
    if (showSkillsProfileModal) {
      const profiles = homeSession.skillProfiles || {};
      const first = Object.keys(profiles)[0];
      setSelectedAgentIdForProfile(first || agents[0]?.id || "");
    }
  }, [showSkillsProfileModal]);

  const resetAllEffects = () => {
    openConfirm(
      "Reset Effects",
      "Are you sure you want to disable ALL effects? This will reload the page.",
      () => {
        setHomeSession((prev) => ({
          ...prev,
          activeEffectsByBuild: {},
          teamEffects: {},
          targetedEffects: {},
          seedVanguardEffects: {},
        }));
        setTimeout(() => {
          window.location.reload();
        }, 100);
      },
    );
  };

  const teamSlotsInfo = useMemo(() => {
    const statsMap: Record<number, UnifiedStats> = {};
    const slotsInfo: Array<{
      slotIndex: number;
      agentName: string;
      specialty: string;
      attribute: string;
      stats: UnifiedStats;
    }> = [];

    for (let idx = 0; idx < selectedBuildIds.length; idx++) {
      const buildId = selectedBuildIds[idx];
      if (!buildId) {
        slotsInfo.push({
          slotIndex: idx,
          agentName: "Empty",
          specialty: "Unknown",
          attribute: "unknown",
          stats: emptyStats,
        });
        continue;
      }

      const slotBuild = builds.find((b) => b.id === buildId);
      if (!slotBuild) continue;
      const slotAgent = agents.find((a) => a.id === slotBuild.agentId);
      if (!slotAgent) continue;
      const slotEngine =
        wEngines.find((w) => w.id === slotBuild.engineId) ?? null;
      const slotEffects = getAllEffectsForSlot(idx, slotBuild);

      const getStatsBySlot = (targetSlot: number): UnifiedStats | undefined => {
        return statsMap[targetSlot];
      };

      const slotStats = calculateUnifiedStats(
        slotAgent,
        slotEngine,
        slotBuild.coreLevel,
        slotBuild.discs,
        slotEffects,
        teamEffects,
        undefined,
        targetedEffects,
        idx,
        getStatsBySlot,
        slotsInfo,
      );
      statsMap[idx] = slotStats;
      slotsInfo.push({
        slotIndex: idx,
        agentName: slotAgent.displayName || slotAgent.name,
        specialty: slotAgent.specialty,
        attribute: slotAgent.attribute,
        stats: slotStats,
        activeEffects: getAllEffectsForSlot(idx, slotBuild),
        agent: slotAgent,
      });
    }
    return slotsInfo;
  }, [
    selectedBuildIds,
    builds,
    activeEffectsByBuild,
    teamEffects,
    targetedEffects,
  ]);

  const dominantTheme = useMemo(() => {
    const hasAnyAgent = teamSlotsInfo?.some(
      (slot) => slot.agent && slot.agentName !== "Empty",
    );
    if (!hasAnyAgent) {
      return "#afafaf";
    }

    const prioritySpecialties = ["anomaly", "attack", "rupture"];

    const prioritySlots = teamSlotsInfo.filter(
      (slot) =>
        slot.agent &&
        slot.stats &&
        prioritySpecialties.includes(slot.specialty?.toLowerCase() || ""),
    );

    if (prioritySlots.length > 0) {
      let bestSlot = null;
      let bestPower = -Infinity;
      for (const slot of prioritySlots) {
        const specialty = slot.specialty?.toLowerCase();
        const power =
          specialty === "rupture"
            ? slot.stats.sheerForce || 0
            : slot.stats.atk || 0;
        if (power > bestPower) {
          bestPower = power;
          bestSlot = slot;
        }
      }
      return bestSlot?.agent?.themeColor || agents[0]?.themeColor || "#7EFFDB";
    }

    let bestSlot = null;
    let bestPower = -Infinity;
    for (const slot of teamSlotsInfo) {
      if (!slot.agent || !slot.stats) continue;
      const specialty = slot.specialty?.toLowerCase();
      const power =
        specialty === "rupture"
          ? slot.stats.sheerForce || 0
          : slot.stats.atk || 0;
      if (power > bestPower) {
        bestPower = power;
        bestSlot = slot;
      }
    }
    return bestSlot?.agent?.themeColor || agents[0]?.themeColor || "#7EFFDB";
  }, [teamSlotsInfo]);

  useEffect(() => {
    setHomeSession((prev) => ({
      ...prev,
      dominantTheme,
    }));
  }, [dominantTheme, setHomeSession]);

  const dominantEmptyStyle = {
    backgroundImage: `linear-gradient( to right bottom, ${dominantTheme}11, ${dominantTheme}22, ${dominantTheme}55, ${dominantTheme}22, ${dominantTheme}11 )`,
  };

  /* useEffect(() => {
  if (builds.length > 0 && teamSlotsInfo.length === 3) {
    setIsLoading(false);
  }
}, [builds, teamSlotsInfo]);

  /*useEffect(() => {
    // Forzar 5 segundos de carga para ver el spinner
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Limpiar el timeout si el componente se desmonta antes de los 5 segundos
    return () => clearTimeout(timer);
  }, []);*/

  const renderSlot = (slotIndex: number) => {
    const otherSelectedAgentIds = getOtherSelectedAgentIds(slotIndex);
    const buildId = selectedBuildIds[slotIndex];
    const build = builds.find((b) => b.id === buildId);

    const handleBuildChange = (
      slotIndex: number,
      newBuildId: string | null,
    ) => {
      const oldBuildId = selectedBuildIds[slotIndex];
      const oldBuild = oldBuildId
        ? builds.find((b) => b.id === oldBuildId)
        : null;
      const newBuild = newBuildId
        ? builds.find((b) => b.id === newBuildId)
        : null;

      const oldAgentId = oldBuild?.agentId ?? null;
      const newAgentId = newBuild?.agentId ?? null;
      const isAgentChanging = newAgentId !== null && newAgentId !== oldAgentId;

      setHomeSession((prev) => {
        const newSeedEffects = { ...prev.seedVanguardEffects };
        Object.keys(newSeedEffects).forEach((effectId) => {
          const effect = newSeedEffects[effectId];
          if (
            effect.seedSlot === slotIndex ||
            effect.vanguardSlot === slotIndex
          ) {
            delete newSeedEffects[effectId];
          }
        });

        const newTargetedEffects = { ...prev.targetedEffects };
        Object.keys(newTargetedEffects).forEach((effectId) => {
          const effect = newTargetedEffects[effectId];
          if (
            effect.sourceSlot === slotIndex ||
            effect.targetSlot === slotIndex
          ) {
            delete newTargetedEffects[effectId];
          }
        });

        return {
          ...prev,
          seedVanguardEffects: newSeedEffects,
          targetedEffects: newTargetedEffects,
        };
      });

      const copy = [...selectedBuildIds];
      copy[slotIndex] = newBuildId;

      if (oldBuild && newBuild && !isAgentChanging) {
        setHomeSession((prev) => {
          const newActiveEffects = { ...prev.activeEffectsByBuild };
          const oldEffects = newActiveEffects[oldBuildId] || {};
          const tempAgent = agents.find((a) => a.id === newBuild.agentId);
          const tempEngine =
            wEngines.find((w) => w.id === newBuild.engineId) ?? null;
          const tempEffects = collectIngameEffects({
            agent: tempAgent!,
            engine: tempEngine,
            discs: newBuild.discs,
            activeMindscapes: newBuild.activeMindscapes || [],
          });
          const availableEffectIds = new Set(tempEffects.map((e) => e.id));

          const filteredOldEffects = Object.fromEntries(
            Object.entries(oldEffects).filter(
              ([id, state]) => state.enabled && availableEffectIds.has(id),
            ),
          );
          newActiveEffects[newBuildId] = {
            ...newActiveEffects[newBuildId],
            ...filteredOldEffects,
          };
          delete newActiveEffects[oldBuildId];

          const updatedTeamEffects = { ...prev.teamEffects };
          Object.keys(updatedTeamEffects).forEach((effectId) => {
            const effectState = updatedTeamEffects[effectId];
            if (effectState.sourceSlot === slotIndex && effectState.enabled) {
              if (!availableEffectIds.has(effectId)) {
                updatedTeamEffects[effectId] = {
                  ...effectState,
                  enabled: false,
                };
              }
            }
          });

          return {
            ...prev,
            selectedBuildIds: copy,
            activeEffectsByBuild: newActiveEffects,
            teamEffects: updatedTeamEffects,
          };
        });
      } else {
        setHomeSession((prev) => ({
          ...prev,
          selectedBuildIds: copy,
        }));
      }

      if (oldBuild && isAgentChanging) {
        const oldAgent = agents.find((a) => a.id === oldBuild.agentId);
        if (oldAgent) {
          setHomeSession((prev) => {
            const newTeamEffects = { ...prev.teamEffects };
            const newTargeted = { ...prev.targetedEffects };

            Object.keys(newTeamEffects).forEach((effectId) => {
              const state = newTeamEffects[effectId];
              if (
                state.ownerAgentId === oldAgent.id &&
                state.sourceSlot === slotIndex
              ) {
                delete newTeamEffects[effectId];
              }
            });

            Object.keys(newTargeted).forEach((effectId) => {
              const effect = newTargeted[effectId];
              if (
                effect.sourceSlot === slotIndex ||
                effect.targetSlot === slotIndex
              ) {
                delete newTargeted[effectId];
              }
            });

            return {
              ...prev,
              teamEffects: newTeamEffects,
              targetedEffects: newTargeted,
            };
          });

          if (oldBuildId) {
            setHomeSession((prev) => {
              const newEffects = { ...prev.activeEffectsByBuild };
              if (newEffects[oldBuildId]) {
                const oldEffects = { ...newEffects[oldBuildId] };
                Object.keys(oldEffects).forEach((effectId) => {
                  oldEffects[effectId] = {
                    ...oldEffects[effectId],
                    enabled: false,
                  };
                });
                newEffects[oldBuildId] = oldEffects;
              }
              return { ...prev, activeEffectsByBuild: newEffects };
            });
          }
        }
      }

      if (isAgentChanging) {
        setHomeSession((prev) => ({
          ...prev,
          slotCalculatorStates: {
            ...prev.slotCalculatorStates,
            [slotIndex]: { ...defaultCalculatorState },
          },
        }));
      }

      if (newBuildId === null) {
        setHomeSession((prev) => {
          const newTeamEffects = { ...prev.teamEffects };
          const newTargeted = { ...prev.targetedEffects };

          Object.keys(newTeamEffects).forEach((effectId) => {
            const effectState = newTeamEffects[effectId];
            if (effectState.sourceSlot === slotIndex) {
              newTeamEffects[effectId] = { ...effectState, enabled: false };
            }
          });

          Object.keys(newTargeted).forEach((effectId) => {
            const effect = newTargeted[effectId];
            if (
              effect.sourceSlot === slotIndex ||
              effect.targetSlot === slotIndex
            ) {
              delete newTargeted[effectId];
            }
          });

          return {
            ...prev,
            teamEffects: newTeamEffects,
            targetedEffects: newTargeted,
          };
        });
        if (oldBuildId) {
          setHomeSession((prev) => {
            const newEffects = { ...prev.activeEffectsByBuild };
            delete newEffects[oldBuildId];
            return { ...prev, activeEffectsByBuild: newEffects };
          });
        }
      }
    };

    const emptySlotStyle = {
      backgroundImage:
        "linear-gradient(to right bottom, #ffffff10, #ffffff20, #ffffff40, #ffffff20, #ffffff10)",
    };

    const handleAnomalyResultChange = useCallback(
      (results: { anomaly: any; disorder: any }) => {
        setSlotAnomalyResults((prev) => ({
          ...prev,
          [slotIndex]: {
            anomalyResult: results.anomaly,
            disorderResult: results.disorder,
          },
        }));
      },
      [slotIndex],
    );

    if (!build) {
      return (
        <div className="team-slot">
          <div className="build-selector-wrapper">
            <div className="build-selector-block" style={emptySlotStyle}>
              <NeonSelect
                value="Seleccionar build..."
                options={[
                  { value: "", label: "Seleccionar build...", disabled: false },
                  ...builds.map((b) => {
                    const agent = agents.find((a) => a.id === b.agentId);
                    const isAlreadySelected = otherSelectedAgentIds.includes(
                      b.agentId,
                    );
                    return {
                      value: b.id,
                      label: `${b.name} ${agent ? `(${agent.displayName})` : ""}${isAlreadySelected ? " - Ya seleccionado" : ""}`,
                      disabled: isAlreadySelected,
                    };
                  }),
                ]}
                onChange={(value: string) =>
                  handleBuildChange(slotIndex, value || null)
                }
                theme="#ffffff"
                variant="default"
              />
            </div>
          </div>
          <div className="slot-agent_card-wrapper">
            <div className="slot-agent_card-block" style={emptySlotStyle}>
              {/* Imagen fullbody */}
              <img
                src={`{`${import.meta.env.BASE_URL}resources/images/agents/fullbody/test_slot.png`}
                alt={"test_slot"}
              />
              <div className="slot-agent_tag-container">
                <h3 className="slot-agent_tag-agent_no_name">{"ㅤ"}</h3>
                <div className="slot-agent_tag-agent_no_info">{"ㅤ"}</div>
              </div>
            </div>
          </div>
          {/* Stats - con valores en 0 */}
          <p className="slot-agent_stats-title">In-game Stats</p>
          <div className="no-slot-divider" />
          <div className="slot-agent_stats-wrapper">
            <div className="slot-agent_stats-block" style={emptySlotStyle}>
              <div className="slot-agent_stats-left_row">
                <p>HP: 0</p>
                <p>ATK: 0</p>
                <p>DEF: 0</p>
                <p>Impact: 0</p>
                <p>CRIT Rate: 0.0%</p>
                <p>CRIT DMG: 0.0%</p>
              </div>
              <div className="slot-agent_stats-right_row">
                <p>Anomaly Proficiency: 0</p>
                <p>Anomaly Mastery: 0</p>
                <p>PEN Ratio: 0.0%</p>
                <p>PEN: 0</p>
                <p>Energy Regen: 0.00</p>
                <p>Attribute DMG Bonus: 0.0%</p>
              </div>
            </div>
          </div>
          <p className="slot-agent_stats-title">Self Effects</p>
          <div className="no-slot-divider" />
          <div className="ingame_toggle-main_container">
            <div className="ingame_toggle-main_wrapper" style={emptySlotStyle}>
              <span className="no-effects-box">NO EFFECTS FOUND.</span>
            </div>
          </div>
          <p className="slot-agent_stats-title">Team Effects</p>
          <div className="no-slot-divider" />
          <div className="ingame_toggle-main_container">
            <div className="ingame_toggle-main_wrapper" style={emptySlotStyle}>
              <span className="no-effects-box">NO EFFECTS FOUND.</span>
            </div>
          </div>
          <p className="slot-agent_stats-title">Other Effects</p>
          <div className="no-slot-divider" />
          <div className="ingame_toggle-main_container">
            <div className="ingame_toggle-main_wrapper" style={emptySlotStyle}>
              <span className="no-effects-box">NO EFFECTS FOUND.</span>
            </div>
          </div>

          {/* ADD EMPTY BLOCKS FOR EMPTY SLOT */}
        </div>
      );
    }

    const agent = agents.find((a) => a.id === build.agentId)!;
    const engine = wEngines.find((w) => w.id === build.engineId) ?? null;

    const initialStats = calculateUnifiedStats(
      agent,
      engine,
      build.coreLevel,
      build.discs,
      {},
    );

    const getTeamStatsBySlot = (
      targetSlotIndex: number,
    ): UnifiedStats | undefined => {
      const slotInfo = teamSlotsInfo.find(
        (s: any) => s.slotIndex === targetSlotIndex,
      );
      return slotInfo?.stats;
    };

    const allEffectsForCalculation = getAllEffectsForSlot(slotIndex, build);
    const specificTeamEffects = getSpecificTeamEffects();
    Object.assign(allEffectsForCalculation, specificTeamEffects);

    const stats = calculateUnifiedStats(
      agent,
      engine,
      build.coreLevel,
      build.discs,
      allEffectsForCalculation,
      teamEffects,
      {
        hp: initialStats.hp,
        atk: initialStats.atk,
        def: initialStats.def,
        critRate: initialStats.critRate,
        anomalyMastery: initialStats.anomalyMastery,
        anomalyProficiency: initialStats.anomalyProficiency,
        energyRegen: initialStats.energyRegen,
        penRatio: initialStats.penRatio,
        impact: initialStats.impact,
      },
      targetedEffects,
      slotIndex,
      getTeamStatsBySlot,
      teamSlotsInfo,
    );

    const skinId = build.skinId || "default";
    const skin = agent.skins?.find((s) => s.id === skinId);
    const theme = agent.themeColor || "#ffffff";
    const emptyObjectsStyle = {
      backgroundImage: `linear-gradient( to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11 )`,
    };

    const getRecommendedStyle = (statName: string) => {
      if (agent.recommendedStats?.stats?.includes(statName)) {
        return { color: agent.themeColor, fontWeight: "bold" };
      }
      return {};
    };

    const ATTRIBUTE_COLORS: Record<string, string> = {
      physical: "#FFDD35FF",
      fire: "#FF4D25FF",
      ice: "#94F3F3FF",
      electric: "#36A9FCFF",
      ether: "#FF4684FF",
      wind: "#A6C5FD",
    };

    const getEffectiveElementalBonus = (
      stats: UnifiedStats,
      preferredKey?: string | null,
    ) => {
      const entries = Object.entries(stats.attributeDmgBonus)
        .filter(([key]) => key !== "lumiflux")
        .map(([key, value]) => ({ key, value }));

      if (preferredKey && entries.some((e) => e.key === preferredKey)) {
        const found = entries.find((e) => e.key === preferredKey);
        if (found && found.value === 0 && entries.every((e) => e.value === 0)) {
          return { key: "lumiflux", value: 0 };
        }
        return found || { key: preferredKey, value: 0 };
      }

      if (entries.length === 0) return { key: "physical", value: 0 };
      const best = entries.reduce((a, b) => (a.value >= b.value ? a : b));
      if (best.value === 0 && entries.every((e) => e.value === 0)) {
        return { key: "lumiflux", value: 0 };
      }
      return best;
    };

    const getElementLabel = (key: string) => {
      const labels: Record<string, string> = {
        fire: "Fire DMG Bonus",
        ice: "Ice DMG Bonus",
        electric: "Electric DMG Bonus",
        physical: "Physical DMG Bonus",
        ether: "Ether DMG Bonus",
        wind: "Wind DMG Bonus",
        lumiflux: "Lumiflux DMG Bonus",
      };
      return labels[key] || key;
    };

    const highlightAttributeDmg = (element?: string) => {
      const key = element || agent.attribute.toLowerCase();
      if (key === "lumiflux") {
        return { color: agent.themeColor || "#FEDBF3" };
      }
      const attributeColor = ATTRIBUTE_COLORS[key];
      return attributeColor ? { color: attributeColor } : {};
    };

    return (
      <div
        className="team-slot"
        style={
          {
            "--theme": theme,
            "--dominant-theme": dominantTheme,
          } as React.CSSProperties
        }
      >
        {/* Selector de build */}
        <div className="build-selector-wrapper">
          <div className="build-selector-block" style={emptyObjectsStyle}>
            <NeonSelect
              value={
                build
                  ? `${build.name} (${agent?.displayName})`
                  : "Seleccionar build..."
              }
              options={[
                { value: "", label: "Seleccionar build...", disabled: false },
                ...builds.map((b) => {
                  const agent = agents.find((a) => a.id === b.agentId);
                  const isAlreadySelected = otherSelectedAgentIds.includes(
                    b.agentId,
                  );
                  const isCurrentSelection = build?.id === b.id;
                  return {
                    value: b.id,
                    label: `${b.name} ${agent ? `(${agent.displayName})` : ""}${isAlreadySelected && !isCurrentSelection ? " - ALREADY SELECTED" : ""}`,
                    disabled: isAlreadySelected && !isCurrentSelection,
                  };
                }),
              ]}
              onChange={(value: string) =>
                handleBuildChange(slotIndex, value || null)
              }
              theme={theme}
              variant="default"
            />
          </div>
        </div>
        <div className="slot-agent_card-wrapper">
          <div className="slot-agent_card-block" style={emptyObjectsStyle}>
            {/* Imagen fullbody */}
            <img
              src={`{`${import.meta.env.BASE_URL}resources/images/agents/fullbody/${
                skin?.img || agent.id + ".png"
              }`}
              alt={agent.displayName}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.style.background = `linear-gradient(135deg, ${agent.themeColor || "#333"}22, #0a0a0a)`;
                  parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: ${agent.themeColor || "#888"}">${agent.displayName}</div>`;
                }
              }}
            />
            <div className="slot-agent_tag-container">
              <h3 className="slot-agent_tag-agent_name">{agent.displayName}</h3>
              <div className="slot-agent_tag-agent_info">
                {agent.specialty} • {agent.attributeIcon}
              </div>
            </div>
          </div>
        </div>
        <p className="slot-agent_stats-title">In-game Stats</p>
        <div className="slot-divider" />
        <div className="slot-agent_stats-wrapper">
          <div className="slot-agent_stats-block" style={emptyObjectsStyle}>
            <div className="slot-agent_stats-left_row">
              <p style={getRecommendedStyle("HP")}>
                HP: {Math.round(stats.hp)}
              </p>
              <p style={getRecommendedStyle("ATK")}>
                ATK: {Math.round(stats.atk)}
              </p>
              <p style={getRecommendedStyle("DEF")}>
                DEF: {Math.round(stats.def)}
              </p>
              <p style={getRecommendedStyle("Impact")}>
                Impact: {Math.round(stats.impact)}
              </p>
              <p style={getRecommendedStyle("CRIT Rate")}>
                CRIT Rate: {formatPercent(stats.critRate)}
              </p>
              <p style={getRecommendedStyle("CRIT DMG")}>
                CRIT DMG: {formatPercent(stats.critDmg)}
              </p>
            </div>
            <div className="slot-agent_stats-right_row">
              <p style={getRecommendedStyle("Anomaly Proficiency")}>
                Anomaly Proficiency: {Math.round(stats.anomalyProficiency)}
              </p>
              <p style={getRecommendedStyle("Anomaly Mastery")}>
                Anomaly Mastery: {Math.floor(stats.anomalyMastery)}
              </p>
              <p style={getRecommendedStyle("PEN Ratio")}>
                PEN Ratio: {formatPercent(stats.penRatio)}
              </p>
              <p style={getRecommendedStyle("PEN")}>
                PEN: {Math.round(stats.pen)}
              </p>
              {stats.energyRegen > 0 && (
                <p style={getRecommendedStyle("Energy Regen")}>
                  Energy Regen: {stats.energyRegen.toFixed(2)}
                </p>
              )}
              {"sheerForce" in stats && stats.sheerForce > 0 && (
                <p style={getRecommendedStyle("Sheer Force")}>
                  Sheer Force: {Math.round(stats.sheerForce)}
                </p>
              )}
              {/* Para Remielle, mostrar el bono del atributo fluxeado (si existe) o el mayor */}
              {agent.id === "remielle" ? (
                (() => {
                  const slotCalcState = getSlotCalculatorState(slotIndex);
                  const fluxed =
                    slotCalcState.fluxedAttributes?.[slotIndex] ?? null;
                  const best = getEffectiveElementalBonus(stats, fluxed);
                  return (
                    <p style={highlightAttributeDmg(best.key)}>
                      {getElementLabel(best.key)}:{" "}
                      {(best.value * 100).toFixed(1)}%
                    </p>
                  );
                })()
              ) : (
                <p style={highlightAttributeDmg()}>
                  {agent.attribute.charAt(0).toUpperCase() +
                    agent.attribute.slice(1)}{" "}
                  DMG Bonus:{" "}
                  {formatPercent(
                    stats.attributeDmgBonus[
                      agent.attribute.toLowerCase() as keyof typeof stats.attributeDmgBonus
                    ],
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Ingame Effects Panel */}
        <IngameEffectsPanel
          agent={agent}
          engine={engine}
          discs={build.discs}
          activeEffects={activeEffectsByBuild[build.id] ?? {}}
          setActiveEffects={(updater) => {
            const newEffects =
              typeof updater === "function"
                ? updater(activeEffectsByBuild[build.id] ?? {})
                : updater;
            setHomeSession((prev) => ({
              ...prev,
              activeEffectsByBuild: {
                ...prev.activeEffectsByBuild,
                [build.id]: newEffects,
              },
            }));
          }}
          slotIndex={slotIndex}
          teamEffects={teamEffects}
          onTeamEffectToggle={(
            effectId: string,
            enabled: boolean,
            stacks: number,
            skillLevel?: number,
            overclockLevel?: number,
          ) => {
            const ownerStats = {
              hp: initialStats.hp,
              atk: initialStats.atk,
              def: initialStats.def,
              critRate: initialStats.critRate,
              anomalyMastery: initialStats.anomalyMastery,
              energyRegen: initialStats.energyRegen,
              penRatio: initialStats.penRatio,
              impact: initialStats.impact,
            };

            const ownerInitialStats = {
              hp: initialStats.hp,
              atk: initialStats.atk,
              def: initialStats.def,
              critRate: initialStats.critRate * 100,
              anomalyMastery: initialStats.anomalyMastery,
              anomalyProficiency: initialStats.anomalyProficiency,
              energyRegen: initialStats.energyRegen,
              penRatio: initialStats.penRatio,
              impact: initialStats.impact,
            };

            handleTeamEffectToggle(
              effectId,
              enabled,
              stacks,
              slotIndex,
              agent.id,
              ownerStats,
              ownerInitialStats,
              skillLevel,
              overclockLevel,
            );
          }}
          teamSlotsInfo={teamSlotsInfo}
          onVanguardEffectChange={(vanguardSlot, enabled) => {
            handleSeedVanguardChange(slotIndex, vanguardSlot, enabled);
          }}
          onTargetEffectChange={(effectId, targetSlot, enabled) =>
            handleTargetEffectChange(effectId, targetSlot, enabled, slotIndex)
          }
          initialStats={{
            hp: initialStats.hp,
            atk: initialStats.atk,
            def: initialStats.def,
            critRate: initialStats.critRate * 100,
            anomalyMastery: initialStats.anomalyMastery,
            anomalyProficiency: initialStats.anomalyProficiency,
            energyRegen: initialStats.energyRegen,
            impact: initialStats.impact,
          }}
          activeMindscapes={build.activeMindscapes || []}
          unifiedStats={stats}
          theme={theme}
          seedVanguardEffects={homeSession.seedVanguardEffects}
          targetedEffects={homeSession.targetedEffects}
        />

        {/* Skill Calculator */}
        {agent.skills?.basicAttacks && agent.skills.basicAttacks.length > 0 && (
          <>
            {/* Obtener estado de la calculadora para este slot */}
            {(() => {
              const slotCalcState = getSlotCalculatorState(slotIndex);
              const fluxedAttribute =
                slotCalcState.fluxedAttributes?.[slotIndex] ?? null;
              const handleFluxedAttributeChange = (
                slot: number,
                attr: string | null,
              ) => {
                updateSlotCalculatorState(slotIndex, (prev) => ({
                  ...prev,
                  fluxedAttributes: prev.fluxedAttributes.map((v, i) =>
                    i === slot ? attr : v,
                  ),
                }));
              };

              return (
                <SkillCalculator
                  agent={agent}
                  unifiedStats={stats}
                  activeEffects={getAllEffectsForSlot(slotIndex, build)}
                  teamEffects={teamEffects}
                  teamSlotsInfo={teamSlotsInfo}
                  targetSlots={targetedEffects}
                  currentSlotIndex={slotIndex}
                  initialStats={{
                    hp: initialStats.hp,
                    atk: initialStats.atk,
                    def: initialStats.def,
                    energyRegen: initialStats.energyRegen,
                    anomalyProficiency: initialStats.anomalyProficiency,
                  }}
                  theme={agent?.themeColor}
                  onAnomalyResultChange={handleAnomalyResultChange}
                  slotAnomalyResults={slotAnomalyResults}
                  fluxedAttribute={fluxedAttribute}
                  onFluxedAttributeChange={handleFluxedAttributeChange}
                  calculatorState={slotCalcState}
                  onCalculatorStateChange={(updater) =>
                    updateSlotCalculatorState(slotIndex, updater)
                  }
                  skillProfiles={homeSession.skillProfiles}
                />
              );
            })()}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="main-wrapper"
      style={{ "--dominant-theme": dominantTheme } as React.CSSProperties}
    >
      {/* {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Cargando...</p>
        </div>
      )} */}
      <div className="main_section-main_wrapper">
        <div className="main_section-buttons_wrapper">
          <div
            className="main_section-buttons_block main_section-title_block"
            style={dominantEmptyStyle}
          >
            <span className="main_section-title">
              Z-Tunner: ZZZ Damage Calculator
              <div className="main_section-divider" />
            </span>
          </div>
        </div>

        <div className="main_section-buttons_wrapper">
          <div
            className="main_section-buttons_block"
            style={dominantEmptyStyle}
          >
            <button
              className="main-section-button btn-reset"
              onClick={resetAllEffects}
            >
              Reset Effects
            </button>

            <button
              className="main-section-button btn-skills"
              onClick={() => setShowSkillsProfileModal(true)}
            >
              Skills Profiles
            </button>

            <button
              className={`main-section-button ${
                isToggleDisabled
                  ? "btn-game-disabled"
                  : showGameModePanel
                    ? "btn-game-on"
                    : "btn-game-off"
              }`}
              onClick={toggleGameModePanel}
              disabled={isToggleDisabled}
              title={
                isToggleDisabled
                  ? "Cannot hide Game Mode panel while effects are active"
                  : hasActiveGameModeEffects && !showGameModePanel
                    ? "Game Mode effects are active - click to show panel"
                    : ""
              }
            >
              End Game Mode: {showGameModePanel ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
      {showGameModePanel && (
        <GameModeTogglePanel
          activeEffectId={gameModeEffectId}
          onSelectEffect={handleGameModeEffectChange}
          onTeamEffectToggle={handleTeamEffectToggle}
          slotIndex={0}
          theme={dominantTheme}
        />
      )}
      <div className="slots-carousel-wrapper">
        <div
          className="slots-track"
          style={{
            transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)`,
            transition: "transform 0.4s ease",
          }}
        >
          {[0, 1, 2].map((slotIndex) => (
            <div
              key={slotIndex}
              className="slot-item"
              style={{ flex: `0 0 ${100 / slidesToShow}%` }}
            >
              {renderSlot(slotIndex)}
            </div>
          ))}
        </div>
      </div>

      {/* GUÍA INFORMATIVA */}
      <div className="main_guide-main_wrapper">
        <div className="main_guide-guide_wrapper">
          <div className="main_guide-guide_block" style={dominantEmptyStyle}>
            <div className="guide-header">
              <h2 className="transform-title">
                Z-Tunner: ZZZ Damage Calculator Overview
              </h2>
              <div
                className="divider"
                style={{
                  backgroundColor: dominantTheme,
                  marginBottom: "2.5px",
                }}
              />
            </div>
            <div className="guide-section">
              <div className="guide-grid">
                {/* Tarjeta 1 */}
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${dominantTheme}CC`,
                    borderRight: `3px solid ${dominantTheme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">🎯</span>
                    <h4 className="guide-title">Getting Started</h4>
                  </div>

                  <p className="guide-text">
                    Each slot represents a squad member. Select a previously
                    saved build from the dropdown to load the agent and access
                    the in-game mechanics available to them. From there, adjust
                    their setup and explore how different choices influence
                    their performance during combat.
                  </p>

                  <p className="guide-tip">
                    💡 Tip: Changes made to a saved build are automatically
                    synchronized between the Build Creator and Damage
                    Calculator.
                  </p>
                </div>

                {/* Tarjeta 2 */}
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${dominantTheme}CC`,
                    borderRight: `3px solid ${dominantTheme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">⚡</span>
                    <h4 className="guide-title">Effects &amp; Team Setup</h4>
                  </div>

                  <p className="guide-text">
                    Customize your combat setup by enabling the effects and
                    bonuses that apply to each agent or your squad as a whole.
                    The calculator combines individual and team-wide effects
                    with your selected game conditions, helping you identify the
                    most effective synergies for your roster.
                  </p>

                  <p className="guide-tip">
                    💡 Tip: Effects can interact with one another, so activating
                    the right combination of buffs can be just as important as
                    increasing an agent's individual stats.
                  </p>
                </div>

                {/* Tarjeta 3 */}
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${dominantTheme}CC`,
                    borderRight: `3px solid ${dominantTheme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">📊</span>
                    <h4 className="guide-title">Damage Calculation</h4>
                  </div>

                  <p className="guide-text">
                    Evaluate your builds under controlled combat conditions and
                    see how their stats, skills, and active effects translate
                    into actual damage. The calculator considers the different
                    factors that influence the outcome, from offensive stats and
                    skill scaling to enemy Defense, Resistances, and applicable
                    damage modifiers.
                  </p>

                  <p className="guide-tip">
                    💡 Tip: You can also toggle the{" "}
                    <strong>"END GAME MODE"</strong> button to test your team's
                    damage output under high-risk game mode conditions.
                  </p>
                </div>

                {/* Tarjeta 4 */}
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${dominantTheme}CC`,
                    borderRight: `3px solid ${dominantTheme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">🌀</span>
                    <h4 className="guide-title">
                      Anomalies &amp; Other Mechanics
                    </h4>
                  </div>

                  <p className="guide-text">
                    The calculator supports every Anomaly and advanced mechanics
                    such as Disorder, Vortex, Polarity Disorder, and Luminize.
                    These mechanics feature their own unique interactions and
                    applicable bonuses, allowing you to simulate more complex
                    combat scenarios with greater accuracy.
                  </p>

                  <p className="guide-tip">
                    💡 Tip: Anomaly calculations share the same enemy and Stun
                    settings as the main damage calculation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER  */}
      <div className="main_footer-main_wrapper">
        <div className="main_footer-footer_wrapper">
          <div className="main_footer-footer_block" style={dominantEmptyStyle}>
            <div
              className="social-footer"
              style={{
                backgroundColor: `color-mix(in srgb, ${dominantTheme} 6%, transparent)`,
                border: `1px solid ${dominantTheme}22`,
                borderRadius: "10px",
                padding: "12px 20px",
              }}
            >
              <div className="social-footer-content">
                <div className="social-footer-left">
                  <span className="social-copyright">© 2026 Z-TUNNER</span>
                  <span className="social-version">v1.0.0</span>
                </div>

                <div className="social-links">
                  {/* Discord */}
                  <a
                    href="https://discord.gg/tu-invite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    title="Join our Discord"
                  >
                    <svg
                      className="social-icon"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Discord</span>
                  </a>

                  {/* Cafecito / Donaciones */}
                  <a
                    href="https://cafecito.app/tuusuario"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link donation"
                    title="Buy me a coffee"
                  >
                    <span className="donation-icon">☕</span>
                    <span>Cafecito</span>
                  </a>

                  {/* Ko-fi (alternativa) */}
                  <a
                    href="https://ko-fi.com/ztunner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link donation"
                    title="Support me on Ko-fi"
                  >
                    <span>🎁</span>
                    <span>Donate</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dots fijos en la parte inferior */}
      {slidesToShow < totalSlides && (
        <div className="carousel-dots-wrapper">
          {[0, 1, 2].map((slotIndex) => {
            const buildId = selectedBuildIds[slotIndex];
            const build = builds.find((b) => b.id === buildId);
            const agent = build
              ? agents.find((a) => a.id === build.agentId)
              : null;
            const themeColor = agent?.themeColor || "#7effdb";

            const startIndex = currentSlide;
            const endIndex = currentSlide + slidesToShow - 1;
            const isActive = slotIndex >= startIndex && slotIndex <= endIndex;

            const handleDotClick = () => {
              let targetSlide = slotIndex;
              if (targetSlide > totalSlides - slidesToShow) {
                targetSlide = totalSlides - slidesToShow;
              }
              goToSlide(targetSlide);
            };

            return (
              <span
                key={slotIndex}
                className={`carousel-dot ${isActive ? "active" : ""}`}
                onClick={handleDotClick}
                style={
                  isActive
                    ? {
                        background: themeColor,
                        boxShadow: `0 0 10px ${themeColor}`,
                      }
                    : {}
                }
              />
            );
          })}
        </div>
      )}
      <CustomPrompt
        isOpen={promptState.isOpen}
        type={promptState.type}
        title={promptState.title}
        message={promptState.message}
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={promptState.onConfirm}
        onCancel={() => setPromptState((prev) => ({ ...prev, isOpen: false }))}
        theme={dominantTheme}
      />
      <SkillsProfileModal
        open={showSkillsProfileModal}
        onClose={() => setShowSkillsProfileModal(false)}
        theme={dominantTheme}
        selectedAgentId={selectedAgentIdForProfile}
        onSelectedAgentIdChange={setSelectedAgentIdForProfile}
      />
    </div>
  );
};

export default DamageSimulator;
