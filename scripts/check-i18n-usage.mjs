import fs from "node:fs";
import path from "node:path";

const appDir = path.resolve("app");
const baseLocaleDir = path.resolve("app/i18n/locales/en");

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value, fullKey);
    }
    return [fullKey];
  });
}

function walkFiles(dir, exts) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkFiles(fullPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const localeFiles = fs.readdirSync(baseLocaleDir).filter((f) => f.endsWith(".json"));
const mergedLocale = Object.assign(
  {},
  ...localeFiles.map((f) =>
    JSON.parse(fs.readFileSync(path.join(baseLocaleDir, f), "utf-8")),
  ),
);
const validKeys = new Set(flattenKeys(mergedLocale));

// i18next pluralization: t("some.key", { count }) resolves to "some.key_one",
// "some.key_other", etc. — never a literal "some.key" entry in the locale
// file. Treat a base key as valid if any of its plural-suffixed forms exist.
const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];
function hasPluralForm(key) {
  return PLURAL_SUFFIXES.some((suffix) => validKeys.has(`${key}_${suffix}`));
}

const files = walkFiles(appDir, [".tsx", ".ts"]).filter(
  (f) => !f.includes("/i18n/locales/"),
);

// Matches t("some.key"), t('some.key'), t(`some.key`) — string literals only.
// Dynamic keys like t(someVariable) can't be statically checked and are skipped.
const callPattern = /\bt\(\s*["'`]([a-zA-Z0-9_.\-]+)["'`]/g;

const missing = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  for (const match of content.matchAll(callPattern)) {
    const key = match[1];
    if (!validKeys.has(key) && !hasPluralForm(key)) {
      missing.push({ file: path.relative(process.cwd(), file), key });
    }
  }
}

if (missing.length > 0) {
  console.log("❌ Translation key(s) used in code but missing from locale files:");
  for (const { file, key } of missing) {
    console.log(`  ${file} → t("${key}")`);
  }
  console.log(
    "\nAdd the key to the relevant app/i18n/locales/en/*.json file (and ar/*.json).",
  );
  process.exit(1);
}

console.log("✅ All t() calls reference existing translation keys.");
