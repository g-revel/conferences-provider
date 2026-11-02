import { db } from "./db.js";
import { knownCities } from "./schema.js";

export async function readKnownCities(): Promise<string[]> {
  const rows = await db.select({ city: knownCities.city }).from(knownCities);
  return rows.map((row) => row.city);
}

// known-cities.json est une simple liste éditable (pas de fusion additive comme
// pour speakers/talks/conferences) — remplacement intégral, identique au
// comportement actuel de writeJson(KNOWN_CITIES_PATH, next) qui réécrit tout le
// fichier à chaque ajout/retrait.
export async function writeKnownCities(values: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(knownCities);
    if (values.length > 0) {
      await tx.insert(knownCities).values(values.map((city) => ({ city })));
    }
  });
}
