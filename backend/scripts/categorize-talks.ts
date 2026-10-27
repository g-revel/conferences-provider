import { Speak } from "../src/collects/get-speaks/speak.js";
import { mentionsAI } from "../src/collects/get-speaks/mentionsAI.js";
import { normalizeCategory } from "../src/collects/get-speaks/categoryRenames.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { TALKS_PATH } from "../src/data/paths.js";

// Idempotent : un talk déjà migré vers `categories` (plus de `category`) et déjà
// taggé "IA" si pertinent n'est pas retouché par un re-run. On renormalise quand
// même les `categories` déjà présentes (pas seulement l'ancien `category` singulier)
// pour rattraper une entrée "AI" introduite entre-temps par une autre source
// (ex. import Notion) sans attendre une migration `category` -> `categories`.
function migrateCategory(talk: Speak & { category?: string | null }): string[] {
  if (talk.categories) return [...new Set(talk.categories.map(normalizeCategory))];
  if (!talk.category) return [];
  return [normalizeCategory(talk.category)];
}

async function main(): Promise<void> {
  const talks = await readJson<(Speak & { category?: string | null })[]>(TALKS_PATH, []);

  let migrated = 0;
  let aiFlagged = 0;
  const result: Speak[] = talks.map((talk) => {
    const categories = migrateCategory(talk);
    const { category: _category, ...rest } = talk;
    if (talk.category !== undefined) migrated++;

    const text = `${talk.title ?? ""} ${talk.description ?? ""}`;
    if (!categories.includes("IA") && mentionsAI(text)) {
      aiFlagged++;
      return { ...rest, categories: [...categories, "IA"] };
    }
    return { ...rest, categories };
  });

  await writeJson(TALKS_PATH, result);
  console.log(`${migrated} talk(s) migré(s) de \`category\` (string) vers \`categories\` (array).`);
  console.log(`${aiFlagged} talk(s) supplémentaire(s) taggé(s) "IA" (détection de mots-clés).`);
}

main();
