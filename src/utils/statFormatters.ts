// ─────────────────────────────────────────────────────────────────────
// Sets de clasificación
// ─────────────────────────────────────────────────────────────────────

/** Stats que se muestran como porcentaje (value * 100 + "%") */
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
  // RES shreds
  "fireResShred",
  "iceResShred",
  "electricResShred",
  "physicalResShred",
  "etherResShred",
  "windResShred",
  // Element DMG bonus keys
  "fireDmgBonus",
  "iceDmgBonus",
  "electricDmgBonus",
  "physicalDmgBonus",
  "etherDmgBonus",
  "windDmgBonus",
  // Skill-type / hit-exclusive context
  "critDamageElementalBonus",
]);

/** Stats planos (enteros, sin sufijo) */
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

/** Stats que usan 2 decimales sin sufijo */
const DECIMAL_STATS = new Set<string>(["energyRegen", "energyRegenRaw"]);

/** Variantes *Raw: se aplican después de multiplicadores. No cambian el label. */
const RAW_SUFFIX_RE = /Raw(Bonus)?$/;

// ─────────────────────────────────────────────────────────────────────
// Mapa de nombres legibles
// ─────────────────────────────────────────────────────────────────────

const STAT_NAMES: Record<string, string> = {
  // Básicos
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

  // Combate
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

  // Anomalía
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

  // Sheer / Rupture
  sheerForce: "Sheer Force",
  sheerDmgBonus: "Sheer DMG Bonus",
  sheerDmgFlat: "Sheer DMG Bonus",

  // Daño
  attributeDmgBonus: "Attribute DMG Bonus",
  fireDmgBonus: "Fire DMG Bonus",
  iceDmgBonus: "Ice DMG Bonus",
  electricDmgBonus: "Electric DMG Bonus",
  physicalDmgBonus: "Physical DMG Bonus",
  etherDmgBonus: "Ether DMG Bonus",
  windDmgBonus: "Wind DMG Bonus",
  critDamageElementalBonus: "Elemental CRIT DMG Bonus",

  // Penetración / Shred
  defShred: "DEF Ignore",
  fireResShred: "Fire RES Ignore",
  iceResShred: "Ice RES Ignore",
  electricResShred: "Electric RES Ignore",
  physicalResShred: "Physical RES Ignore",
  etherResShred: "Ether RES Ignore",
  windResShred: "Wind RES Ignore",

  // Especiales
  refringeCoefficient: "Refringe Coefficient",
  luminizeMultiplierBonus: "Luminize Multiplier",
  assaultCritDmgBonus: "Assault CRIT DMG",
  assaultCritDmgTotal: "Assault CRIT DMG",
};

// ─────────────────────────────────────────────────────────────────────
// Fallback para keys compuestas / desconocidas
// ─────────────────────────────────────────────────────────────────────

/**
 * Convierte camelCase → "Title Case With Spaces"
 * atkPercentRawBonus → "Atk Percent Raw Bonus"
 */
function camelToTitle(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ─────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────

/**
 * Devuelve un nombre legible para la stat.
 * Si la key es `*Raw` o `*RawBonus`, se normaliza al nombre base.
 */
export function formatStatName(key: string): string {
  if (!key) return "";

  // Normaliza variantes *Raw / *RawBonus al nombre base
  const normalized = key.replace(RAW_SUFFIX_RE, "");

  if (STAT_NAMES[key]) return STAT_NAMES[key];
  if (STAT_NAMES[normalized]) return STAT_NAMES[normalized];

  return camelToTitle(key);
}

/**
 * Devuelve el valor formateado con el sufijo correcto.
 * - Porcentaje: (value * 100).toFixed(decimals)% + signo
 * - Flat: Math.round o número tal cual
 * - Decimales: 2 decimales sin sufijo
 */
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

/**
 * Conveniencia: "Nombre: valor" listo para pintar.
 */
export function formatStatDisplay(
  key: string,
  value: number,
  options?: { showSign?: boolean; decimals?: number },
): string {
  return `${formatStatName(key)}: ${formatStatValue(key, value, options)}`;
}
