import { MAIN_STATS_BY_SLOT } from "@/constants/discMainBySlot";
import { SUB_ROLL_TABLE_S } from "@/constants/discRollTables";
import { MAINSTAT_TABLE } from "@/constants/discMainTables";
import type { DriveDisc, StatKey, DiscSubstat } from "@/types/DriveDisc";

export function totalRolls(level: number): number {
  return Math.floor(level / 3);
}

export function isMainValid(slot: number, stat: StatKey): boolean {
  return MAIN_STATS_BY_SLOT[slot as 1 | 2 | 3 | 4 | 5 | 6].includes(stat);
}

export function generateMainValue(type: StatKey, level: number) {
  if (!type) return 0;
  const arr = MAINSTAT_TABLE[type];
  if (!arr) return 0;
  const val = arr[level - 1];

  const percentKeys = new Set([
    "HP%",
    "ATK%",
    "DEF%",
    "CRIT Rate%",
    "CRIT DMG%",
    "Impact%",
    "Energy Regen%",
    "PEN Ratio%",
    "Anomaly Mastery%",
    "Anomaly Mastery",
  ]);

  if (type.includes("%") || percentKeys.has(type)) {
    return Number(val);
  }

  return Math.round(val);
}

export function subValueFromRolls(type: StatKey, rolls: number): number {
  if (!type) return 0;
  const table = SUB_ROLL_TABLE_S[type];
  if (!table) return 0;
  const val = table[rolls] ?? 0;

  const flatKeys = new Set(["HP", "ATK", "DEF", "PEN"]);
  if (flatKeys.has(type)) return Math.round(val);

  return Number(Number(val).toFixed(6));
}

export function recalcAllSubValues(substats: DiscSubstat[]): DiscSubstat[] {
  return substats.map((s) => ({
    ...s,
    value: subValueFromRolls(s.type, s.rolls),
  }));
}

export function applyDiscToBaseStats(baseStats: any, disc: DriveDisc) {
  const all = [disc.main, ...disc.substats];

  for (const s of all) {
    switch (s.type) {
      case "HP":
        baseStats.hp += s.value;
        break;
      case "ATK":
        baseStats.atk += s.value;
        break;
      case "DEF":
        baseStats.def += s.value;
        break;

      case "HP%":
        baseStats.hp *= 1 + s.value;
        break;
      case "ATK%":
        baseStats.atk *= 1 + s.value;
        break;
      case "DEF%":
        baseStats.def *= 1 + s.value;
        break;
    }
  }

  return baseStats;
}

export function applyDiscToCombatStats(combat: any, disc: DriveDisc) {
  const all = [disc.main, ...disc.substats];

  for (const s of all) {
    if (combat?.__isRuptureAgent) {
      if (
        s.type === "PEN" ||
        s.type === "PEN Ratio%" ||
        s.type === "Energy Regen%" ||
        s.type === "Energy Regen"
      ) {
        continue;
      }
    }

    switch (s.type) {
      case "CRIT Rate%":
        combat.critRate += s.value;
        break;
      case "CRIT DMG%":
        combat.critDmg += s.value;
        break;

      case "Anomaly Proficiency":
        combat.anomalyProficiency += s.value;
        break;
      case "Anomaly Mastery%":
        combat.anomalyMastery += s.value;
        break;

      case "PEN Ratio%":
        combat.penRatio += s.value;
        break;
      case "PEN":
        combat.pen += s.value;
        break;

      case "Impact%":
        combat.impact += s.value;
        break;
      case "Energy Regen%":
        combat.energyRegen += s.value;
        break;

      case "Fire DMG Bonus%":
      case "Ether DMG Bonus%":
      case "Ice DMG Bonus%":
      case "Physical DMG Bonus%":
        combat.attributeDmgBonus += s.value;
        break;
    }
  }

  return combat;
}
