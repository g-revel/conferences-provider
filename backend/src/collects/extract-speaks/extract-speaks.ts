import { Agent, fetch } from "undici";
import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { stripHtml } from "../../html.functions.js";
import { findMentionedSpeakers } from "./findMentionedSpeakers.js";
import { extractContextWindows, SpeakerContext } from "./extractContextWindows.js";
import { buildExtractionPrompt } from "./buildExtractionPrompt.js";
import { parseExtractionResponse } from "./parseExtractionResponse.js";
import { fillMissingCoPresenterTitles } from "./fillMissingCoPresenterTitles.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

// Mêmes leçons que get-conferences.ts (commit ebb2280) : le fetch global a un
// timeout fixe de 5 min côté undici, trop court pour une inférence locale lente,
// et un dispatcher custom n'est compatible qu'avec le fetch du même package undici.
const longRunningDispatcher = new Agent({ headersTimeout: 10 * 60 * 1000, bodyTimeout: 10 * 60 * 1000 });

// Un appel Ollama par candidat, pas un seul appel groupé pour tous les candidats
// d'une conférence : observé en pratique sur deux co-présentateurs du même talk
// (fenêtres de contexte identiques) — le modèle n'attribuait le titre qu'au
// premier nom du prompt et renvoyait `null` pour le second, dans le même appel.
async function extractTitleFor(
  context: SpeakerContext,
  conference: Conference,
  pageText: string,
): Promise<Speak[]> {
  const { system, user } = buildExtractionPrompt([context]);

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
  return parseExtractionResponse(data.message.content, conference, [context.speaker], pageText);
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
  const pageText = stripHtml(await pageResponse.text());

  // Filtrage déterministe d'abord : qui est vraiment sur la page (pas de LLM,
  // pas d'hallucination possible). S'il n'y a personne, pas d'appel Ollama du tout.
  const candidates = findMentionedSpeakers(pageText, knownSpeakers);
  if (candidates.length === 0) return [];

  const contexts = extractContextWindows(pageText, candidates);

  const speaks: Speak[] = [];
  for (const context of contexts) {
    speaks.push(...(await extractTitleFor(context, conference, pageText)));
  }
  return fillMissingCoPresenterTitles(speaks, pageText);
}
