const fs = require("fs");
const path = require("path");

const agentsFolder = path.join(__dirname, "src", "data", "agents");

const folders = ["anomaly", "attack", "defense", "stun", "support", "rupture"];

let totalFiles = 0;
let found = 0;

function checkValue(value, file, location) {
  if (typeof value === "string") {
    if (value.includes("/b")) {
      console.log(`⚠️ Encontrado en: ${file}`);
      console.log(`   Campo: ${location}`);
      console.log(`   Valor: ${value}`);
      console.log("");

      found++;
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      checkValue(item, file, `${location}[${index}]`);
    });

    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      // SOLO revisar los campos llamados "name" o "id"
      if (key === "name" || key === "id") {
        checkValue(child, file, key);
      }

      // Seguir recorriendo objetos y arrays para encontrar
      // name/id en cualquier nivel del JSON.
      if (child !== null && typeof child === "object") {
        checkValue(child, file, location === "$" ? key : `${location}.${key}`);
      }
    }
  }
}

for (const folderName of folders) {
  const folderPath = path.join(agentsFolder, folderName);

  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️ No existe la carpeta: ${folderName}`);
    continue;
  }

  console.log(`📁 Revisando: ${folderName}`);

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.toLowerCase().endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      const relativeFile = path.join(folderName, file);

      checkValue(data, relativeFile, "$");

      totalFiles++;
    } catch (error) {
      console.error(`❌ Error en ${folderName}/${file}: ${error.message}`);
    }
  }
}

console.log("");
console.log("--------------------------------");
console.log(`📄 JSON revisados: ${totalFiles}`);
console.log(`⚠️ Coincidencias: ${found}`);

if (found === 0) {
  console.log("✅ No se encontró ningún /b dentro de name o id.");
} else {
  console.log("❌ Hay campos name/id que necesitan revisión.");
}
