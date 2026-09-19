const PERCENT_STATS = new Set<string>([
  "critRate",
  "critDmg",
  "atkPercent",
  "hpPercent",
  "defPercent",
  "impactPercent",
  "impactPercentRaw",
  "penRatio",
  "anomalyMasteryPercent",
  "energyRegenPercent",
  "energyRegenPercentRaw",
  "energyRegenPercentRawBonus",
  "attributeDmgBonus",
  "sheerDmgBonus",
  "sheerDmgFlat",
  "anomalyDmgBonus",
  "disorderDmgBonus",
  "disorderMultiplierBonus",
  "vortexDmgBonus",
  "vortexMultiplierBonus",
  "anomalyDmgBonusFlat",
  "disorderDmgBonusFlat",
  "assaultCritDmgBonus",
  "assaultCritDmgTotal",
  "defShred",
  "refringeCoefficient",
  "luminizeMultiplierBonus",

  "fireResShred",
  "iceResShred",
  "electricResShred",
  "physicalResShred",
  "etherResShred",
  "windResShred",

  "fireDmgBonus",
  "iceDmgBonus",
  "electricDmgBonus",
  "physicalDmgBonus",
  "etherDmgBonus",
  "windDmgBonus",

  "critDamageElementalBonus",
  "dmgBonus",
]);

const FLAT_STATS = new Set<string>([
  "hp",
  "hpFlat",
  "atk",
  "atkFlat",
  "def",
  "defFlat",
  "pen",
  "impact",
  "impactFlat",
  "impactFlatRaw",
  "impactBaseRaw",
  "anomalyProficiency",
  "anomalyMastery",
  "anomalyMasteryRaw",
  "sheerForce",
]);

const DECIMAL_STATS = new Set<string>(["energyRegen", "energyRegenRaw"]);

const RAW_SUFFIX_RE = /Raw(Bonus)?$/;

const STAT_NAMES: Record<string, string> = {
  hp: "HP",
  hpFlat: "HP",
  hpPercent: "HP%",
  hpFlatRaw: "HP",
  hpPercentRaw: "HP%",
  atk: "ATK",
  atkFlat: "ATK",
  atkPercent: "ATK%",
  atkFlatRaw: "ATK",
  atkPercentRaw: "ATK%",
  def: "DEF",
  defFlat: "DEF",
  defPercent: "DEF%",
  defFlatRaw: "DEF",
  defPercentRaw: "DEF%",

  critRate: "CRIT Rate",
  critDmg: "CRIT DMG",
  impact: "Impact",
  impactFlat: "Impact",
  impactFlatRaw: "Impact",
  impactPercent: "Impact%",
  impactPercentRaw: "Impact%",
  impactBaseRaw: "Impact",
  pen: "PEN",
  penRatio: "PEN Ratio",
  energyRegen: "Energy Regen",
  energyRegenRaw: "Energy Regen",
  energyRegenPercent: "Energy Regen%",
  energyRegenPercentRaw: "Energy Regen%",
  energyRegenPercentRawBonus: "Energy Regen%",

  anomalyProficiency: "Anomaly Proficiency",
  anomalyMastery: "Anomaly Mastery",
  anomalyMasteryRaw: "Anomaly Mastery",
  anomalyMasteryPercent: "Anomaly Mastery%",
  anomalyDmgBonus: "Anomaly DMG Bonus",
  anomalyDmgBonusFlat: "Anomaly DMG Bonus",
  disorderDmgBonus: "Disorder DMG Bonus",
  disorderDmgBonusFlat: "Disorder DMG Bonus",
  disorderMultiplierBonus: "Disorder Multiplier",
  vortexDmgBonus: "Vortex DMG Bonus",
  vortexMultiplierBonus: "Vortex Multiplier",

  sheerForce: "Sheer Force",
  sheerDmgBonus: "Sheer DMG Bonus",
  sheerDmgFlat: "Sheer DMG Bonus",

  attributeDmgBonus: "Attribute DMG Bonus",
  fireDmgBonus: "Fire DMG Bonus",
  iceDmgBonus: "Ice DMG Bonus",
  electricDmgBonus: "Electric DMG Bonus",
  physicalDmgBonus: "Physical DMG Bonus",
  etherDmgBonus: "Ether DMG Bonus",
  windDmgBonus: "Wind DMG Bonus",
  critDamageElementalBonus: "Elemental CRIT DMG Bonus",

  defShred: "DEF Shred",
  fireResShred: "Fire RES Ignore",
  iceResShred: "Ice RES Ignore",
  electricResShred: "Electric RES Ignore",
  physicalResShred: "Physical RES Ignore",
  etherResShred: "Ether RES Ignore",
  windResShred: "Wind RES Ignore",

  refringeCoefficient: "Refringe Coefficient",
  luminizeMultiplierBonus: "Luminize Multiplier",
  assaultCritDmgBonus: "Assault CRIT DMG",
  assaultCritDmgTotal: "Assault CRIT DMG",
  dmgBonus: "DMG Bonus",

  global: "Global",
  element: "Element",
  skillType: "Skill Type",
  exclusive: "Exclusive",
  anomalyTypeDmg: "Anomaly Type",
};

function camelToTitle(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function formatStatName(key: string): string {
  if (!key) return "";

  const normalized = key.replace(RAW_SUFFIX_RE, "");

  if (STAT_NAMES[key]) return STAT_NAMES[key];
  if (STAT_NAMES[normalized]) return STAT_NAMES[normalized];

  return camelToTitle(key);
}

export function formatStatValue(
  key: string,
  value: number,
  options: { showSign?: boolean; decimals?: number } = {},
): string {
  const { showSign = true, decimals = 1 } = options;
  if (value === undefined || value === null || Number.isNaN(value)) return "";

  const isPercent =
    PERCENT_STATS.has(key) || PERCENT_STATS.has(key.replace(RAW_SUFFIX_RE, ""));
  const isDecimal =
    DECIMAL_STATS.has(key) || DECIMAL_STATS.has(key.replace(RAW_SUFFIX_RE, ""));

  const sign = showSign && value > 0 ? "+" : "";

  if (isPercent) {
    return `${sign}${(value * 100).toFixed(decimals)}%`;
  }
  if (isDecimal) {
    return `${sign}${value.toFixed(2)}`;
  }
  return `${sign}${Math.round(value).toLocaleString()}`;
}

export function formatStatDisplay(
  key: string,
  value: number,
  options?: { showSign?: boolean; decimals?: number },
): string {
  return `${formatStatName(key)}: ${formatStatValue(key, value, options)}`;
}
