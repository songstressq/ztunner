import EffectToggle from "./EffectToggle";
import { useState, useEffect } from "react";

import { collectIngameEffects } from "@/utils/collectIngameEffects";
import type { Agent } from "@/types/Agent";
import { agents } from "@/data/agents";
import type { WEngine } from "@/types/WEngine";
import type { DriveDisc } from "@/types/DriveDisc";

import ConditionalEffectToggle from "./ConditionalEffectToggle";
import WEngineEffectToggle from "./WEngineEffectToggle";

import discSets from "@/data/discSets.json";
import { getActiveSets } from "@/utils/setDetection";

import SeedVanguardSelector from "./SeedVanguardSelector";
import SlotTargetedEffectToggle from "./SlotTargetedEffectToggle";
import DynamicStatToggle from "./DynamicStatToggle";
import SlotReferenceToggle from "./SlotReferenceToggle";
import ConditionalStatToggle from "./ConditionalStatToggle";
import { InfoTooltip } from "./InfoTooltip";

interface Props {
  agent: Agent;
  engine: WEngine | null;
  discs: Record<number, DriveDisc>;
  activeEffects: Record<string, { enabled: boolean; stacks: number }>;
  setActiveEffects: React.Dispatch<
    React.SetStateAction<Record<string, { enabled: boolean; stacks: number }>>
  >;
  slotIndex: number;
  teamEffects: Record<
    string,
    {
      enabled: boolean;
      stacks: number;
      sourceSlot: number;
      ownerAgentId: string;
      skillLevel?: number;
    }
  >;
  onTeamEffectToggle?: (
    effectId: string,
    enabled: boolean,
    stacks: number,
    skillLevel?: number,
    overclockLevel?: number,
    ownerAgentId?: string,
  ) => void;

  initialStats?: {
    hp: number;
    atk: number;
    def: number;
  };

  teamSlotsInfo?: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
  }>;

  onVanguardEffectChange?: (
    vanguardSlot: number | null,
    enabled: boolean,
  ) => void;

  onTargetEffectChange?: (
    effectId: string,
    targetSlot: number | null,
    enabled: boolean,
  ) => void;

  activeMindscapes?: string[];
  unifiedStats?: UnifiedStats;
  theme?: string;
  seedVanguardEffects: Record<
    string,
    { seedSlot: number; vanguardSlot: number; enabled: boolean }
  >;
  targetedEffects: Record<
    string,
    { sourceSlot: number; targetSlot: number; enabled: boolean }
  >;
}

const IngameEffectsPanel = ({
  agent,
  engine,
  discs,
  activeEffects,
  setActiveEffects,
  slotIndex,
  teamEffects,
  onTeamEffectToggle,
  initialStats,
  teamSlotsInfo = [],
  onVanguardEffectChange,
  onTargetEffectChange,
  activeMindscapes,
  unifiedStats,
  theme = "#ffffff",
  seedVanguardEffects,
  targetedEffects,
}: Props) => {
  const effects = collectIngameEffects({
    agent,
    engine,
    discs,
    teamEffects,
    activeMindscapes,
  });

  const interactiveEffects = effects.filter((e) => !(e as any).infoOnly);
  const infoOnlyEffects = effects.filter((e) => (e as any).infoOnly);

  const sortedInteractiveEffects = [...interactiveEffects].sort((a, b) => {
    const order: Record<string, number> = {
      core: 0,
      wEngine: 1,
      discSet: 2,
      mindscape: 3,
      unknown: 4,
    };
    const sourceA = a.source || "unknown";
    const sourceB = b.source || "unknown";
    return (order[sourceA] ?? 4) - (order[sourceB] ?? 4);
  });

  const selfEffects = sortedInteractiveEffects.filter(
    (e) => e.target === "self",
  );
  const teamEffectsList = sortedInteractiveEffects.filter(
    (e) => e.target === "team",
  );

  const applicableTeamEffects = teamEffectsList.filter((effect) => {
    if (
      effect.condition?.requiresSpecialty === "Rupture" &&
      agent.specialty !== "Rupture"
    ) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const mindscapeSelfIds = new Set(
      selfEffects.filter((e) => e.source === "mindscape").map((e) => e.id),
    );

    const patch: Record<string, { enabled: boolean; stacks: number }> = {};
    let needsUpdate = false;
    for (const [id, state] of Object.entries(activeEffects)) {
      if (!state.enabled) continue;

      const effect = interactiveEffects.find((e) => e.id === id);

      if (effect?.source !== "mindscape" || effect?.target !== "self") continue;

      if (!mindscapeSelfIds.has(id)) {
        patch[id] = { enabled: false, stacks: 1 };
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setActiveEffects((prev) => ({ ...prev, ...patch }));
    }
  }, [selfEffects.map((e) => e.id).join(",")]);

  const teamEffectsIdKey = applicableTeamEffects.map((e) => e.id).join(",");

  useEffect(() => {
    if (!onTeamEffectToggle) return;

    const activeTeamMindscapeIds = Object.entries(teamEffects)
      .filter(([id, state]) => {
        if (!state.enabled) return false;
        if (state.sourceSlot !== slotIndex) return false;
        if (state.ownerAgentId !== agent.id) return false;

        const effectDef = agent.ingameEffects?.find((e: any) => e.id === id);
        return effectDef?.source === "mindscape";
      })
      .map(([id]) => id);

    const currentListIds = new Set(applicableTeamEffects.map((e) => e.id));

    for (const id of activeTeamMindscapeIds) {
      if (!currentListIds.has(id)) {
        onTeamEffectToggle(id, false, 1);
      }
    }
  }, [teamEffectsIdKey]);

  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});

  const [targetSlots, setTargetSlots] = useState<Record<string, number | null>>(
    {},
  );

  const getAvailableTargetSlots = (effect: any) => {
    const excludeOwner = effect.condition?.excludeOwner === true;
    const isSunnaWithMS6 =
      effect.id === "sunna-core_2-cuteness_is_justice" &&
      activeEffects["sunna-mindscape_6-hollow_big_bang"]?.enabled;

    const available = teamSlotsInfo
      .filter((slot) => {
        if (!isSunnaWithMS6 && slot.slotIndex === slotIndex) return false;
        if (
          excludeOwner &&
          effect.ownerAgentId === agent.id &&
          slot.slotIndex === slotIndex
        )
          return false;
        return true;
      })
      .map((slot) => ({
        slot: slot.slotIndex,
        agentName: slot.agentName,
        specialty: slot.specialty,
      }));
    return available;
  };

  const handleTargetSlotChange = (effectId: string, slot: number | null) => {
    setTargetSlots((prev) => ({
      ...prev,
      [effectId]: slot,
    }));

    if (onTargetEffectChange) {
      onTargetEffectChange(
        effectId,
        slot,
        activeEffects[effectId]?.enabled ?? false,
      );
    }
  };

  const getSelectedTargetSlot = (effectId: string) => {
    return targetSlots[effectId] ?? null;
  };

  const isSeed = agent.id === "seed";
  const [seedVanguardSlot, setSeedVanguardSlot] = useState<number | null>(null);

  useEffect(() => {
    const manualEffects = interactiveEffects.filter(
      (e) => (e as any).requiresManualTarget,
    );
    manualEffects.forEach((effect) => {
      const effectId = effect.id;
      const globalTarget = targetedEffects?.[effectId];
      const currentTarget = targetSlots[effectId];

      if (!globalTarget || !globalTarget.enabled) {
        if (currentTarget !== null) {
          setTargetSlots((prev) => ({ ...prev, [effectId]: null }));
        }
      } else if (globalTarget.targetSlot !== currentTarget) {
        setTargetSlots((prev) => ({
          ...prev,
          [effectId]: globalTarget.targetSlot,
        }));
      }
    });
  }, [targetedEffects, interactiveEffects, targetSlots]);

  useEffect(() => {
    const hasActiveVanguard = Object.values(seedVanguardEffects).some(
      (effect) => effect.seedSlot === slotIndex && effect.enabled,
    );
    if (!hasActiveVanguard && seedVanguardSlot !== null) {
      setSeedVanguardSlot(null);
    }
  }, [seedVanguardEffects, slotIndex, seedVanguardSlot]);

  useEffect(() => {
    if (seedVanguardSlot !== null) {
      const stillAvailable = getAvailableAttackSlots().some(
        (slot) => slot.slot === seedVanguardSlot,
      );
      if (!stillAvailable) {
        setSeedVanguardSlot(null);
        if (onVanguardEffectChange) {
          onVanguardEffectChange(null, false);
        }
      }
    }
  }, [teamSlotsInfo, seedVanguardSlot, onVanguardEffectChange]);

  useEffect(() => {
    const isEnabled =
      activeEffects["seed_core_flower_chain_protocol"]?.enabled ?? false;
    if (!isEnabled && seedVanguardSlot !== null) {
      setSeedVanguardSlot(null);
      if (onVanguardEffectChange) {
        onVanguardEffectChange(null, false);
      }
    }
  }, [activeEffects, seedVanguardSlot, onVanguardEffectChange]);

  useEffect(() => {
    const hasActiveTargeted = Object.values(targetedEffects || {}).some(
      (effect) => effect.targetSlot === slotIndex && effect.enabled,
    );
    if (!hasActiveTargeted) {
      setTargetSlots((prev) => {
        const newTargetSlots = { ...prev };
        let changed = false;
        Object.keys(newTargetSlots).forEach((effectId) => {
          if (newTargetSlots[effectId] === slotIndex) {
            delete newTargetSlots[effectId];
            changed = true;
          }
        });
        return changed ? newTargetSlots : prev;
      });
    }
  }, [targetedEffects, slotIndex]);

  const getAvailableAttackSlots = () => {
    return teamSlotsInfo
      .filter(
        (slot) => slot.slotIndex !== slotIndex && slot.specialty === "Attack",
      )
      .map((slot) => ({ slot: slot.slotIndex, agentName: slot.agentName }));
  };

  function toggleSelfEffect(effectId: string) {
    const effect = interactiveEffects.find((e) => e.id === effectId);

    if (effect?.baseStats) {
      const wasEnabled = activeEffects[effectId]?.enabled;
      setActiveEffects((prev) => ({
        ...prev,
        [effectId]: { enabled: !wasEnabled, stacks: 1 },
        [`${effectId}_conditional`]: { enabled: false, stacks: 1 },
      }));
    } else if (
      effect?.wEngineOverclock?.maxStacks &&
      effect.wEngineOverclock.maxStacks > 1
    ) {
      setActiveEffects((prev) => ({
        ...prev,
        [effectId]: { enabled: !prev[effectId]?.enabled, stacks: 1 },
      }));
    } else {
      const isFixedStack = effect?.maxStacks === 1;
      setActiveEffects((prev) => ({
        ...prev,
        [effectId]: {
          enabled: !prev[effectId]?.enabled,
          stacks: isFixedStack ? 1 : prev[effectId]?.stacks || 1,
        },
      }));
    }
  }

  const handleVanguardSlotChange = (slot: number | null) => {
    const oldSlot = seedVanguardSlot;
    setSeedVanguardSlot(slot);

    if (onVanguardEffectChange) {
      const isEnabled =
        activeEffects["seed_core_flower_chain_protocol"]?.enabled ?? false;

      if (oldSlot !== null) {
        onVanguardEffectChange(oldSlot, false);
      }

      if (slot !== null && isEnabled) {
        onVanguardEffectChange(slot, true);
      }
    }
  };

  const handleSeedToggle = () => {
    const wasEnabled =
      activeEffects["seed_core_flower_chain_protocol"]?.enabled ?? false;
    const willBeEnabled = !wasEnabled;

    toggleSelfEffect("seed_core_flower_chain_protocol");

    if (onVanguardEffectChange) {
      if (!willBeEnabled) {
        onVanguardEffectChange(null, false);
      } else if (willBeEnabled && seedVanguardSlot !== null) {
        onVanguardEffectChange(seedVanguardSlot, true);
      }
    }
  };

  function setSelfStacks(effectId: string, stacks: number) {
    const effect = interactiveEffects.find((e) => e.id === effectId);

    const maxStacksForEffect =
      effect?.wEngineOverclock?.maxStacks || effect?.maxStacks || 1;

    if (maxStacksForEffect === 1) {
      return;
    }

    setActiveEffects((prev) => ({
      ...prev,
      [effectId]: {
        ...prev[effectId],
        stacks: Math.max(1, Math.min(stacks, maxStacksForEffect)),
        enabled: stacks > 0,
      },
    }));
  }

  const handleSkillLevelChange = (effectId: string, level: number) => {
    setSkillLevels((prev) => ({
      ...prev,
      [effectId]: level,
    }));

    const effect = interactiveEffects.find((e) => e.id === effectId);
    if (effect?.target === "self") {
      setActiveEffects((prev) => ({
        ...prev,
        [effectId]: {
          ...prev[effectId],
          enabled: prev[effectId]?.enabled ?? false,
          stacks: prev[effectId]?.stacks ?? 1,
          skillLevel: level,
        },
      }));
    }

    if (effect?.target === "team" && onTeamEffectToggle) {
      const state = teamEffects[effectId];
      if (state) {
        onTeamEffectToggle(effectId, state.enabled, state.stacks, level);
      }
    }
  };

  const getInitialStatForEffect = (effect: any) => {
    if (!effect.conditional) return 0;

    if (teamEffects[effect.id]?.ownerInitialStats) {
      const teamEffectState = teamEffects[effect.id];
      if (teamEffectState?.ownerInitialStats) {
        switch (effect.conditional.basedOn) {
          case "hp":
            return teamEffectState.ownerInitialStats.hp || 0;
          case "atk":
            return teamEffectState.ownerInitialStats.atk || 0;
          case "def":
            return teamEffectState.ownerInitialStats.def || 0;
          case "critRate":
            const extendedOwnerStats = teamEffectState.ownerInitialStats;
            const critRateValue = extendedOwnerStats?.critRate || 0;
            return critRateValue <= 1 ? critRateValue * 100 : critRateValue;
          case "anomalyMastery":
            return teamEffectState.ownerInitialStats.anomalyMastery || 0;
          case "energyRegen":
            return teamEffectState.ownerInitialStats.energyRegen || 0;
          case "penRatio":
            const penRatioValue =
              teamEffectState.ownerInitialStats.penRatio || 0;
            return penRatioValue <= 1 ? penRatioValue * 100 : penRatioValue;
          case "impact": {
            let impactValue = initialStats?.impact ?? agent.combatBase.impact;

            const baseImpactWithoutBuffs =
              initialStats?.impact ?? agent.combatBase.impact;

            if (engine?.ingameEffects) {
              engine.ingameEffects.forEach((engineEffect: any) => {
                if (
                  engineEffect.wEngineOverclock?.levels?.[0]?.stats
                    ?.impactPercentRaw
                ) {
                  const effectState = activeEffects[engineEffect.id];

                  if (effectState?.enabled) {
                    const currentLevel =
                      engineEffect.wEngineOverclock.levels.find(
                        (l: any) =>
                          l.level === (effectState.overclockLevel || 1),
                      );

                    if (currentLevel?.stats?.impactPercentRaw) {
                      const stacks = effectState.stacks || 1;
                      const buffPercent =
                        currentLevel.stats.impactPercentRaw * stacks;

                      impactValue = impactValue * (1 + buffPercent);
                    }
                  }
                }
              });
            }

            Object.keys(activeEffects).forEach((effectId) => {
              const state = activeEffects[effectId];
              if (!state?.enabled) return;

              const eff = interactiveEffects.find((e) => e.id === effectId);

              if (eff?.id === "lighter_core_accelerant") {
                if (eff.perStack?.impactPercentRaw) {
                  const stacks = state.stacks || 1;
                  const accelerantBuff = eff.perStack.impactPercentRaw * stacks;

                  impactValue =
                    impactValue + baseImpactWithoutBuffs * accelerantBuff;
                }
              } else if (
                eff?.perStack?.impactPercentRaw &&
                eff.ownerAgentId === agent.id &&
                !(
                  eff.conditional?.type === "initialStatBased" &&
                  eff.conditional?.basedOn === "impact"
                )
              ) {
                const stacks = state.stacks || 1;
                impactValue =
                  impactValue +
                  baseImpactWithoutBuffs *
                    eff.perStack.impactPercentRaw *
                    stacks;
              }
            });
            return Math.floor(impactValue);
          }
        }
      }
    }

    if (initialStats) {
      switch (effect.conditional.basedOn) {
        case "hp":
          return initialStats.hp || 0;
        case "atk":
          return initialStats.atk || 0;
        case "def":
          return initialStats.def || 0;
        case "critRate":
          return initialStats.critRate || 0;
        case "anomalyMastery":
          return initialStats.anomalyMastery || 0;
        case "anomalyProficiency":
          return initialStats.anomalyProficiency || 0;
        case "energyRegen":
          return initialStats.energyRegen || 0;
        case "penRatio":
          const penRatioValue = initialStats.penRatio || 0;
          return penRatioValue <= 1 ? penRatioValue * 100 : penRatioValue;
        case "impact":
          return initialStats.impact || 0;
      }
    }

    return 0;
  };

  const canControlEffect = (effect: any) => {
    const agentHasEffect = agent.ingameEffects?.some(
      (e: any) => e.id === effect.id,
    );
    const engineHasEffect = engine?.ingameEffects?.some(
      (e: any) => e.id === effect.id,
    );
    const setHasEffect = (() => {
      const activeSets = getActiveSets(discs);
      for (const set of activeSets) {
        const setData = discSets.find((s: any) => s.id === set.setId);
        if (setData?.ingameEffects?.some((e: any) => e.id === effect.id)) {
          return true;
        }
      }
      return false;
    })();
    const hasEffectFromAnySource =
      agentHasEffect || engineHasEffect || setHasEffect;
    if (!hasEffectFromAnySource) return false;

    const existingState = teamEffects[effect.id];
    if (existingState) {
      if (existingState.enabled) {
        return (
          existingState.ownerAgentId === agent.id &&
          existingState.sourceSlot === slotIndex
        );
      } else {
        return true;
      }
    }
    return true;
  };

  if (
    selfEffects.length === 0 &&
    teamEffectsList.length === 0 &&
    infoOnlyEffects.length === 0
  ) {
    return null;
  }

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient(
      to right bottom, 
      ${theme}11, 
      ${theme}22, 
      ${theme}55, 
      ${theme}22, 
      ${theme}11
    )`,
  };

  return (
    <div style={{ marginTop: 12 }}>
      {/* SELF EFFECTS SECTION */}
      <div>
        <p className="slot-agent_stats-title">Self Effects</p>
        <div
          className="slot-divider"
          style={{
            background: `linear-gradient(90deg, transparent, ${agent.themeColor}, transparent)`,
            boxShadow: `0 0 6px ${agent.themeColor}, 0 0 14px ${agent.themeColor}`,
            filter: "brightness(0.75)",
          }}
        />

        {isSeed &&
          agent.ingameEffects?.some((e: any) => e.requiresManualVanguard) && (
            <SeedVanguardSelector
              enabled={
                activeEffects["seed_core_flower_chain_protocol"]?.enabled ??
                false
              }
              onToggle={handleSeedToggle}
              selectedVanguardSlot={seedVanguardSlot}
              onVanguardSlotChange={handleVanguardSlotChange}
              availableAttackSlots={getAvailableAttackSlots()}
              theme={agent.themeColor}
              ownerAgentId={agent.id}
              ownerDisplayName={agent.displayName}
            />
          )}

        {selfEffects.length > 0 ? (
          selfEffects.map((effect) => {
            const state = activeEffects[effect.id] ?? {
              enabled: false,
              stacks: 1,
              overclockLevel: 1,
            };

            if (
              (effect as any).requiresManualTarget &&
              effect.referenceStatEffect
            ) {
              return (
                <SlotReferenceToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  onToggle={() => {
                    const newEnabled = !state.enabled;
                    toggleSelfEffect(effect.id);
                    if (!newEnabled) {
                      handleTargetSlotChange(effect.id, null);
                    }
                  }}
                  onTargetSlotChange={(slot) =>
                    handleTargetSlotChange(effect.id, slot)
                  }
                  targetSlots={getAvailableTargetSlots(effect)}
                  selectedTargetSlot={targetSlots[effect.id] ?? null}
                  teamSlotsInfo={teamSlotsInfo}
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                  ownerAgentId={agent.id}
                  ownerDisplayName={agent.displayName}
                />
              );
            }

            if ((effect as any).requiresManualTarget) {
              const applyToSelectedOnly =
                effect.condition?.applyToSelectedOnly === true;
              return (
                <SlotTargetedEffectToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  stacks={state.stacks}
                  onToggle={() => {
                    const newEnabled = !state.enabled;
                    toggleSelfEffect(effect.id);
                    if (!newEnabled) {
                      handleTargetSlotChange(effect.id, null);
                    }
                  }}
                  onStacksChange={(stacks) => setSelfStacks(effect.id, stacks)}
                  onTargetSlotChange={(slot) =>
                    handleTargetSlotChange(effect.id, slot)
                  }
                  targetSlots={getAvailableTargetSlots(effect)}
                  selectedTargetSlot={targetSlots[effect.id] ?? null}
                  disabled={false}
                  showOwnerIcon={true}
                  isForSelectedOnly={applyToSelectedOnly}
                  theme={agent.themeColor}
                  ownerAgentId={agent.id}
                  ownerDisplayName={agent.displayName}
                />
              );
            }

            if (effect.wEngineOverclock) {
              return (
                <WEngineEffectToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  stacks={state.stacks}
                  overclockLevel={state.overclockLevel || 1}
                  onToggle={() => toggleSelfEffect(effect.id)}
                  onStacksChange={(stacks) => setSelfStacks(effect.id, stacks)}
                  onOverclockChange={(level) =>
                    setActiveEffects((prev) => ({
                      ...prev,
                      [effect.id]: {
                        ...prev[effect.id],
                        overclockLevel: level,
                      },
                    }))
                  }
                  agentSpecialty={agent.specialty}
                  theme={agent.themeColor}
                  showOwnerIcon={true}
                  ownerAgentId={agent.id}
                  ownerDisplayName={agent.displayName}
                />
              );
            }

            if (
              (effect as any).requiresManualTarget &&
              effect.target === "self"
            ) {
              return <SlotTargetedEffectToggle key={`self-${effect.id}`} />;
            } else if (
              (effect as any).requiresManualTarget &&
              effect.target === "team"
            ) {
              const isOwner = canControlEffect(effect);
              const state = teamEffects[effect.id] ?? {
                enabled: false,
                stacks: 1,
                sourceSlot: slotIndex,
                skillLevel: 1,
              };

              return (
                <SlotTargetedEffectToggle
                  key={`team-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  stacks={state.stacks}
                  onToggle={() => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(
                        effect.id,
                        !state.enabled,
                        state.stacks,
                      );
                    }
                  }}
                  onStacksChange={(stacks) => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(effect.id, state.enabled, stacks);
                    }
                  }}
                  onTargetSlotChange={(slot) => {
                    handleTargetSlotChange(effect.id, slot);
                  }}
                  targetSlots={getAvailableTargetSlots(effect)}
                  selectedTargetSlot={targetSlots[effect.id] ?? null}
                  disabled={!isOwner}
                  sourceNote={
                    !isOwner ? `From Slot ${state.sourceSlot + 1}` : undefined
                  }
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                  ownerAgentId={agent.id}
                  ownerDisplayName={agent.displayName}
                />
              );
            }
            if (effect.dynamicStatBonuses) {
              return (
                <DynamicStatToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  onToggle={() => toggleSelfEffect(effect.id)}
                  unifiedStats={unifiedStats!}
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                  ownerAgentId={agent.id}
                  ownerDisplayName={agent.displayName}
                />
              );
            }

            if (
              effect.conditional?.type === "initialStatBased" ||
              effect.conditional?.type === "initialStatBasedDamageBonus" ||
              effect.conditional?.type === "skillLevelBased" ||
              effect.conditional?.type === "currentStatBased"
            ) {
              return (
                <ConditionalEffectToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  onToggle={() => toggleSelfEffect(effect.id)}
                  onSkillLevelChange={(level) =>
                    handleSkillLevelChange(effect.id, level)
                  }
                  initialStatValue={getInitialStatForEffect(effect)}
                  unifiedStats={unifiedStats}
                  currentSkillLevel={skillLevels[effect.id] || 1}
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                />
              );
            }

            if (effect.baseStats) {
              const state = activeEffects[effect.id] ?? {
                enabled: false,
                stacks: 1,
              };
              const conditionalState = activeEffects[
                `${effect.id}_conditional`
              ] ?? { enabled: false, stacks: 1 };

              return (
                <ConditionalStatToggle
                  key={`self-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  onToggle={() => toggleSelfEffect(effect.id)}
                  conditionalEnabled={conditionalState.enabled}
                  onConditionalToggle={(enabled) => {
                    setActiveEffects((prev) => ({
                      ...prev,
                      [`${effect.id}_conditional`]: { enabled, stacks: 1 },
                    }));
                  }}
                  showOwnerIcon={true}
                  disabled={false}
                />
              );
            }

            return (
              <EffectToggle
                key={`self-${effect.id}`}
                effect={effect}
                enabled={state.enabled}
                stacks={state.stacks}
                onToggle={() => toggleSelfEffect(effect.id)}
                onStacksChange={(stacks) => setSelfStacks(effect.id, stacks)}
                showOwnerIcon={true}
                theme={agent.themeColor}
                ownerAgentId={agent.id}
                ownerDisplayName={agent.displayName}
              />
            );
          })
        ) : (
          <div className="ingame_toggle-main_container">
            <div
              className="ingame_toggle-main_wrapper"
              style={emptyObjectsStyle}
            >
              <span className="no-effects-box">NO EFFECTS FOUND.</span>
            </div>
          </div>
        )}
      </div>

      {/* TEAM EFFECTS SECTION */}
      <div>
        <p className="slot-agent_stats-title">Team Effects</p>
        <div
          className="slot-divider"
          style={{
            background: `linear-gradient(90deg, transparent, ${agent.themeColor}, transparent)`,
            boxShadow: `0 0 6px ${agent.themeColor}, 0 0 14px ${agent.themeColor}`,
            filter: "brightness(0.75)",
          }}
        />

        {teamEffectsList.length > 0 ? (
          teamEffectsList.map((effect) => {
            const isOwner = canControlEffect(effect);
            const isGameMode = effect.source === "gameMode";
            const state = teamEffects[effect.id] ?? {
              enabled: false,
              stacks: 1,
              sourceSlot: slotIndex,
              skillLevel: 1,
            };

            const actualOwnerAgentId =
              effect.ownerAgentId || state.ownerAgentId;
            const actualOwnerDisplayName =
              effect.ownerDisplayName || state.ownerDisplayName;

            const ownerAgentId =
              effect.ownerAgentId || teamEffects[effect.id]?.ownerAgentId;
            const ownerAgent = agents.find((a) => a.id === ownerAgentId);
            const ownerName =
              ownerAgent?.displayName ||
              effect.ownerDisplayName ||
              ownerAgentId ||
              "Unknown";

            if (effect.wEngineOverclock) {
              const teamEffectState = teamEffects[effect.id] ?? {
                enabled: false,
                stacks: 1,
                sourceSlot: slotIndex,
                skillLevel: 1,
                overclockLevel: 1,
              };

              return (
                <WEngineEffectToggle
                  key={`team-${effect.id}`}
                  effect={effect}
                  enabled={teamEffectState.enabled}
                  stacks={teamEffectState.stacks}
                  overclockLevel={teamEffectState.overclockLevel || 1}
                  onToggle={() => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(
                        effect.id,
                        !teamEffectState.enabled,
                        teamEffectState.stacks,
                        undefined,
                        teamEffectState.overclockLevel || 1,
                        agent.id,
                      );
                    }
                  }}
                  onStacksChange={(stacks) => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(
                        effect.id,
                        teamEffectState.enabled,
                        stacks,
                        undefined,
                        teamEffectState.overclockLevel || 1,
                        agent.id,
                      );
                    }
                  }}
                  onOverclockChange={(level) => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(
                        effect.id,
                        teamEffectState.enabled,
                        teamEffectState.stacks,
                        undefined,
                        level,
                        agent.id,
                      );
                    }
                  }}
                  agentSpecialty={agent.specialty}
                  disabled={isGameMode || !isOwner}
                  sourceNote={
                    isGameMode
                      ? "Game Mode"
                      : !isOwner
                        ? `Slot ${state.sourceSlot + 1} (${teamSlotsInfo.find((slot) => slot.slotIndex === state.sourceSlot)?.agentName || "Unknown"})`
                        : undefined
                  }
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                  ownerAgentId={ownerAgentId ?? agent.id}
                  ownerDisplayName={ownerName ?? agent.displayName}
                />
              );
            }

            if ((effect as any).requiresManualTarget) {
              return null;
            }

            if (
              effect.conditional?.type === "initialStatBased" ||
              effect.conditional?.type === "initialStatBasedDamageBonus" ||
              effect.conditional?.type === "skillLevelBased" ||
              effect.conditional?.type === "currentStatBased"
            ) {
              const isTeamEffectFromOther =
                effect.target === "team" && !isOwner;

              if (
                isTeamEffectFromOther &&
                effect.conditional.type === "currentStatBased"
              ) {
                const ownerAgentId =
                  effect.ownerAgentId || teamEffects[effect.id]?.ownerAgentId;

                const ownerAgent = agents.find((a) => a.id === ownerAgentId);
                const ownerName =
                  ownerAgent?.displayName ||
                  effect.ownerDisplayName ||
                  ownerAgentId ||
                  "Unknown";

                return (
                  <div
                    key={`team-simple-${effect.id}`}
                    className="ingame_toggle-main_container"
                    style={{ opacity: 0.8 }}
                  >
                    <div
                      className="ingame_toggle-main_wrapper"
                      style={{
                        backgroundImage: `linear-gradient(to right bottom, ${agent.themeColor}11, ${agent.themeColor}22, ${agent.themeColor}55, ${agent.themeColor}22, ${agent.themeColor}11)`,
                      }}
                    >
                      {/* Header */}
                      <div className="ingame_toggle-first_row">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {ownerAgentId && (
                            <div className="ingame_toggle-agent_icon">
                              <img
                                src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${ownerAgentId}.png`}
                                alt={ownerName}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <div className="ingame_toggle-title-section">
                            <strong>{effect.label}</strong>
                          </div>
                        </div>
                        {effect.description && (
                          <InfoTooltip
                            content={`${effect.label}\n\n${effect.description}`}
                            theme={agent.themeColor}
                          />
                        )}
                      </div>

                      {/* Descripción */}
                      <div className="ingame_toggle-description_section">
                        <p>{effect.shortDescription || effect.description}</p>
                      </div>

                      {/* Mensaje de control */}
                      <div className="ingame_toggle-controls_section">
                        <div className="ingame_toggle-disabled_section">
                          <p>
                            Calculated dynamically from {ownerName}'s{" "}
                            {effect.conditional.basedOn}
                            <br /> <br />
                            (From Slot {state.sourceSlot + 1}) • Controlled by
                            another slot
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (
                effect.target === "team" &&
                effect.conditional.basedOn === "impact" &&
                !isOwner
              ) {
                return (
                  <div
                    key={`team-simple-${effect.id}`}
                    className="ingame_toggle-main_container"
                    style={{ opacity: 0.8 }}
                  >
                    <div
                      className="ingame_toggle-main_wrapper"
                      style={{
                        backgroundImage: `linear-gradient(to right bottom, ${agent.themeColor}11, ${agent.themeColor}22, ${agent.themeColor}55, ${agent.themeColor}22, ${agent.themeColor}11)`,
                      }}
                    >
                      {/* Header */}
                      <div className="ingame_toggle-first_row">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {ownerAgentId && (
                            <div className="ingame_toggle-agent_icon">
                              <img
                                src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${ownerAgentId}.png`}
                                alt={ownerName}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <div className="ingame_toggle-title-section">
                            <strong>{effect.label}</strong>
                          </div>
                        </div>
                        {effect.description && (
                          <InfoTooltip
                            content={`${effect.label}\n\n${effect.description}`}
                            theme={agent.themeColor}
                          />
                        )}
                      </div>

                      {/* Descripción */}
                      <div className="ingame_toggle-description_section">
                        <p>{effect.shortDescription || effect.description}</p>
                      </div>

                      {/* Mensaje de control */}
                      <div className="ingame_toggle-controls_section">
                        <div className="ingame_toggle-disabled_section">
                          <p>
                            Calculated dynamically from {ownerName}'s Impact
                            <br />
                            <br />
                            (From Slot {state.sourceSlot + 1}) • Controlled by
                            another slot
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <ConditionalEffectToggle
                  key={`team-${effect.id}`}
                  effect={effect}
                  enabled={state.enabled}
                  onToggle={() => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(
                        effect.id,
                        !state.enabled,
                        state.stacks,
                        undefined,
                        undefined,
                        agent.id,
                      );
                    }
                  }}
                  onSkillLevelChange={(level) => {
                    if (isOwner) {
                      handleSkillLevelChange(effect.id, level);
                      if (onTeamEffectToggle) {
                        onTeamEffectToggle(
                          effect.id,
                          state.enabled,
                          state.stacks,
                          level,
                          undefined,
                          agent.id,
                        );
                      }
                    }
                  }}
                  initialStatValue={getInitialStatForEffect(effect)}
                  unifiedStats={unifiedStats}
                  ownerStats={
                    isTeamEffectFromOther
                      ? teamEffects[effect.id]?.ownerCurrentStats
                      : undefined
                  }
                  currentSkillLevel={
                    state.skillLevel || skillLevels[effect.id] || 1
                  }
                  disabled={isGameMode || !isOwner}
                  sourceNote={
                    isGameMode
                      ? "Game Mode"
                      : !isOwner
                        ? `Slot ${state.sourceSlot + 1} (${teamSlotsInfo.find((slot) => slot.slotIndex === state.sourceSlot)?.agentName || "Unknown"})`
                        : undefined
                  }
                  showOwnerIcon={true}
                  theme={agent.themeColor}
                />
              );
            }

            const handleStacksChange =
              effect.maxStacks === 1
                ? undefined
                : (stacks: number) => {
                    if (onTeamEffectToggle && isOwner) {
                      onTeamEffectToggle(effect.id, state.enabled, stacks);
                    }
                  };

            return (
              <EffectToggle
                key={`team-${effect.id}`}
                effect={effect}
                enabled={state.enabled}
                stacks={state.stacks}
                onToggle={() => {
                  if (onTeamEffectToggle && isOwner) {
                    onTeamEffectToggle(
                      effect.id,
                      !state.enabled,
                      state.stacks,
                      undefined,
                      undefined,
                      agent.id,
                    );
                  }
                }}
                onStacksChange={handleStacksChange}
                disabled={isGameMode || !isOwner}
                sourceNote={
                  isGameMode
                    ? "Game Mode"
                    : !isOwner
                      ? `Slot ${state.sourceSlot + 1} (${teamSlotsInfo.find((slot) => slot.slotIndex === state.sourceSlot)?.agentName || "Unknown"})`
                      : undefined
                }
                showOwnerIcon={true}
                theme={agent.themeColor}
                ownerAgentId={actualOwnerAgentId}
                ownerDisplayName={actualOwnerDisplayName}
              />
            );
          })
        ) : (
          <div className="ingame_toggle-main_container">
            <div
              className="ingame_toggle-main_wrapper"
              style={emptyObjectsStyle}
            >
              <span className="no-effects-box">NO EFFECTS FOUND.</span>
            </div>
          </div>
        )}
      </div>

      {/* INFO ONLY EFFECTS SECTION */}
      {infoOnlyEffects.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 className="slot-agent_stats-title">Other Effects</h4>
          <div
            className="slot-divider"
            style={{
              background: `linear-gradient(90deg, transparent, ${agent.themeColor}, transparent)`,
              boxShadow: `0 0 6px ${agent.themeColor}, 0 0 14px ${agent.themeColor}`,
              filter: "brightness(0.75)",
            }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {infoOnlyEffects
              .filter((effect) => {
                if (isSeed && effect.id === "seed_core_flower_chain_protocol") {
                  return false;
                }
                return true;
              })
              .map((effect) => (
                <div
                  key={`info-${effect.id}`}
                  className="ingame_toggle-main_container"
                >
                  <div
                    className="ingame_toggle-main_wrapper"
                    style={{
                      backgroundImage: `linear-gradient(to right bottom, ${agent.themeColor}11, ${agent.themeColor}22, ${agent.themeColor}55, ${agent.themeColor}22, ${agent.themeColor}11)`,
                      backgroundColor: "rgba(51, 53, 52, 0.6)",
                    }}
                  >
                    {/* Header */}
                    <div className="ingame_toggle-first_row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        {/* ⭐ ICONO DEL AGENTE */}
                        {effect.ownerAgentId && (
                          <div className="ingame_toggle-agent_icon">
                            <img
                              src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${effect.ownerAgentId}.png`}
                              alt={
                                effect.ownerDisplayName || effect.ownerAgentId
                              }
                              title={
                                effect.ownerDisplayName || effect.ownerAgentId
                              }
                              onError={(e) => {
                                console.warn(
                                  `Failed to load agent icon: ${effect.ownerAgentId}`,
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="ingame_toggle-title-section">
                          <strong>{effect.label}</strong>
                          {effect.condition?.requiresSpecialty && (
                            <div
                              className="ingame_toggle-agent_specialty"
                              style={{
                                color: "#7EFFDB",
                                backgroundColor: "#1a3a2a",
                              }}
                            >
                              <img
                                src={`{`${import.meta.env.BASE_URL}resources/images/icons/specialties/${effect.condition.requiresSpecialty}.png`}
                                alt={effect.condition.requiresSpecialty}
                                style={{ width: "14px", height: "14px" }}
                              />
                              {effect.condition.requiresSpecialty}
                            </div>
                          )}
                        </div>
                      </div>
                      {effect.description && (
                        <InfoTooltip
                          content={`${effect.label}\n\n${effect.description}`}
                          theme={agent.themeColor}
                        />
                      )}
                    </div>

                    {/* Descripción */}
                    <div className="ingame_toggle-description_section">
                      <p>{effect.shortDescription || effect.description}</p>
                    </div>

                    {/* Información adicional 
                    <div className="ingame_toggle-controls_section">
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(255, 255, 255, 0.5)",
                          padding: "4px 0",
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          Target: {effect.target === "self" ? "Self" : "Team"}
                        </span>
                        {effect.maxStacks && (
                          <span>• Max Stacks: {effect.maxStacks}</span>
                        )}
                        {effect.source && (
                          <span>• Source: {effect.source}</span>
                        )}
                      </div>
                    </div>*/}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngameEffectsPanel;
