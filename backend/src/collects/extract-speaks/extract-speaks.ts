import { Agent, fetch } from "undici";
import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { stripHtml } from "../../html.functions.js";
import { findMentionedSpeakers } from "./findMentionedSpeakers.js";
import { extractContextWindows } from "./extractContextWindows.js";
import { findSpeakerProfileLinks } from "./findSpeakerProfileLinks.js";
import { buildExtractionPrompt } from "./buildExtractionPrompt.js";
import { parseExtractionResponse } from "./parseExtractionResponse.js";
import { fillMissingCoPresenterTitles } from "./fillMissingCoPresenterTitles.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

// Mêmes leçons que get-conferences.ts (commit ebb2280) : le fetch global a un
// timeout fixe de 5 min côté undici, trop court pour une inférence locale lente,
// et un dispatcher custom n'est compatible qu'avec le fetch du même package undici.
const longRunningDispatcher = new Agent({ headersTimeout: 10 * 60 * 1000, bodyTimeout: 10 * 60 * 1000 });

// Un speaker qui intervient depuis plusieurs éditions peut avoir plusieurs talks
// listés sur sa page profil (observé : bio + talk 2026, puis d'anciens talks à la
// suite) — sans tronquer, le modèle mélange les intitulés des différentes années.
// Le talk courant apparaît en premier ; on coupe avant que le suivant commence.
const MAX_PROFILE_TEXT_CHARS = 1800;

async function fetchStrippedText(url: string, maxChars?: number): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = stripHtml(await response.text());
    return maxChars ? text.slice(0, maxChars) : text;
  } catch {
    return null;
  }
}

// Un appel Ollama par candidat, pas un seul appel groupé pour tous les candidats
// d'une conférence : observé en pratique sur deux co-présentateurs du même talk
// (fenêtres de contexte identiques) — le modèle n'attribuait le titre qu'au
// premier nom du prompt et renvoyait `null` pour le second, dans le même appel.
async function extractTitleFor(
  speaker: Speaker,
  context: string,
  conference: Conference,
  verificationText: string,
): Promise<Speak[]> {
  const { system, user } = buildExtractionPrompt([{ speaker, context }]);

  const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    dispatcher: longRunningDispatcher,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: { num_predict: 2000, temperature: 0, repeat_penalty: 1.15 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!ollamaResponse.ok) {
    throw new Error(`Ollama error ${ollamaResponse.status}: ${await ollamaResponse.text()}`);
  }

  const data = (await ollamaResponse.json()) as { message: { content: string } };
  return parseExtractionResponse(data.message.content, conference, [speaker], verificationText);
}

export async function extractSpeaksFromConference(
  conference: Conference,
  knownSpeakers: Speaker[],
): Promise<Speak[]> {
  if (!conference.url) return [];

  const pageResponse = await fetch(conference.url);
  if (!pageResponse.ok) {
    throw new Error(`Impossible de récupérer ${conference.url} : ${pageResponse.status}`);
  }
  const html = await pageResponse.text();
  const pageText = stripHtml(html);

  // Filtrage déterministe d'abord : qui est vraiment sur la page (pas de LLM,
  // pas d'hallucination possible). S'il n'y a personne, pas d'appel Ollama du tout.
  const candidates = findMentionedSpeakers(pageText, knownSpeakers);
  if (candidates.length === 0) return [];

  // Certains sites ont une page dédiée par speaker (liée depuis le programme) —
  // bien plus fiable pour le titre qu'une fenêtre de texte dans la grosse page
  // programme (page courte, entièrement consacrée à cette personne). Fallback sur
  // la fenêtre de contexte habituelle quand aucune page dédiée n'est trouvée.
  const profileLinks = findSpeakerProfileLinks(html, candidates);
  const windows = new Map(extractContextWindows(pageText, candidates).map((c) => [c.speaker, c.context]));

  const speaks: Speak[] = [];
  for (const speaker of candidates) {
    const profileHref = profileLinks.get(speaker);
    const profileText = profileHref
      ? await fetchStrippedText(new URL(profileHref, conference.url).toString(), MAX_PROFILE_TEXT_CHARS)
      : null;

    const context = profileText ?? windows.get(speaker) ?? "";
    const verificationText = profileText ?? pageText;

    speaks.push(...(await extractTitleFor(speaker, context, conference, verificationText)));
  }
  return fillMissingCoPresenterTitles(speaks, pageText);
}
