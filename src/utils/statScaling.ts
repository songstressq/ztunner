import type { WEngine } from "@/types/WEngine";
import type { Agent, UnifiedStats } from "@/types/Agent";
import type { DriveDisc } from "@/types/DriveDisc";
import discSets from "@/data/discSets.json";
import { getActiveSets } from "@/utils/setDetection";
import { effectToModifier } from "@/utils/effectsToModifiers";
import { applyModifiers } from "@/utils/applyModifiers";
import { ingameEffectsRegistry } from "@/data/ingameEffectsRegistry";

const ELEMENT_KEYS = {
  "Fire DMG Bonus%": "fire",
  "Ice DMG Bonus%": "ice",
  "Ether DMG Bonus%": "ether",
  "Physical DMG Bonus%": "physical",
  "Electric DMG Bonus%": "electric",
  "Wind DMG Bonus%": "wind",
} as const;

type ElementKey = keyof typeof ELEMENT_KEYS;

export function getWEngineStats(engine: WEngine) {
  return {
    base: engine.stats.base,
    adv: engine.stats.advanced,
  };
}

function norm(value: number): number {
  if (!value || Number.isNaN(value)) return 0;
  return value;
}

function applySkillLevelBasedBonus(
  base: UnifiedStats,
  effect: any,
  skillLevel: number,
  teamEffectsData?: Record<string, any>,
  agent?: Agent,
) {
  if (!effect.conditional?.skillBonusTable) return;
  const currentLevel = effect.conditional.skillBonusTable.find(
    (l: any) => l.level === skillLevel,
  );
  if (!currentLevel) return;
  if (currentLevel.critDmg) {
    base.critDmg += currentLevel.critDmg;
  }
  if (currentLevel.dmgBonus) {
    for (const key in base.attributeDmgBonus) {
      base.attributeDmgBonus[key as keyof typeof base.attributeDmgBonus] +=
        currentLevel.dmgBonus;
    }
  }
  if (currentLevel.impactPercentRaw) {
    if (!base._impactPercentRawBonus) base._impactPercentRawBonus = 0;
    base._impactPercentRawBonus += currentLevel.impactPercentRaw;
  }
}

const STAT_KEY_MAP: Record<string, keyof UnifiedStats> = {
  HP: "hpFlat",
  ATK: "atkFlat",
  DEF: "defFlat",
  PEN: "pen",
  Impact: "impact",
  "HP%": "hpPercent",
  "ATK%": "atkPercent",
  "DEF%": "defPercent",
  "PEN Ratio%": "penRatio",
  "Impact%": "impact",
  "CRIT Rate%": "critRate",
  "Crit Rate": "critRate",
  "CRIT DMG%": "critDmg",
  "Crit DMG": "critDmg",
  "Anomaly Proficiency": "anomalyProficiency",
  "Anomaly Mastery": "anomalyMastery",
  "Anomaly Mastery%": "anomalyMasteryPercent",
  "Energy Regen": "energyRegenFlat",
  "Energy Regen%": "energyRegenPercent",
  "Fire DMG Bonus%": "attributeDmgBonus",
  "Ice DMG Bonus%": "attributeDmgBonus",
  "Electric DMG Bonus%": "attributeDmgBonus",
  "Ether DMG Bonus%": "attributeDmgBonus",
  "Physical DMG Bonus%": "attributeDmgBonus",
};

function applyStatFromKey(base: UnifiedStats, key: string, raw: number) {
  const value = norm(raw);
  switch (key) {
    case "atk":
      base.atk += value;
      break;
    case "atkFlat":
      base.atk += value;
      break;
    case "atkPercent":
      base.atkPercent = (base.atkPercent ?? 0) + value;
      break;
    case "hp":
      base.hp += value;
      break;
    case "hpFlat":
      base.hp += value;
      break;
    case "hpPercent":
      base.hpPercent = (base.hpPercent ?? 0) + value;
      break;
    case "def":
      base.def += value;
      break;
    case "defFlat":
      base.def += value;
      break;
    case "defPercent":
      base.defPercent = (base.defPercent ?? 0) + value;
      break;
    case "critRate":
      base.critRate += value;
      break;
    case "critDmg":
      base.critDmg += value;
      break;
    case "anomalyProficiency":
      base.anomalyProficiency += value;
      break;
    case "anomalyMastery":
    case "anomalyMasteryPercent":
      base.anomalyMastery += value;
      break;
    case "penRatio":
      base.penRatio += value;
      break;
    case "pen":
      base.pen += value;
      break;
    case "energyRegenFlat":
      base.energyRegen += value;
      break;
    case "defShred":
      if (!base._defShredBonus) base._defShredBonus = 0;
      base._defShredBonus += value;
      break;
    case "refringeCoefficient":
      if (!base._refringeCoefficient) base._refringeCoefficient = 0;
      base._refringeCoefficient += value;
      break;
    case "luminizeMultiplierBonus":
      if (!base._luminizeMultiplierBonus) base._luminizeMultiplierBonus = 0;
      base._luminizeMultiplierBonus += value;
      break;
    default:
  }
}

function calculateConditionalBonus(
  effect: any,
  initialStat: number,
  skillLevel: number = 1,
): number {
  if (!effect.conditional || effect.conditional.type !== "initialStatBased") {
    return 0;
  }
  const {
    basedOn,
    maxStat = Infinity,
    baseBonus = 0,
    perUnit = 1,
    skillLevels,
    threshold = 0,
  } = effect.conditional;

  if (effect.useManualThresholds) {
    const currentLevel = skillLevels?.find((l: any) => l.level === skillLevel);
    if (!currentLevel) return baseBonus;
    return currentLevel.maxBonus;
  }

  const currentLevel =
    skillLevels?.find((l: any) => l.level === skillLevel) || skillLevels?.[0];
  if (!currentLevel) return 0;

  const levelBaseBonus =
    currentLevel.baseBonus !== undefined ? currentLevel.baseBonus : baseBonus;
  const perUnitBonus = currentLevel.perUnitBonus || 0;

  let cappedStat: number;
  switch (basedOn) {
    case "critRate":
      let critRatePercent;
      if (initialStat <= 1.5) {
        critRatePercent = initialStat * 100;
      } else {
        critRatePercent = initialStat;
      }
      const excessCritRate = Math.max(0, critRatePercent - threshold);
      cappedStat =
        maxStat !== 99999 ? Math.min(excessCritRate, maxStat) : excessCritRate;
      break;
    case "anomalyMastery":
      const excessAnomalyMastery = Math.max(0, initialStat - threshold);
      cappedStat =
        maxStat !== 99999
          ? Math.min(excessAnomalyMastery, maxStat)
          : excessAnomalyMastery;
      break;
    case "anomalyProficiency":
      const excessAnomalyProficiency = Math.max(0, initialStat - threshold);
      cappedStat =
        maxStat !== 99999
          ? Math.min(excessAnomalyProficiency, maxStat)
          : excessAnomalyProficiency;
      break;
    case "energyRegen": {
      const excessEnergyRegen = Math.max(0, initialStat - threshold);
      const roundedExcess = Math.round(excessEnergyRegen * 100) / 100;
      const cappedExcess =
        maxStat !== 99999 ? Math.min(roundedExcess, maxStat) : roundedExcess;
      cappedStat = cappedExcess;
      break;
    }
    case "penRatio":
      const penRatioPercent = initialStat * 100;
      const excessPenRatio = Math.max(0, penRatioPercent - (threshold || 0));
      cappedStat =
        maxStat !== 99999 ? Math.min(excessPenRatio, maxStat) : excessPenRatio;
      break;
    default:
      const excessStat = Math.max(0, initialStat - threshold);
      cappedStat =
        maxStat !== Infinity ? Math.min(excessStat, maxStat) : excessStat;
  }

  let units: number;
  if (basedOn === "penRatio") {
    units = cappedStat / perUnit;
  } else if (basedOn === "energyRegen") {
    const roundedStat = Math.round(cappedStat * 100) / 100;
    units = Math.round(roundedStat / perUnit);
  } else {
    const roundedStat = Math.round(cappedStat * 100) / 100;
    units = Math.floor(roundedStat / perUnit);
  }
  const fromStat = units * perUnitBonus;
  const total = levelBaseBonus + fromStat;
  return currentLevel.maxBonus !== 99999
    ? Math.min(total, currentLevel.maxBonus)
    : total;
}

function calculateCurrentStatBonus(
  effect: any,
  currentStatValue: number,
): { bonusValue: number; maxReached: boolean } {
  if (!effect.conditional || effect.conditional.type !== "currentStatBased") {
    return { bonusValue: 0, maxReached: false };
  }
  const {
    threshold = 0,
    perUnit = 1,
    perUnitBonus = 0,
    maxBonus = Infinity,
    baseBonus = 0,
  } = effect.conditional;

  const excess = Math.max(0, currentStatValue - threshold);
  const units = Math.floor(excess / perUnit);
  let bonusValue = units * perUnitBonus + (baseBonus || 0);
  let maxReached = false;

  if (maxBonus !== Infinity) {
    maxReached = bonusValue >= maxBonus;
    bonusValue = Math.min(bonusValue, maxBonus);
  }

  return { bonusValue, maxReached };
}

export function calculateUnifiedStats(
  agent: Agent,
  engine: WEngine | null,
  coreLevel: number,
  discs: Record<number, DriveDisc>,
  activeEffects: Record<string, { enabled: boolean; stacks: number }> = {},
  teamEffects: Record<string, any> = {},
  preCalculatedInitialStats?: {
    hp?: number;
    atk?: number;
    def?: number;
    critRate?: number;
    anomalyMastery?: number;
    anomalyProficiency?: number;
    energyRegen?: number;
    penRatio?: number;
    impact?: number;
  },
  targetedEffects: Record<
    string,
    { sourceSlot: number; targetSlot: number; enabled: boolean }
  > = {},
  currentSlotIndex: number = 0,
  getTeamStatsBySlot?: (slotIndex: number) => UnifiedStats | undefined,
  teamSlotsInfo: Array<{
    slotIndex: number;
    agentName: string;
    specialty: string;
  }> = [],
): UnifiedStats {
  const teamEffectsData = teamEffects || {};

  const base: UnifiedStats = {
    hp: agent.baseStats.hp,
    atk: agent.baseStats.atk,
    def: agent.baseStats.def,
    impact: 0,
    critRate: agent.combatBase.critRate,
    critDmg: agent.combatBase.critDmg,
    anomalyProficiency: agent.combatBase.anomalyProficiency,
    anomalyMastery: agent.combatBase.anomalyMastery,
    penRatio: agent.combatBase.penRatio,
    pen: agent.combatBase.pen,
    energyRegen: agent.combatBase.energyRegen,
    attributeDmgBonus: { ...agent.combatBase.attributeDmgBonus },
    sheerForce: 0,
  };

  if (agent.specialty === "Rupture") {
    (base as any).__isRuptureAgent = true;
  }

  const impactBase = agent.combatBase.impact;

  let impactMul = 0;
  let impactFlat = 0;
  let impactFlatRaw = 0;
  let energyRegenMul = 0;
  let hpPercent = 0,
    atkPercent = 0,
    defPercent = 0;
  let flatHP = 0,
    flatATK = 0,
    flatDEF = 0;
  let critRateAdd = 0,
    critDmgAdd = 0;
  let anomalyMasteryMul = 0;
  let penRatioAdd = 0;
  let impactPercentRaw = 0;
  let atkFlatRawTotal = 0;
  let atkPercentRawTotal = 0;
  let hpFlatRawTotal = 0;
  let hpPercentRawTotal = 0;
  let defFlatRawTotal = 0;
  let defPercentRawTotal = 0;

  for (let i = 0; i <= coreLevel; i++) {
    const entry = agent.coreEnhancement[i];
    if (!entry?.stats) continue;

    for (const k in entry.stats) {
      const val = (entry.stats as any)[k];
      if (k === "hpPercent") {
        hpPercent += val;
        continue;
      }
      if (k === "atkPercent") {
        atkPercent += val;
        continue;
      }
      if (k === "defPercent") {
        defPercent += val;
        continue;
      }
      if (k === "impact") {
        impactFlat += norm(val);
        continue;
      }
      if (k === "impactPercent" || k === "impact%") {
        impactMul += norm(val);
        continue;
      }
      if (k === "energyRegenPercent") {
        energyRegenMul += val;
        continue;
      }
      applyStatFromKey(base, k, val);
    }
  }

  if (engine) {
    const eng = getWEngineStats(engine);

    if (engine.baseStatType === "ATK") base.atk += norm(eng.base);
    else if (engine.baseStatType === "HP") base.hp += norm(eng.base);
    else if (engine.baseStatType === "DEF") base.def += norm(eng.base);
    else {
      const mapped = STAT_KEY_MAP[engine.baseStatType];
      if (mapped) applyStatFromKey(base, mapped, eng.base);
    }

    if (engine.advancedStatType === "Energy Regen%") {
      energyRegenMul += norm(eng.adv);
    } else if (engine.advancedStatType === "Energy Regen") {
      base.energyRegen += norm(eng.adv);
    } else if (engine.advancedStatType === "Impact%") {
      impactMul += norm(eng.adv);
    } else if (engine.advancedStatType === "Impact") {
      impactFlat += norm(eng.adv);
    } else if (engine.advancedStatType === "ATK%") {
      atkPercent += norm(eng.adv);
    } else if (engine.advancedStatType === "HP%") {
      hpPercent += norm(eng.adv);
    } else if (engine.advancedStatType === "DEF%") {
      defPercent += norm(eng.adv);
    } else if (engine.advancedStatType === "Anomaly Mastery%") {
      anomalyMasteryMul += norm(eng.adv);
    } else {
      const advKey = STAT_KEY_MAP[engine.advancedStatType];
      if (advKey) applyStatFromKey(base, advKey, eng.adv);
    }
  }

  for (const d of Object.values(discs)) {
    const stats = [d.main, ...d.substats];
    for (const s of stats) {
      const v = norm(s.value);
      switch (s.type) {
        case "HP":
          flatHP += v;
          break;
        case "ATK":
          flatATK += v;
          break;
        case "DEF":
          flatDEF += v;
          break;
        case "HP%":
          hpPercent += v;
          break;
        case "ATK%":
          atkPercent += v;
          break;
        case "DEF%":
          defPercent += v;
          break;
        case "CRIT Rate%":
          critRateAdd += v;
          break;
        case "CRIT DMG%":
          critDmgAdd += v;
          break;
        case "Anomaly Proficiency":
          base.anomalyProficiency += v;
          break;
        case "Anomaly Mastery%":
          anomalyMasteryMul += v;
          break;
        case "PEN Ratio%":
          penRatioAdd += v;
          break;
        case "PEN":
          base.pen += v;
          break;
        case "Impact%":
          impactMul += v;
          break;
        case "Energy Regen%":
          energyRegenMul += v;
          break;
        default:
          if (s.type in ELEMENT_KEYS) {
            const elem = ELEMENT_KEYS[s.type as ElementKey];
            base.attributeDmgBonus[elem] += v;
          }
      }
    }
  }

  if (agent.id === "ben") {
    const initialDef = agent.baseStats.def * (1 + defPercent) + flatDEF;
    const defToAtk = Math.floor(initialDef * 0.4);
    flatATK += defToAtk;
  }

  const activeSets = getActiveSets(discs);
  const setEffects: typeof activeEffects = {};

  for (const s of activeSets) {
    const setInfo = (discSets as any[]).find((x) => x.id === s.setId);
    if (!setInfo) continue;

    const applySetStats = (statsObj: any) => {
      for (const k in statsObj) {
        const val = statsObj[k];
        if (k === "hpPercent") {
          hpPercent += val;
          continue;
        }
        if (k === "atkPercent") {
          atkPercent += val;
          continue;
        }
        if (k === "defPercent") {
          defPercent += val;
          continue;
        }
        if (k === "Anomaly Mastery%" || k === "anomalyMasteryPercent") {
          anomalyMasteryMul += val;
          continue;
        }
        if (k === "impactPercent" || k === "impact%") {
          impactMul += val;
          continue;
        }
        if (k === "impact") {
          impactFlat += val;
          continue;
        }
        if (k === "energyRegen" || k === "energyRegenPercent") {
          energyRegenMul += val;
        }
        if (k === "attributeDmgBonus" && typeof val === "object") {
          for (const element in val) {
            if (element in base.attributeDmgBonus) {
              base.attributeDmgBonus[
                element as keyof typeof base.attributeDmgBonus
              ] += val[element];
            }
          }
          continue;
        }
        if (k === "fire" || k === "Fire DMG Bonus") {
          base.attributeDmgBonus.fire += val;
          continue;
        }
        if (k === "ice" || k === "Ice DMG Bonus") {
          base.attributeDmgBonus.ice += val;
          continue;
        }
        if (k === "electric" || k === "Electric DMG Bonus") {
          base.attributeDmgBonus.electric += val;
          continue;
        }
        if (k === "physical" || k === "Physical DMG Bonus") {
          base.attributeDmgBonus.physical += val;
          continue;
        }
        if (k === "ether" || k === "Ether DMG Bonus") {
          base.attributeDmgBonus.ether += val;
          continue;
        }
        if (k === "wind" || k === "Wind DMG Bonus") {
          base.attributeDmgBonus.wind += val;
          continue;
        }
        if (k === "sheerForce" || k === "Sheer Force") {
          if (agent.specialty === "Rupture") {
            if (!("sheerForce" in base)) base.sheerForce = 0;
            base.sheerForce += val;
          }
          continue;
        }
        applyStatFromKey(base as any, k, val);
      }
    };

    if (s.effect2 && setInfo.stats2) applySetStats(setInfo.stats2);
    if (s.effect4 && setInfo.stats4) applySetStats(setInfo.stats4);

    if (setInfo.ingameEffects) {
      for (const effect of setInfo.ingameEffects) {
        setEffects[effect.id] = { enabled: true, stacks: 1 };
      }
    }
  }

  const effectsToProcess: any[] = [];
  if (agent.ingameEffects) {
    const agentEffectsToAdd = agent.ingameEffects
      .map((effect) => ({
        ...effect,
        ownerAgentId: agent.id,
        ownerDisplayName: agent.displayName || agent.name,
      }))
      .filter(
        (newEffect) => !effectsToProcess.some((e) => e.id === newEffect.id),
      );
    effectsToProcess.push(...agentEffectsToAdd);
  }

  if (engine?.ingameEffects) {
    const wEngineEffectsToAdd = engine.ingameEffects.filter(
      (newEffect) => !effectsToProcess.some((e) => e.id === newEffect.id),
    );
    effectsToProcess.push(...wEngineEffectsToAdd);
  }

  Object.keys(setEffects).forEach((effectId) => {
    if (activeEffects[effectId]?.enabled) {
      const effectFromRegistry = ingameEffectsRegistry[effectId];
      if (
        effectFromRegistry &&
        !effectsToProcess.some((e) => e.id === effectId)
      ) {
        effectsToProcess.push(effectFromRegistry);
      }
    }
  });

  Object.keys(teamEffectsData).forEach((effectId) => {
    const state = teamEffectsData[effectId];
    if (state?.enabled) {
      const effectFromRegistry = ingameEffectsRegistry[effectId];
      if (effectFromRegistry) {
        const alreadyExists = effectsToProcess.some((e) => e.id === effectId);
        if (!alreadyExists) {
          effectsToProcess.push({
            ...effectFromRegistry,
            ownerAgentId: state.ownerAgentId,
            ownerDisplayName: state.ownerDisplayName,
          });
        }
      }
    }
  });

  if (targetedEffects) {
    Object.entries(targetedEffects).forEach(([effectId, targetData]) => {
      if (targetData.enabled && targetData.targetSlot === currentSlotIndex) {
        const effectFromRegistry = ingameEffectsRegistry[effectId];
        if (
          effectFromRegistry &&
          (effectFromRegistry as any).requiresManualTarget
        ) {
          const alreadyExists = effectsToProcess.some((e) => e.id === effectId);
          if (!alreadyExists) {
            effectsToProcess.push({
              ...effectFromRegistry,
              ownerAgentId: targetData.sourceSlot,
              isManualTargetApplied: true,
            });
          }
        }
      }
    });
  }

  const postMultiplyEffects: Array<{ effect: any; stacks: number }> = [];
  const anomalyBonuses: { anomalyDmgBonus: number; disorderDmgBonus: number } =
    {
      anomalyDmgBonus: 0,
      disorderDmgBonus: 0,
    };

  // PRIMERA PASADA: Procesar efectos (EXCLUYENDO currentStatBased )
  for (const effect of effectsToProcess) {
    const state = activeEffects[effect.id] || teamEffectsData[effect.id];
    if (!state?.enabled) continue;

    if (effect.condition?.excludeOwner === true) {
      const isOwner = effect.ownerAgentId === agent.id;
      if (isOwner) {
        continue; // <--- ESTO es lo único importante, los logs de alrededor sobran
      }
    }

    if (effect.condition?.requiresSpecialty) {
      const isOwner = effect.ownerAgentId === agent.id;
      if (effect.target === "team" && !isOwner) {
      } else if (agent.specialty !== effect.condition.requiresSpecialty) {
        continue;
      }
    }

    if ((effect as any).requiresManualTarget && targetedEffects) {
      if ((effect as any).isManualTargetApplied) {
      } else {
        const targetedEffectData = targetedEffects[effect.id];
        if (!targetedEffectData?.enabled) {
          continue;
        }

        if (effect.target === "self") {
          if (currentSlotIndex !== targetedEffectData.targetSlot) {
            continue;
          }
        } else {
          if (currentSlotIndex !== targetedEffectData.targetSlot) {
            continue;
          }
        }
      }
    }

    const stacks = state.stacks || 1;
    const skillLevel = (state as any).skillLevel || 1;

    if (effect.conditional?.type === "skillLevelBased") {
      let skillLevelForEffect = 1;
      if (effect.target === "team" && teamEffectsData[effect.id]) {
        skillLevelForEffect = teamEffectsData[effect.id].skillLevel || 1;
      } else if (activeEffects[effect.id]) {
        const effectState = activeEffects[effect.id];
        skillLevelForEffect = (effectState as any).skillLevel || 1;
      }
      applySkillLevelBasedBonus(
        base,
        effect,
        skillLevelForEffect,
        teamEffectsData,
        agent,
      );
      continue;
    }

    if (effect.conditional?.type === "currentStatBased") {
      const basedOn = effect.conditional.basedOn;
      const isTeamEffect = effect.target === "team";
      const isFromOtherAgent =
        effect.ownerAgentId && effect.ownerAgentId !== agent.id;
      const teamEffectState = teamEffectsData[effect.id];
      const isInTeamEffects = teamEffectState?.enabled === true;
      const ownerFromTeam = teamEffectState?.ownerAgentId;
      const isFromOtherInTeam = ownerFromTeam && ownerFromTeam !== agent.id;

      const isTeamEffectFromOther =
        (isTeamEffect && isFromOtherAgent) ||
        (isInTeamEffects && isFromOtherInTeam);

      if (isTeamEffectFromOther) {
        const ownerAgentId =
          effect.ownerAgentId || teamEffectState?.ownerAgentId;
        const ownerSlot = teamEffectState?.sourceSlot;
        const ownerStats =
          ownerSlot !== undefined ? getTeamStatsBySlot?.(ownerSlot) : undefined;

        if (ownerStats) {
          let currentStatValue = 0;
          switch (basedOn) {
            case "anomalyMastery":
              currentStatValue = ownerStats.anomalyMastery;
              break;
            case "anomalyProficiency":
              currentStatValue = ownerStats.anomalyProficiency;
              break;
            case "hp":
              currentStatValue = ownerStats.hp;
              break;
            case "atk":
              currentStatValue = ownerStats.atk;
              break;
            case "def":
              currentStatValue = ownerStats.def;
              break;
            case "impact":
              currentStatValue = ownerStats.impact;
              break;
            case "critRate":
              currentStatValue = ownerStats.critRate * 100;
              break;
            case "energyRegen":
              currentStatValue = ownerStats.energyRegen;
              break;
            case "penRatio":
              currentStatValue = ownerStats.penRatio * 100;
              break;
            case "sheerForce":
              currentStatValue = ownerStats.sheerForce || 0;
              break;

            default:
              currentStatValue = 0;
          }

          const { bonusValue } = calculateCurrentStatBonus(
            effect,
            currentStatValue,
          );

          if (effect.conditional.affectedStats) {
            effect.conditional.affectedStats.forEach((statKey: string) => {
              switch (statKey) {
                case "anomalyDmgBonus":
                  anomalyBonuses.anomalyDmgBonus += bonusValue;
                  break;
                case "disorderDmgBonus":
                  anomalyBonuses.disorderDmgBonus += bonusValue;
                  break;

                case "atkFlatRaw":
                  atkFlatRawTotal += bonusValue;
                  break;
                case "defFlatRaw":
                  defFlatRawTotal += bonusValue;
                  break;
                case "hpFlatRaw":
                  hpFlatRawTotal += bonusValue;
                  break;
                case "atkPercentRaw":
                  atkPercentRawTotal += bonusValue;
                  break;
                case "defPercentRaw":
                  defPercentRawTotal += bonusValue;
                  break;
                case "hpPercentRaw":
                  hpPercentRawTotal += bonusValue;
                  break;
                case "refringeCoefficient":
                  if (!base._refringeCoefficient) base._refringeCoefficient = 0;
                  base._refringeCoefficient += bonusValue;
                  break;
                case "luminizeMultiplierBonus":
                  if (!base._luminizeMultiplierBonus)
                    base._luminizeMultiplierBonus = 0;
                  base._luminizeMultiplierBonus += bonusValue;
                  break;
              }
            });
          }
        } else {
        }
        continue;
      }
    }

    if (effect.conditional?.type === "initialStatBased") {
      let sourceInitialStat = 0;
      let effectSkillLevel = 1;

      if (effect.target === "team" && teamEffectsData[effect.id]) {
        const teamEffectData = teamEffectsData[effect.id];
        const ownerStats = teamEffectData.ownerInitialStats;
        effectSkillLevel = teamEffectData.skillLevel || 1;

        switch (effect.conditional.basedOn) {
          case "hp":
            sourceInitialStat = ownerStats?.hp || 0;
            break;
          case "atk":
            sourceInitialStat = ownerStats?.atk || 0;
            break;
          case "def":
            sourceInitialStat = ownerStats?.def || 0;
            break;
          case "critRate":
            sourceInitialStat = ownerStats?.critRate || 0;
            break;
          case "energyRegen":
            sourceInitialStat = ownerStats?.energyRegen || 0;
            break;
          case "penRatio":
            sourceInitialStat = ownerStats?.penRatio || 0;
            break;
          case "anomalyMastery":
            sourceInitialStat = ownerStats?.anomalyMastery || 0;
            break;
          case "anomalyProficiency":
            sourceInitialStat = ownerStats?.anomalyProficiency || 0;
            break;
          case "impact":
            sourceInitialStat = ownerStats?.impact || 0;
            break;
        }
      } else {
        effectSkillLevel = (activeEffects[effect.id] as any)?.skillLevel || 1;

        if (preCalculatedInitialStats) {
          switch (effect.conditional.basedOn) {
            case "hp":
              sourceInitialStat =
                preCalculatedInitialStats.hp ?? agent.baseStats.hp;
              break;
            case "atk":
              sourceInitialStat =
                preCalculatedInitialStats.atk ?? agent.baseStats.atk;
              break;
            case "def":
              sourceInitialStat =
                preCalculatedInitialStats.def ?? agent.baseStats.def;
              break;
            case "critRate":
              sourceInitialStat =
                preCalculatedInitialStats.critRate ??
                agent.combatBase.critRate * 100;
              break;
            case "anomalyMastery":
              sourceInitialStat =
                preCalculatedInitialStats.anomalyMastery ??
                agent.combatBase.anomalyMastery;
              break;
            case "anomalyProficiency":
              sourceInitialStat =
                preCalculatedInitialStats.anomalyProficiency ??
                agent.combatBase.anomalyProficiency;
              break;
            case "energyRegen":
              sourceInitialStat =
                preCalculatedInitialStats.energyRegen ??
                agent.combatBase.energyRegen;
              break;
            case "penRatio":
              sourceInitialStat =
                preCalculatedInitialStats.penRatio ??
                agent.combatBase.penRatio * 100;
              break;
            case "impact": {
              let currentImpact = agent.combatBase.impact;
              if (activeEffects) {
                Object.entries(activeEffects).forEach(([effectId, state]) => {
                  if (state?.enabled) {
                    const eff = ingameEffectsRegistry[effectId];
                    if (
                      eff?.perStack?.impactPercentRaw &&
                      eff.ownerAgentId === agent.id
                    ) {
                      currentImpact =
                        currentImpact *
                        (1 + eff.perStack.impactPercentRaw * state.stacks);
                    }
                  }
                });
              }
              currentImpact = currentImpact * (1 + impactMul) + impactFlat;
              sourceInitialStat = Math.floor(currentImpact);
              break;
            }
          }
        } else {
          switch (effect.conditional.basedOn) {
            case "hp":
              sourceInitialStat = agent.baseStats.hp;
              break;
            case "atk":
              sourceInitialStat = agent.baseStats.atk;
              break;
            case "def":
              sourceInitialStat = agent.baseStats.def;
              break;
            case "critRate":
              sourceInitialStat = (base.critRate + critRateAdd) * 100;
              break;
            case "anomalyMastery":
              sourceInitialStat = base.anomalyMastery;
              sourceInitialStat *= 1 + anomalyMasteryMul;
              break;
          }
        }
      }

      const conditionalBonus = calculateConditionalBonus(
        effect,
        sourceInitialStat,
        effectSkillLevel,
      );

      effect.conditional.affectedStats?.forEach((statKey: string) => {
        if (statKey === "attributeDmgBonus") {
          const dmgTypes = effect.condition?.attributeDmgTypes || [];
          if (dmgTypes.length > 0) {
            dmgTypes.forEach((type: string) => {
              const elementKey =
                type.toLowerCase() as keyof typeof base.attributeDmgBonus;
              if (elementKey in base.attributeDmgBonus) {
                base.attributeDmgBonus[elementKey] += conditionalBonus;
              }
            });
          } else {
            for (const element in base.attributeDmgBonus) {
              base.attributeDmgBonus[
                element as keyof typeof base.attributeDmgBonus
              ] += conditionalBonus;
            }
          }
        } else if (statKey === "sheerForce") {
          const canReceiveSheer =
            agent.specialty === "Rupture" || agent.id === "norma";
          const requiresRupture =
            effect.condition?.requiresSpecialty === "Rupture";
          if (canReceiveSheer && (!requiresRupture || requiresRupture)) {
            if (!("sheerForce" in base)) base.sheerForce = 0;
            base.sheerForce += conditionalBonus;
          }
        } else if (statKey === "impactBaseRaw") {
          if (!base._impactBaseRawBonus) base._impactBaseRawBonus = 0;
          base._impactBaseRawBonus += conditionalBonus;
        } else if (statKey === "impact") {
          impactFlat += conditionalBonus;
        } else if (
          statKey === "fireResShred" ||
          statKey === "iceResShred" ||
          statKey === "electricResShred" ||
          statKey === "physicalResShred" ||
          statKey === "etherResShred"
        ) {
          if (!base._resShred) base._resShred = [];
          const element = statKey.replace("ResShred", "").toLowerCase() as
            | "fire"
            | "ice"
            | "electric"
            | "physical"
            | "ether";
          base._resShred.push({
            element,
            value: conditionalBonus,
            condition: effect.condition || null,
          });
        } else {
          switch (statKey) {
            case "atk":
            case "hp":
            case "def":
              base[statKey] += conditionalBonus;
              break;
            case "atkFlat":
              atkFlatRawTotal += conditionalBonus;
              break;
            case "hpFlat":
              hpFlatRawTotal += conditionalBonus;
              break;
            case "defFlat":
              defFlatRawTotal += conditionalBonus;
              break;
            case "atkPercent":
              atkPercentRawTotal += conditionalBonus;
              break;
            case "hpPercent":
              hpPercentRawTotal += conditionalBonus;
              break;
            case "defPercent":
              defPercentRawTotal += conditionalBonus;
              break;
            case "atkFlatRaw":
              atkFlatRawTotal += conditionalBonus;
              break;
            case "hpFlatRaw":
              hpFlatRawTotal += conditionalBonus;
              break;
            case "defFlatRaw":
              defFlatRawTotal += conditionalBonus;
              break;
            case "atkPercentRaw":
              atkPercentRawTotal += conditionalBonus;
              break;
            case "hpPercentRaw":
              hpPercentRawTotal += conditionalBonus;
              break;
            case "defPercentRaw":
              defPercentRawTotal += conditionalBonus;
              break;
            case "impact":
              impactFlat += conditionalBonus;
              break;
            case "impactBaseRaw":
              if (!base._impactBaseRawBonus) base._impactBaseRawBonus = 0;
              base._impactBaseRawBonus += conditionalBonus;
              break;
            case "fireResShred":
            case "iceResShred":
            case "electricResShred":
            case "physicalResShred":
            case "etherResShred":
              if (!base._resShred) base._resShred = [];
              const element = statKey.replace("ResShred", "").toLowerCase() as
                | "fire"
                | "ice"
                | "electric"
                | "physical"
                | "ether";
              base._resShred.push({
                element,
                value: conditionalBonus,
                condition: effect.condition || null,
              });
              break;
            default:
              applyStatFromKey(base as any, statKey, conditionalBonus);
          }
        }
      });
      continue;
    }

    if (effect.wEngineOverclock) {
      const state = activeEffects[effect.id];
      let overclockLevel = 1;

      if (effect.target === "team" && teamEffectsData[effect.id]) {
        overclockLevel = teamEffectsData[effect.id].overclockLevel || 1;
      } else if (state) {
        overclockLevel = state.overclockLevel || 1;
      }

      const currentLevel =
        effect.wEngineOverclock.levels.find(
          (l: any) => l.level === overclockLevel,
        ) || effect.wEngineOverclock.levels[0];

      const stacks = state.stacks || 1;

      if (currentLevel.baseStats) {
        Object.entries(currentLevel.baseStats).forEach(([stat, value]) => {
          applyWEngineStat(stat, value as number, 1, effect);
        });
      }
      if (currentLevel.stats) {
        Object.entries(currentLevel.stats).forEach(([stat, value]) => {
          applyWEngineStat(stat, value as number, stacks, effect);
        });
      }
      continue;
    }

    const effectValues: Record<string, number> = {};

    if (effect.flat) {
      for (const [k, v] of Object.entries(effect.flat)) {
        if (agent.specialty === "Rupture") {
          if (
            k === "energyRegen" ||
            k === "energyRegenRaw" ||
            k === "energyRegenPercent" ||
            k === "energyRegenPercentRaw" ||
            k === "pen" ||
            k === "penRatio"
          ) {
            continue;
          }
        }
        if (k === "impactFlatRaw") {
          impactFlatRaw += (v as number) * stacks;
          continue;
        }
        if (k === "atkFlatRaw") {
          atkFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "atkPercentRaw") {
          atkPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "hpFlatRaw") {
          hpFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "hpPercentRaw") {
          hpPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defFlatRaw") {
          defFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defPercentRaw") {
          defPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defShred") continue;
        if (k === "refringeCoefficient") {
          if (!base._refringeCoefficient) base._refringeCoefficient = 0;
          base._refringeCoefficient += (v as number) * stacks;
          continue;
        }
        if (k === "attributeDmgBonus" && typeof v === "object") {
          for (const [element, elementValue] of Object.entries(v as any)) {
            if (element in base.attributeDmgBonus) {
              const key = `${element}DmgBonus`;
              effectValues[key] =
                (effectValues[key] || 0) + (elementValue as number) * stacks;
            }
          }
        } else {
          effectValues[k] = (effectValues[k] || 0) + (v as number) * stacks;
        }
      }
    }

    if (effect.perStack) {
      for (const [k, v] of Object.entries(effect.perStack)) {
        if (agent.specialty === "Rupture") {
          if (
            k === "energyRegen" ||
            k === "energyRegenRaw" ||
            k === "energyRegenPercent" ||
            k === "energyRegenPercentRaw" ||
            k === "pen" ||
            k === "penRatio"
          ) {
            continue;
          }
        }
        if (k === "impactFlatRaw") {
          impactFlatRaw += (v as number) * stacks;
          continue;
        }
        if (k === "atkFlatRaw") {
          atkFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "atkPercentRaw") {
          atkPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "hpFlatRaw") {
          hpFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "hpPercentRaw") {
          hpPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defFlatRaw") {
          defFlatRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defPercentRaw") {
          defPercentRawTotal += (v as number) * stacks;
          continue;
        }
        if (k === "defShred") continue;
        if (k === "refringeCoefficient") {
          if (!base._refringeCoefficient) base._refringeCoefficient = 0;
          base._refringeCoefficient += (v as number) * stacks;
          continue;
        }
        if (k === "attributeDmgBonus" && typeof v === "object") {
          for (const [element, elementValue] of Object.entries(v as any)) {
            if (element in base.attributeDmgBonus) {
              const key = `${element}DmgBonus`;
              effectValues[key] =
                (effectValues[key] || 0) + (elementValue as number) * stacks;
            }
          }
        } else if (
          k !== "hpPercent" &&
          k !== "atkPercent" &&
          k !== "defPercent"
        ) {
          effectValues[k] = (effectValues[k] || 0) + (v as number) * stacks;
        }
      }
    }

    for (const key in effectValues) {
      const value = effectValues[key];
      const hasPostPercent =
        effect.flat?.atkPercent ||
        effect.flat?.hpPercent ||
        effect.flat?.defPercent ||
        effect.perStack?.atkPercent ||
        effect.perStack?.hpPercent ||
        effect.perStack?.defPercent;

      const isPercentStat =
        key === "atkPercent" || key === "hpPercent" || key === "defPercent";

      if (hasPostPercent && !isPercentStat) {
        applyStatFromKey(base as any, key, value);
        continue;
      }

      switch (key) {
        case "atkPercent":
          atkPercent += value;
          break;
        case "hpPercent":
          hpPercent += value;
          break;
        case "defPercent":
          defPercent += value;
          break;
        case "critDmg":
          critDmgAdd += value;
          break;
        case "critRate":
          base.critRate += value;
          break;
        case "fireDmgBonus":
          base.attributeDmgBonus.fire += value;
          break;
        case "electricDmgBonus":
          base.attributeDmgBonus.electric += value;
          break;
        case "iceDmgBonus":
          base.attributeDmgBonus.ice += value;
          break;
        case "physicalDmgBonus":
          base.attributeDmgBonus.physical += value;
          break;
        case "etherDmgBonus":
          base.attributeDmgBonus.ether += value;
          break;
        case "windDmgBonus":
          base.attributeDmgBonus.wind += value;
          break;
        case "anomalyProficiency":
          base.anomalyProficiency += value;
          break;
        case "anomalyMastery":
          base.anomalyMastery += value;
          break;
        case "anomalyMasteryPercent":
          anomalyMasteryMul += value;
          break;
        case "anomalyMasteryRaw":
          if (!base._anomalyMasteryRawBonus) base._anomalyMasteryRawBonus = 0;
          base._anomalyMasteryRawBonus += value;
          break;
        case "pen":
          base.pen += value;
          break;
        case "penRatio":
          base.penRatio += value;
          break;
        case "impact":
          impactFlat += value;
          break;
        case "impactPercent":
          impactMul += value;
          break;
        case "impactPercentRaw":
          impactPercentRaw += value;
          break;
        case "energyRegenPercentRaw":
          if (!base._energyRegenPercentRawBonus)
            base._energyRegenPercentRawBonus = 0;
          base._energyRegenPercentRawBonus += value;
          break;
        case "energyRegenRaw":
          if (!base._energyRegenRawBonus) base._energyRegenRawBonus = 0;
          base._energyRegenRawBonus += value;
          break;
        case "energyRegen":
          energyRegenMul += value;
          break;
        case "energyRegenPercent":
          energyRegenMul += value;
          break;
        case "sheerForce":
          if (agent.specialty === "Rupture" || agent.id === "norma") {
            (base as any).sheerForce = ((base as any).sheerForce || 0) + value;
          }
          break;
        case "hpFlat":
        case "hp":
          flatHP += value;
          break;
        case "atkFlat":
        case "atk":
          flatATK += value;
          break;
        case "defFlat":
        case "def":
          flatDEF += value;
          break;
        default:
          applyStatFromKey(base as any, key, value);
      }
    }

    if (effect.baseStats) {
      Object.entries(effect.baseStats).forEach(([stat, value]) => {
        applyStatFromKey(base, stat, value);
      });
    }

    if (effect.conditionalStats) {
      const conditionalState =
        activeEffects[`${effect.id}_conditional`]?.enabled;
      if (conditionalState) {
        Object.entries(effect.conditionalStats.stats).forEach(
          ([stat, value]) => {
            applyStatFromKey(base, stat, value);
          },
        );
      }
    }
  }

  base.atk = Math.floor(base.atk) * (1 + atkPercent) + flatATK;
  base.hp = Math.round(base.hp * (1 + hpPercent) + flatHP);
  base.def = Math.floor(base.def) * (1 + defPercent) + flatDEF;

  base.critRate += critRateAdd;
  base.critDmg += critDmgAdd;
  base.anomalyMastery *= 1 + anomalyMasteryMul;
  base.penRatio += penRatioAdd;

  let impactValue = impactBase + impactFlat;
  impactValue = impactValue * (1 + impactMul);

  if (base._impactPercentAdditive) {
    impactValue += impactBase * base._impactPercentAdditive;
    delete base._impactPercentAdditive;
  }
  if (impactPercentRaw !== 0) {
    impactValue = impactValue * (1 + impactPercentRaw);
  }
  if (base._impactBaseRawBonus) {
    impactValue += base._impactBaseRawBonus;
    delete base._impactBaseRawBonus;
  }
  if (impactFlatRaw !== 0) {
    impactValue += impactFlatRaw;
  }

  base.impact = Math.floor(impactValue);

  if (base._anomalyMasteryRawBonus) {
    base.anomalyMastery += base._anomalyMasteryRawBonus;
    delete base._anomalyMasteryRawBonus;
  }

  base.energyRegen *= 1 + energyRegenMul;
  //base.energyRegen = Math.floor(base.energyRegen * 100) / 100;
  energyRegenMul = Math.round(energyRegenMul * 10000) / 10000;
  base.energyRegen = Math.round(base.energyRegen * 10000) / 10000;

  if (base._impactPercentRawBonus) {
    base.impact *= 1 + base._impactPercentRawBonus;
    delete base._impactPercentRawBonus;
  }

  if (postMultiplyEffects.length > 0) {
    let postHpPercent = 0;
    let postAtkPercent = 0;
    let postDefPercent = 0;

    for (const { effect, stacks } of postMultiplyEffects) {
      if (effect.flat?.hpPercent) {
        postHpPercent += effect.flat.hpPercent * stacks;
      }
      if (effect.perStack?.hpPercent) {
        postHpPercent += (effect.perStack.hpPercent || 0) * stacks;
      }
      if (effect.flat?.atkPercent) {
        postAtkPercent += effect.flat.atkPercent * stacks;
      }
      if (effect.perStack?.atkPercent) {
        postAtkPercent += (effect.perStack.atkPercent || 0) * stacks;
      }
      if (effect.flat?.defPercent) {
        postDefPercent += effect.flat.defPercent * stacks;
      }
      if (effect.perStack?.defPercent) {
        postDefPercent += (effect.perStack.defPercent || 0) * stacks;
      }
    }

    if (postHpPercent !== 0) {
      base.hp = base.hp * (1 + postHpPercent);
    }
    if (postAtkPercent !== 0) {
      base.atk = base.atk * (1 + postAtkPercent);
    }
    if (postDefPercent !== 0) {
      base.def = base.def * (1 + postDefPercent);
    }
  }

  if (agent.id === "ben") {
    const defToAtk = Math.floor(base.def * 0.4);
    base.atk += defToAtk;
  }

  if (agent.specialty === "Rupture") {
    base.energyRegen = 0;
    base.pen = 0;
    base.penRatio = 0;
  }

  if (base._energyRegenRawBonus) {
    base.energyRegen += base._energyRegenRawBonus;
    delete base._energyRegenRawBonus;
  }
  if (base._energyRegenPercentRawBonus) {
    base.energyRegen *= 1 + base._energyRegenPercentRawBonus;
    delete base._energyRegenPercentRawBonus;
  }

  base.energyRegen = Math.floor(base.energyRegen * 100) / 100;

  if (activeEffects) {
    Object.keys(activeEffects).forEach((effectId) => {
      if (
        effectId.startsWith("seed_vanguard_") &&
        activeEffects[effectId]?.enabled
      ) {
        atkFlatRawTotal += 1000;
        base.critDmg += 0.3;
      }
    });
  }
  if (agent.id === "seed") {
    const seedEffect = agent.ingameEffects?.find(
      (e) => e.id === "seed_core_flower_chain_protocol",
    );
    const isSeedEffectActive =
      activeEffects?.["seed_core_flower_chain_protocol"]?.enabled;
    if (seedEffect && isSeedEffectActive) {
      atkFlatRawTotal += 1000;
      base.critDmg += 0.3;
    }
  }

  // SEGUNDA PASADA: (CurrentStatBased)
  for (const effect of effectsToProcess) {
    const state = activeEffects[effect.id] || teamEffectsData[effect.id];
    if (!state?.enabled) continue;
    if (effect.conditional?.type !== "currentStatBased") continue;
    if (effect.condition?.excludeOwner === true) {
      const ownerId =
        effect.ownerAgentId || teamEffectsData[effect.id]?.ownerAgentId;
      if (ownerId === agent.id) {
        continue;
      }
    }

    const isTeamEffectFromOther =
      effect.target === "team" &&
      teamEffectsData[effect.id] &&
      teamEffectsData[effect.id].ownerAgentId !== agent.id;

    const basedOn = effect.conditional.basedOn;
    let currentStatValue = 0;

    if (isTeamEffectFromOther) {
      const ownerAgentId =
        effect.ownerAgentId || teamEffectsData[effect.id]?.ownerAgentId;
      const ownerSlot = teamEffectsData[effect.id]?.sourceSlot;
      const ownerStats =
        ownerSlot !== undefined ? getTeamStatsBySlot?.(ownerSlot) : undefined;
      if (ownerStats) {
        let currentStatValue = 0;
        switch (basedOn) {
          case "anomalyMastery":
            currentStatValue = ownerStats.anomalyMastery;
            break;
          case "anomalyProficiency":
            currentStatValue = ownerStats.anomalyProficiency;
            break;
          case "hp":
            currentStatValue = ownerStats.hp;
            break;
          case "atk":
            currentStatValue = ownerStats.atk;
            break;
          case "def":
            currentStatValue = ownerStats.def;
            break;
          case "impact":
            currentStatValue = ownerStats.impact;
            break;
          case "critRate":
            currentStatValue = ownerStats.critRate * 100;
            break;
          case "energyRegen":
            currentStatValue = ownerStats.energyRegen;
            break;
          case "penRatio":
            currentStatValue = ownerStats.penRatio * 100;
            break;
          case "sheerForce":
            currentStatValue = ownerStats.sheerForce || 0;
            break;
          default:
            currentStatValue = 0;
        }
        const { bonusValue } = calculateCurrentStatBonus(
          effect,
          currentStatValue,
        );
        if (effect.conditional.affectedStats) {
          effect.conditional.affectedStats.forEach((statKey: string) => {
            switch (statKey) {
              case "penRatio":
                base.penRatio += bonusValue;
                break;
              default:
            }
          });
        }
        continue;
      }
    }

    switch (basedOn) {
      case "anomalyMastery":
        currentStatValue = base.anomalyMastery;
        break;
      case "anomalyProficiency":
        currentStatValue = base.anomalyProficiency;
        break;
      case "hp":
        currentStatValue = base.hp;
        break;
      case "atk":
        currentStatValue = base.atk;
        break;
      case "def":
        currentStatValue = base.def;
        break;
      case "impact":
        currentStatValue = base.impact;
        break;
      case "critRate":
        currentStatValue = base.critRate * 100;
        break;
      case "energyRegen":
        currentStatValue = base.energyRegen;
        break;
      case "penRatio":
        currentStatValue = base.penRatio * 100;
        break;
      case "sheerForce":
        currentStatValue = base.sheerForce || 0;
        break;
      default:
        currentStatValue = 0;
    }

    const { bonusValue } = calculateCurrentStatBonus(effect, currentStatValue);

    if (effect.conditional.affectedStats) {
      effect.conditional.affectedStats.forEach((statKey: string) => {
        switch (statKey) {
          case "anomalyDmgBonus":
            if (!anomalyBonuses)
              anomalyBonuses = { anomalyDmgBonus: 0, disorderDmgBonus: 0 };
            anomalyBonuses.anomalyDmgBonus += bonusValue;
            break;
          case "disorderDmgBonus":
            if (!anomalyBonuses)
              anomalyBonuses = { anomalyDmgBonus: 0, disorderDmgBonus: 0 };
            anomalyBonuses.disorderDmgBonus += bonusValue;
            break;
          case "anomalyProficiency":
            base.anomalyProficiency += bonusValue;
            break;
          case "anomalyMastery":
            base.anomalyMastery += bonusValue;
            break;
          case "hp":
          case "hpFlat":
            base.hp += bonusValue;
            break;
          case "atk":
          case "atkFlat":
            base.atk += bonusValue;
            break;
          case "def":
          case "defFlat":
            base.def += bonusValue;
            break;
          case "atkFlatRaw":
            atkFlatRawTotal += bonusValue;
            break;
          case "atkPercentRaw":
            atkPercentRawTotal += bonusValue;
            break;
          case "hpFlatRaw":
            hpFlatRawTotal += bonusValue;
            break;
          case "hpPercentRaw":
            hpPercentRawTotal += bonusValue;
            break;
          case "defFlatRaw":
            defFlatRawTotal += bonusValue;
            break;
          case "defPercentRaw":
            defPercentRawTotal += bonusValue;
            break;
          case "hpPercent":
            if (!base._hpPercentAdditive) base._hpPercentAdditive = 0;
            base._hpPercentAdditive += bonusValue / 100;
            break;
          case "atkPercent":
            if (!base._atkPercentAdditive) base._atkPercentAdditive = 0;
            base._atkPercentAdditive += bonusValue / 100;
            break;
          case "defPercent":
            if (!base._defPercentAdditive) base._defPercentAdditive = 0;
            base._defPercentAdditive += bonusValue / 100;
            break;
          case "critRate":
            base.critRate += bonusValue / 100;
            break;
          case "critDmg":
            base.critDmg += bonusValue / 100;
            break;
          case "impact":
            if (!base._impactFlat) base._impactFlat = 0;
            base._impactFlat += bonusValue;
            break;
          case "impactPercent":
            if (!base._impactPercentAdditive) base._impactPercentAdditive = 0;
            base._impactPercentAdditive += bonusValue / 100;
            break;
          case "pen":
            base.pen += bonusValue;
            break;
          case "penRatio":
            base.penRatio += bonusValue / 100;
            break;
          case "energyRegen":
            base.energyRegen += bonusValue;
            break;
          case "attributeDmgBonus":
            const dmgTypes = effect.condition?.attributeDmgTypes || [
              "fire",
              "ice",
              "electric",
              "physical",
              "ether",
            ];
            dmgTypes.forEach((type: string) => {
              const elementKey =
                type.toLowerCase() as keyof typeof base.attributeDmgBonus;
              if (elementKey in base.attributeDmgBonus) {
                base.attributeDmgBonus[elementKey] += bonusValue / 100;
              }
            });
            break;
          case "sheerForce":
            if (agent.specialty === "Rupture" || agent.id === "norma") {
              base.sheerForce = (base.sheerForce || 0) + bonusValue;
            }
            break;
          case "sheerDmgBonus":
            if (!base._sheerDmgBonus) base._sheerDmgBonus = 0;
            base._sheerDmgBonus += bonusValue / 100;
            break;
          case "fireResShred":
          case "iceResShred":
          case "electricResShred":
          case "physicalResShred":
          case "etherResShred":
            if (!base._resShred) base._resShred = [];
            const element = statKey.replace("ResShred", "").toLowerCase() as
              | "fire"
              | "ice"
              | "electric"
              | "physical"
              | "ether";
            base._resShred.push({
              element,
              value: bonusValue / 100,
              condition: effect.condition || null,
            });
            break;
          case "defShred":
            if (!base._defShredBonus) base._defShredBonus = 0;
            base._defShredBonus += bonusValue / 100;
            break;
          case "luminizeMultiplierBonus":
            if (!base._luminizeMultiplierBonus)
              base._luminizeMultiplierBonus = 0;
            base._luminizeMultiplierBonus += bonusValue;
            break;
          default:
        }
      });
    }
  }

  const baseAtkOriginal = base.atk;
  const baseHpOriginal = base.hp;
  const baseDefOriginal = base.def;

  let finalAtk = baseAtkOriginal;
  let finalHp = baseHpOriginal;
  let finalDef = baseDefOriginal;

  if (atkPercentRawTotal !== 0) {
    finalAtk += baseAtkOriginal * atkPercentRawTotal;
  }
  if (hpPercentRawTotal !== 0) {
    finalHp += baseHpOriginal * hpPercentRawTotal;
  }
  if (defPercentRawTotal !== 0) {
    finalDef += baseDefOriginal * defPercentRawTotal;
  }

  if (atkFlatRawTotal !== 0) {
    finalAtk += atkFlatRawTotal;
  }
  if (hpFlatRawTotal !== 0) {
    finalHp += hpFlatRawTotal;
  }
  if (defFlatRawTotal !== 0) {
    finalDef += defFlatRawTotal;
  }

  base.atk = Math.floor(finalAtk);
  base.hp = Math.floor(finalHp);
  base.def = Math.floor(finalDef);

  if (base._hpPercentAdditive) {
    base.hp *= 1 + base._hpPercentAdditive;
    delete base._hpPercentAdditive;
  }
  if (base._atkPercentAdditive) {
    base.atk *= 1 + base._atkPercentAdditive;
    delete base._atkPercentAdditive;
  }
  if (base._defPercentAdditive) {
    base.def *= 1 + base._defPercentAdditive;
    delete base._defPercentAdditive;
  }
  if (base._impactFlat) {
    base.impact += base._impactFlat;
    delete base._impactFlat;
  }
  if (base._impactPercentAdditive) {
    base.impact *= 1 + base._impactPercentAdditive;
    delete base._impactPercentAdditive;
  }
  if (base._sheerDmgBonus) {
    delete base._sheerDmgBonus;
  }

  if (agent.specialty === "Rupture") {
    const sfHP = Math.floor(base.hp * 0.1);
    const sfATK = Math.floor(base.atk * 0.3);
    base.sheerForce = (base.sheerForce || 0) + sfHP + sfATK;
  } else {
    if (!("sheerForce" in base)) base.sheerForce = 0;
  }

  (base as any)._anomalyBonuses = anomalyBonuses;

  return base;

  function applyWEngineStat(
    stat: string,
    value: number | Record<string, number>,
    multiplier: number,
    effect: any,
  ) {
    if (stat === "attributeDmgBonus" && typeof value === "object") {
      Object.entries(value).forEach(([element, elementValue]) => {
        if (element in base.attributeDmgBonus) {
          base.attributeDmgBonus[
            element as keyof typeof base.attributeDmgBonus
          ] += (elementValue as number) * multiplier;
        }
      });
      return;
    }

    const finalValue = (value as number) * multiplier;

    switch (stat) {
      case "atkPercent":
        postMultiplyEffects.push({
          effect: { flat: { atkPercent: finalValue } },
          stacks: 1,
        });
        break;
      case "atkFlat":
        flatATK += finalValue;
        break;
      case "atkFlatRaw":
        atkFlatRawTotal += finalValue;
        break;
      case "atkPercentRaw":
        atkPercentRawTotal += finalValue;
        break;
      case "hpFlatRaw":
        hpFlatRawTotal += finalValue;
        break;
      case "hpPercentRaw":
        hpPercentRawTotal += finalValue;
        break;
      case "defFlatRaw":
        defFlatRawTotal += finalValue;
        break;
      case "defPercentRaw":
        defPercentRawTotal += finalValue;
        break;

      case "hpPercent":
        postMultiplyEffects.push({
          effect: { flat: { hpPercent: finalValue } },
          stacks: 1,
        });
        break;
      case "hpFlat":
        flatHP += finalValue;
        break;
      case "defPercent":
        postMultiplyEffects.push({
          effect: { flat: { defPercent: finalValue } },
          stacks: 1,
        });
        break;
      case "defFlat":
        flatDEF += finalValue;
        break;
      case "critRate":
        base.critRate += finalValue;
        break;
      case "critDmg":
        base.critDmg += finalValue;
        break;
      case "penRatio":
        base.penRatio += finalValue;
        break;
      case "energyRegen":
        base.energyRegen += finalValue;
        break;
      case "energyRegenRaw":
        if (!base._energyRegenRawBonus) base._energyRegenRawBonus = 0;
        base._energyRegenRawBonus += finalValue;
        break;
      case "impact":
        impactFlat += finalValue;
        break;
      case "impactPercent":
        if (!base._impactPercentAdditive) base._impactPercentAdditive = 0;
        base._impactPercentAdditive += finalValue;
        break;
      case "impactPercentRaw":
        impactPercentRaw += finalValue;
        break;
      case "impactFlatRaw":
        impactFlatRaw += finalValue;
        break;
      case "anomalyProficiency":
        base.anomalyProficiency += finalValue;
        break;
      case "anomalyMastery":
        base.anomalyMastery += finalValue;
        break;
      case "anomalyMasteryRaw":
        if (!base._anomalyMasteryRawBonus) base._anomalyMasteryRawBonus = 0;
        base._anomalyMasteryRawBonus += finalValue;
        break;
      case "anomalyMasteryPercent":
        anomalyMasteryMul += finalValue;
        break;
      case "sheerForce":
        if (agent.specialty === "Rupture" || agent.id === "norma") {
          base.sheerForce = (base.sheerForce || 0) + finalValue;
        }
        break;
      case "defShred":
        if (!base._defShredBonus) base._defShredBonus = 0;
        base._defShredBonus += finalValue;
        break;
      case "fireResShred":
      case "iceResShred":
      case "electricResShred":
      case "physicalResShred":
      case "etherResShred": {
        if (!base._resShred) base._resShred = [];
        const element = stat.replace("ResShred", "").toLowerCase() as
          | "fire"
          | "ice"
          | "electric"
          | "physical"
          | "ether";
        base._resShred.push({
          element,
          value: finalValue,
          condition: effect.condition ?? null,
        });
        break;
      }
      default:
    }
  }
}
