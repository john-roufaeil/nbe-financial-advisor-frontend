import fs from "node:fs";
import path from "node:path";

const localesDir = path.resolve("app/i18n/locales");
const languages = fs
  .readdirSync(localesDir)
  .filter((f) => fs.statSync(path.join(localesDir, f)).isDirectory());

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value, fullKey);
    }
    return [fullKey];
  });
}

function loadNamespaceKeys(lang) {
  const dir = path.join(localesDir, lang);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const keys = {};
  for (const file of files) {
    const ns = path.basename(file, ".json");
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    keys[ns] = new Set(flattenKeys(content));
  }
  return keys;
}

if (languages.length < 2) {
  console.log("Only one locale found, nothing to compare.");
  process.exit(0);
}

const [baseLang, ...otherLangs] = languages;
const baseKeys = loadNamespaceKeys(baseLang);
let hasMismatch = false;

for (const lang of otherLangs) {
  const compareKeys = loadNamespaceKeys(lang);
  const namespaces = new Set([...Object.keys(baseKeys), ...Object.keys(compareKeys)]);

  for (const ns of namespaces) {
    const a = baseKeys[ns] ?? new Set();
    const b = compareKeys[ns] ?? new Set();
    const missingInB = [...a].filter((k) => !b.has(k));
    const missingInA = [...b].filter((k) => !a.has(k));

    if (missingInB.length || missingInA.length) {
      hasMismatch = true;
      console.log(`❌ Mismatch in "${ns}" (${baseLang} vs ${lang}):`);
      if (missingInB.length) console.log(`  Missing in ${lang}: ${missingInB.join(", ")}`);
      if (missingInA.length) console.log(`  Missing in ${baseLang}: ${missingInA.join(", ")}`);
    }
  }
}

if (hasMismatch) {
  console.log("\nAdd the missing keys to keep locales in sync.");
  process.exit(1);
}

console.log("✅ All locale files have matching keys.");