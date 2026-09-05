export const MAIN_STATS_BY_SLOT = {
  1: ["HP"],

  2: ["ATK"],

  3: ["DEF"],

  4: ["HP%", "ATK%", "DEF%", "CRIT Rate%", "CRIT DMG%", "Anomaly Proficiency"],

  5: [
    "HP%",
    "ATK%",
    "DEF%",
    "PEN Ratio%",
    "Ice DMG Bonus%",
    "Ether DMG Bonus%",
    "Fire DMG Bonus%",
    "Physical DMG Bonus%",
    "Electric DMG Bonus%",
  ],

  6: ["HP%", "ATK%", "DEF%", "Anomaly Mastery%", "Impact%", "Energy Regen%"],
} as const;
