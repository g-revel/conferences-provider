import { Conference } from "./conference.js";

// Liste connue des conférences où des membres de Shodo ont effectivement donné
// des talks. Connaissance interne fixe (pas une donnée à inférer) : pas besoin
// d'appel LLM, et aucun modèle — gratuit ou payant — ne la connaît mieux que Shodo.
const CONFERENCES: Conference[] = [
  { name: "Devoxx France" },
  { name: "BreizhCamp" },
  { name: "BDX I/O" },
  { name: "Sunny Tech" },
  { name: "Human Talks Nantes" },
  { name: "Nantes JUG" },
  { name: "Codeurs en Seine" },
  { name: "Touraine Tech" },
  { name: "SnowCamp" },
  { name: "MixIT" },
  { name: "DevFest Nantes" },
  { name: "Agile Tour Bordeaux" },
  { name: "Riviera DEV" },
  { name: "Voxxed" },
];

export async function getConferences(): Promise<Conference[]> {
  return [...CONFERENCES];
}
