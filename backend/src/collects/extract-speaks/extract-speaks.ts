import { Agent, fetch } from "undici";
import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { stripHtml } from "../../html.functions.js";
import { buildExtractionPrompt } from "./buildExtractionPrompt.js";
import { parseExtractionResponse } from "./parseExtractionResponse.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

// Mêmes leçons que get-conferences.ts (commit ebb2280) : le fetch global a un
// timeout fixe de 5 min côté undici, trop court pour une inférence locale lente,
// et un dispatcher custom n'est compatible qu'avec le fetch du même package undici.
const longRunningDispatcher = new Agent({ headersTimeout: 10 * 60 * 1000, bodyTimeout: 10 * 60 * 1000 });

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

  const { system, user } = buildExtractionPrompt(pageText, knownSpeakers);

  const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    dispatcher: longRunningDispatcher,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: { num_predict: 3000, temperature: 0.2, repeat_penalty: 1.15 },
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
  return parseExtractionResponse(data.message.content, conference, knownSpeakers, pageText);
}
