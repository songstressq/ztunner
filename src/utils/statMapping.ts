export const mapRecommendedToStatKeys = (recommended: string[]): string[] => {
  const mapping: Record<string, string> = {
    HP: "hp",
    ATK: "atk",
    DEF: "def",
    Impact: "impact",

    "HP%": "hpPercent",
    "ATK%": "atkPercent",
    "DEF%": "defPercent",
    "Impact%": "impactPercent",

    "CRIT Rate": "critRate",
    "CRIT DMG": "critDmg",
    "Crit Rate": "critRate",
    "Crit Dmg": "critDmg",

    "Anomaly Proficiency": "anomalyProficiency",
    "Anomaly Mastery": "anomalyMastery",

    "PEN Ratio": "penRatio",
    PEN: "pen",

    "Energy Regen": "energyRegen",

    "Sheer Force": "sheerForce",

    "Fire DMG Bonus": "fireDmgBonus",
    "Ice DMG Bonus": "iceDmgBonus",
    "Electric DMG Bonus": "electricDmgBonus",
    "Physical DMG Bonus": "physicalDmgBonus",
    "Ether DMG Bonus": "etherDmgBonus",
  };

  return recommended.map((stat) => mapping[stat] || stat.toLowerCase());
};
