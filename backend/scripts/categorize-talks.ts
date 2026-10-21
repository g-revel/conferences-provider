import { Speak } from "../src/collects/get-speaks/speak.js";
import { mentionsAI } from "../src/collects/get-speaks/mentionsAI.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { TALKS_PATH } from "../src/data/paths.js";

// "AI" et "IA & Data" désignaient le même thème sous deux noms différents —
// une seule catégorie "IA" désormais. Idempotent : un talk déjà migré vers
// `categories` (plus de `category`) et déjà taggé "IA" si pertinent n'est pas
// retouché par un re-run.
const CATEGORY_RENAMES: Record<string, string> = { AI: "IA", "IA & Data": "IA" };

function migrateCategory(talk: Speak & { category?: string | null }): string[] {
  if (talk.categories) return talk.categories;
  if (!talk.category) return [];
  return [CATEGORY_RENAMES[talk.category] ?? talk.category];
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
