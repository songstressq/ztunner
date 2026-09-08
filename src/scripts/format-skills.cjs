const fs = require("fs");
const path = require("path");

const baseFolder = path.join(__dirname, "src", "data", "agents");
const targetFolders = [
  "anomaly",
  "attack",
  "defense",
  "rupture",
  "stun",
  "support",
];

const replacements = [
  "Basic Attack",
  "Assist Follow-Up",
  "Chain Attack",
  "Ultimate",
  "Quick Assist",
  "Perfect Dodge",
  "Defensive Assist",
  "Dodge Counter",
  "Dash Attack",
  "Assist Points",
  "Abloom",
  "Disorder",
  "Polarity Disorder",
  "Vital View",
  "Piledriver Attack",
  "Burst Mode",
  "Drill Attack",
  "Electro Quivers",
  "Electro Prison",
  "Dash Attack: Hiten no Tsuru - Slash",
  "Basic Attack: Falling Feather",
  "Awakened",
  "X-Marked",
  "Basic Attack: Cloud Piercer",
  "Ha-Oto no Ya",
  "Falling Feather",
  "All-Out Cheering",
  "Fandom Power",
  "Moment of Delusion",
  "Basic Attack: Perfect Pitch",
  "Ether Veil: Delusion Reprise",
  "EX Special Attack: Fall Into Delusion",
  "Basic Attack: Sweet Melody",
  "Special Attack: Full-Sugar Electronica - No Ice",
  "EX Special Attack: Intense Heat Stirring Method",
  "EX Special Attack: Intense Heat Stirring Method - Double Shot",
  "Nitro-Fuel Cocktail",
  "Shimotsuki Stance",
  "Fallen Frost",
  "Gnawed",
  "Passion Stream",
  "Basic Attack: Salchow Jump",
  "EX Special Attack: Really Heavy",
  "EX Special Attack: Engine Spin",
  "Special Attack: Tire Spin",
  "Basic Attack: Sweeping Edge",
  "Trial by Cold",
  "Special Attack: Execution - Descending Frost",
  "Special Attack: Execution - Layered Frost",
  "Corrosive Chill",
  "EX Special Attack: Execution - Merciless Judgment",
  "EX Special Attack: Execution - Shrouded in Shadow",
  "Absolute Order",
  "Bound Absolution",
  "Basic Attack: Sweeping Edge",
  "Shinrabanshou",
  "Swift Ruten",
  "Basic Attacks",
  "Jougen",
  "Kagen",
  "Sweeping Cyclone",
  "EX Special Attack: Wind Shear - Purifying Rise",
  "Vital View",
  "Venom",
  "Serpentine Shadow",
  "Corrode Bone",
  "Special Attack: Bared Fangs",
  "EX Special Attack: Venomous Bite",
  "Basic Attack: Tongue Flick",
  "Ether Veil: Cold-Blooded",
  "Flash Freeze",
  "Flash Freeze Charge",
  "Quick Charge",
  "Dash Attack: Arctic Ambush",
  "Roaming",
  "Dash Attacks",
  "Quick Charge",
  "EX Special Attack: Tail Swipe",
  "Binding Seal",
  "Burning Embers",
  "Garrote",
  "Decibels",
  "Burning Tether Point",
  "Chain Attack: Lunalux - Snare",
  "Lunalux Garrote",
  "Basic Attack: Garrote - First Form",
  "Burning Tether Points",
  "Lunalux Garrotes",
  "Dance of Awakened Fire",
  "Basic Attack: Dark Abyss Quartet",
  "Dodge Counter: Phantasm - Slash",
  "Quick Assist: Elegy",
  "EX Special Attack: Fiery Eruption",
  "Solar Prominence",
  "Basic Attack: Celestial Light",
  "Perfect Block",
  "Heavy Defensive Assist",
  "EX Special Attack: Sun's Halo",
  "White Thunder",
  "Silver Star",
  "Aftershock",
  "Fire Suppression",
  "Dash Attack: Phantasm Dash",
  "Enlightened Mind",
  "Qingming Sword Force",
  "Basic Attack: Enlightened Mind - Skyward Ascent",
  "Basic Attack: Enlightened Mind - Splitting Currents",
  "Basic Attack: Enlightened Mind - Sunderlight Annihilation",
  "EX Special Attack: Enlightened Mind - Soaring Light",
  "Basic Attack: Enlightened Mind - Sunderlight",
  "Culmination",
  "Ether Veil: Verdict",
  "Basic Attack: Swiftedge",
  "Ultimate: Cleaving Heavens",
  "Ultimate: Chasing Storms",
  "Enhanced Shotshell",
  "Dash Attack: Firepower Offensive",
  "Suppressive Mode",
  "Assault Mode",
  "Enhanced Shotshells",
  "Ether Buckshot",
  "Modified Master Firearm",
  "Block Counter",
  "Shield",
  "Retaliation",
  "Special Attack: Roaring Thrust",
  "EX Special Attack: Overpowered Shield Bash",
  "Special Attack: Shockwave Shield Bash",
  "Special Attack: Touch of Death",
  "Break Force",
  "EX Special Attack: Mountainous Pulse Strike",
  "Resolve",
  "Finishing Move",
  "EX Special Attack: Thunder Shield Rush - High Voltage",
  "Basic Attack: Final Verdict",
  "Frostbite Points",
  "Ether Veil",
  "Ether Veil: Wellspring",
  "Special Attack: Shatterfrost Surge",
  "EX Special Attack: Frostflow Tundra",
  "EX Special Attack",
  "Special Attack",
  "Dash Attack: Hiten no Tsuru",
  "Basic Attack: Enlightened Mind - Sunderlight Maximum",
  "Visage of Wrath",
  "Wrathful Fires",
  "Basic Attack: Toppling Mountain",
  "EX Special Attacks",
  "Dodge: Battle Cry",
  "Basic Attack: Towering Peaks",
  "Basic Attack: Majestic Summit",
  "Dodge: Overcome Peaks",
  "Dodge: Immovable Mountain",
  "Basic Attack: Immolate",
  "EX Special Attack: One's Path",
  "EX Special Attack: Earth Shaker",
  "Perfect Cancel",
  "Mountain's Might",
  "Molten Edge",
  "Blazing Heart",
  "Special Attack: Return to Ashes",
  "Special Attack: Return to Ashes - Sacrifice",
  "Special Attack: Drive Suppression",
  "Determination",
  "Perfect Dodges",
  "Dodge Counter: Afterfire Spin",
  "EX Special Attack: Cool Wheelie",
  "Special Attack: Run Wild",
  "Basic Attack: Knight's Technique",
  "Dodge: Through the Galaxy",
  "Special Attack: Drive Suppression",
  "Dodge Counter: Duel King",
  "Dodge: Through the Galaxy",
  "EX Special Attack: Rocking Footwork",
  "Special Attack: Run Wild",
  "PassionHeat",
  "Blasting",
  "Basic Attack: Crushing Strike",
  "Basic Attack: Frostbite Embrace",
  "Special Attack: Surging Cold",
  "Crushing Pursuit",
  "EX Special Attack: Glacial Crush",
  "EX Special Attack: Frost Coil",
  "Ultimate: Final Act - Crossing the River of Regret",
  "Basic Attack: Cirrus Strike",
  "Auric Ink Point",
  "Dodge: Nimbus Step",
  "Basic Attack: Qingming Eruption",
  "Basic Attack: Auric Array",
  "Light as Air",
  "Heavy Defensive Assist",
  "Talisman Attack",
  "EX Special Attack: Celestial Cloud Blitz - Break",
  "EX Special Attack: Ashen Ink Becomes Shadows",
  "EX Special Attack: Cloud-Shaper",
  "Auric Ink Points",
  "Technique Points",
  "Basic Attack: Thunderbolt",
  "Basic Attack: Happy to Be of Service",
  "Customer Complaint",
  "Might",
  "Momentum",
  "Dash Attack: Tiger Seven Forms - Tiger Charge",
  "Chain Attack: Suppressing Tiger Cauldron",
  "Hu Wei",
  "Fiery Spin",
  "Furnace Fire",
  "Morale Burst",
  "Morale",
  "Downbeats",
  "Basic Attack: Adorable Explosive Impact",
  "Chain Attacks",
  "Ultimates",
  "EX Special Attacks",
  "Ether Veil: Delusion Reprise",
  "Top Hat Companion",
  "Preheated Chamber",
  "En-Nah Turrets",
  "En-Nah Turret",
  "En-Nah Barrage",
  "High-Explosive Warhead",
  "Armor-Piercing Warhead",
  "Evasive Assist",
  "Hunter's Gait",
  "Special Attack: Rending Claw - Nightmare Shadow",
  "Flash Connect Voltage",
  "Basic Attack: Enchanted Moonlit Blossoms",
  "Flash Connect",
  "Subjugation",
  "Core Passive: Eternal Seasons",
  "Sniper Stance",
  "Purge",
  "Basic Attack: Harmonizing Shot",
  "Basic Attack: Harmonizing Shot - Tartarus",
  "Coordinated Support",
  "Drusilla and Anastella",
  "Drusilla",
  "Anastella",
  "Basic Attack: Shoo the Fool",
  "Idyllic Cadenza",
  "Tremolo",
  "Core Passive: Graceful Andante",
  "Tone Clusters",
  "Tremolos",
  "Basic Attack: Interlude",
  "Special Attack: Windchimes & Oaths",
  "Basic Attack: Finale",
  "Basic Attack: Chorus",
  "Chord",
  "Precise Assist",
  "Whim",
  "Dream",
  "Dream Points",
  "Harmony",
  "Darkbreaker",
  "Starlight Convergence",
  "Cheer On!",
  "Line Drive",
  "Fly Ball",
  "Vortex",
  "Fly the Flag",
  "Cat's Gaze",
  "Claw Sharpeners",
  "Ether Veil",
  "Bubblegum",
  "Angelic Chord-ination",
  "EX Special Attack: Bubblegum Barrage",
  "EX Special Attack: Special Photography Technique",
  "Sugar Points",
  "Basic Attack: Hard Candy Shot",
  "Sweet Scare",
  "Basic Attack: Sugarburst Sparkles",
  "Basic Attack: Sugarburst Sparkles - Max",
  "Assist Follow-Up: Stuffed Hard Candy Shot",
  "Basic Attack: Tanuki Cloak",
  "Quick Assist: Dessert Time",
  "Assist Follow-Up: We Have Cookies",
  "Dodge Counter: Time for Payback~",
  "Flavor Match",
]
  .map((s) => s.trim()) // elimina espacios al inicio/final
  .filter((s) => s.length > 0) // descarta vacíos
  .filter((s, i, arr) => arr.indexOf(s) === i); // elimina duplicados

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Ordenar por longitud descendente
const sortedReplacements = [...replacements].sort(
  (a, b) => b.length - a.length,
);
const pattern = sortedReplacements.map(escapeRegex).join("|");

// Expresión regular con protecciones:
// - No reemplazar si va precedido de "("  → (?<!\()
// - No reemplazar si ya tiene "/b" delante → (?<!\/b)
// - No reemplazar si ya tiene "//b" detrás → (?!\/\/b)
// - No reemplazar si va seguido de ")"   → (?!\))
const regex = new RegExp(
  `(?<![(])(?<!\\/b)(?:${pattern})(?!\\/\\/b)(?![)])`,
  "g",
);

function processSkills(value) {
  if (typeof value === "string") {
    return value.replace(regex, (match) => `/b${match}//b`);
  }
  if (Array.isArray(value)) {
    return value.map(processSkills);
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = processSkills(child);
    }
    return result;
  }
  return value;
}

// --- Procesamiento de carpetas ---
let totalProcessed = 0;

for (const subFolder of targetFolders) {
  const folder = path.join(baseFolder, subFolder);

  if (!fs.existsSync(folder)) {
    console.warn(`⚠️ Carpeta no encontrada, omitiendo: ${folder}`);
    continue;
  }

  console.log(`\n📁 Procesando carpeta: ${subFolder}`);

  const files = fs
    .readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".json"));

  let folderProcessed = 0;

  for (const file of files) {
    const filePath = path.join(folder, file);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      if (!data.skills) {
        console.log(`  ⚠️ Sin "skills": ${file}`);
        continue;
      }

      data.skills = processSkills(data.skills);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");

      console.log(`  ✅ Procesado: ${file}`);
      folderProcessed++;
    } catch (error) {
      console.error(`  ❌ Error en ${file}:`, error.message);
    }
  }

  console.log(`✨ Archivos procesados en ${subFolder}: ${folderProcessed}`);
  totalProcessed += folderProcessed;
}

console.log(`\n🎉 Total de archivos procesados: ${totalProcessed}`);
