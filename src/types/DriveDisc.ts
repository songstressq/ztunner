export type StatKey =
  | "HP"
  | "ATK"
  | "DEF"
  | "HP%"
  | "ATK%"
  | "DEF%"
  | "CRIT Rate%"
  | "CRIT DMG%"
  | "Anomaly Proficiency"
  | "Anomaly Mastery%"
  | "PEN Ratio%"
  | "PEN"
  | "Fire DMG Bonus%"
  | "Physical DMG Bonus%"
  | "Ether DMG Bonus%"
  | "Ice DMG Bonus%"
  | "Wind DMG Bonus%"
  | "Impact%"
  | "Energy Regen%";

export interface DiscMainStat {
  type: StatKey | null;
  value: number;
}

export interface DiscSubstat {
  type: StatKey | null;
  rolls: number;
  value: number;
}

export interface DriveDisc {
  slot: number;
  rarity: "S";
  setId: string;
  main: DiscMainStat;
  substats: DiscSubstat[];
  id?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  favorite?: boolean;
}
