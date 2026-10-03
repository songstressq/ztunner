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
  "lacerationDmg",
  "anomalyTypeDmg",
  "disorderTypeDmg",
  "vortexDmg",
  "vortexMultiplier",
  "disorderMultiplier",
  "skillTypeElemental",
  "skillTypeElementalSheer",
  "skillTypeElementalSharp",
  "skillTypeStat",
  "elementSheerDmg",
  "elementExclusive",
  "elementSharpDmg",
  "hitExclusive",
  "sheerDmg",
  "sharpDmg",
  "exclusive",
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
  fireResShred: "Fire RES Shred",
  iceResShred: "Ice RES Shred",
  electricResShred: "Electric RES Shred",
  physicalResShred: "Physical RES Shred",
  etherResShred: "Ether RES Shred",
  windResShred: "Wind RES Shred",

  refringeCoefficient: "Refringe Coefficient",
  luminizeMultiplierBonus: "Luminize Multiplier",
  assaultCritDmgBonus: "Assault CRIT DMG",
  assaultCritDmgTotal: "Assault CRIT DMG",
  dmgBonus: "DMG Bonus",
  lacerationDmg: "Laceration DMG",

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

// ─────────────────────────────────────────────────────────────
// DamageBonus label formatter
// Maneja los tipos compuestos (element + skillType + anomalyType)
// reutilizando formatStatName para los casos simples.
// ─────────────────────────────────────────────────────────────

interface DamageBonusLike {
  type?: string;
  value?: number;
  element?: string;
  skillType?: string;
  anomalyType?: string;
  stat?: string;
  hitName?: string;
  hitNames?: string[];
}

const SKILL_TYPE_DISPLAY: Record<string, string> = {
  basic: "Basic",
  dash: "Dash",
  counter: "Dodge Counter",
  quickAssist: "Quick Assist",
  perfectAssist: "Defensive Assist",
  followup: "Assist Follow-Up",
  special: "Special",
  ex: "EX Special",
  chain: "Chain",
  ultimate: "Ultimate",
  mindscape: "Mindscape",
};

function capitalizeWord(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function displaySkillType(skillType?: string): string {
  if (!skillType) return "";
  return SKILL_TYPE_DISPLAY[skillType] ?? capitalizeWord(skillType);
}

function displayElement(element?: string): string {
  if (!element) return "";
  return capitalizeWord(element);
}

export function formatDamageBonusLabel(
  bonus: DamageBonusLike | null | undefined,
): string {
  if (!bonus?.type) return "Bonus";

  const type = bonus.type;
  const elementName = displayElement(bonus.element);
  const skillName = displaySkillType(bonus.skillType);
  const anomalyName = capitalizeWord(bonus.anomalyType);

  switch (type) {
    // ── Básicos ──
    case "global":
      return "Global DMG";

    case "element":
      return elementName ? `${elementName} DMG` : "Element DMG";

    case "skillType":
      return skillName ? `${skillName} DMG` : "Skill Type DMG";

    case "exclusive":
      return "Skill-Exclusive DMG";

    case "elementExclusive":
      return elementName
        ? `${elementName} Skill-Exclusive DMG`
        : "Skill-Exclusive DMG";

    case "hitExclusive":
      return bonus.hitName ? `${bonus.hitName} DMG` : "Hit-Specific DMG";

    // ── Sheer ──
    case "sheerDmg":
      return "Sheer DMG Bonus";

    case "elementSheerDmg":
      return elementName ? `${elementName} Sheer DMG Bonus` : "Sheer DMG Bonus";

    case "skillTypeElementalSheer":
      return elementName && skillName
        ? `${elementName} ${skillName} Sheer DMG`
        : "Skill Sheer DMG";

    // ── SkillType + Element / Stat ──
    case "skillTypeElemental":
      return elementName && skillName
        ? `${elementName} ${skillName} DMG`
        : "Skill/Element DMG";

    case "skillTypeStat":
      return skillName
        ? `${skillName} ${bonus.stat ? formatStatName(bonus.stat) : "Stat"}`
        : "Skill Type Stat";

    // ── CRIT ──
    case "critDamageElementalBonus":
      return elementName ? `${elementName} CRIT DMG` : "Elemental CRIT DMG";

    case "assaultCritDmgBonus":
    case "assaultCritDmgTotal":
      return "Assault CRIT DMG";

    // ── Anomaly ──
    case "anomalyDmgBonus":
    case "anomalyDmgBonusFlat":
      return "Anomaly DMG Bonus";

    case "disorderDmgBonus":
    case "disorderDmgBonusFlat":
      return "Disorder DMG Bonus";

    case "disorderMultiplier":
    case "disorderMultiplierBonus":
      return "Disorder Multiplier";

    case "anomalyTypeDmg":
      return anomalyName ? `${anomalyName} DMG` : "Anomaly Type DMG";

    case "disorderTypeDmg":
      return anomalyName ? `${anomalyName} Disorder DMG` : "Disorder Type DMG";

    // ── Vortex ──
    case "vortexDmg":
    case "vortexDmgBonus":
      return "Vortex DMG Bonus";

    case "vortexMultiplier":
    case "vortexMultiplierBonus":
      return "Vortex Multiplier";

    // ── Refringe / Luminize ──
    case "refringeCoefficient":
      return "Refringe Coefficient";

    case "luminizeMultiplierBonus":
      return "Luminize Multiplier";

    // ── Sharp ──
    case "sharpDmg":
      return "Sharp DMG Bonus";

    case "elementSharpDmg":
      return elementName
        ? `${elementName} Sharp DMG Bonus`
        : "Elemental Sharp DMG Bonus";

    case "skillTypeElementalSharp":
      return elementName && skillName
        ? `${elementName} ${skillName} Sharp DMG`
        : "Skill Sharp DMG";

    // ── Fallback: usar STAT_NAMES / camelToTitle ──
    default:
      return formatStatName(type);
  }
}

// ─────────────────────────────────────────────────────────────
// Anomaly Type / Attribute display names
// Usado en los NeonSelect de Disorder, Vortex y Luminize.
// ─────────────────────────────────────────────────────────────

const ANOMALY_TYPE_DISPLAY: Record<string, string> = {
  // Anomaly Types
  windswept: "Windswept",
  burn: "Burn",
  shock: "Shock",
  corruption: "Corruption",
  shatter: "Shatter",
  assault: "Assault",
  frost: "Frost",
  auricink: "Auric Ink",
  honededge: "Honed Edge",
  // Atributos base (fallback para lumiflux, wind, etc.)
  fire: "Fire",
  ice: "Ice",
  electric: "Electric",
  physical: "Physical",
  ether: "Ether",
  wind: "Wind",
  lumiflux: "Lumiflux",
};

export function formatAnomalyType(type?: string): string {
  if (!type) return "";
  const normalized = type.toLowerCase().replace(/\s+/g, "");
  if (ANOMALY_TYPE_DISPLAY[normalized]) {
    return ANOMALY_TYPE_DISPLAY[normalized];
  }
  // Fallback: camelCase → Title Case
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
