import { Agent, fetch } from "undici";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { searchYoutube, YoutubeResult } from "../../youtube.functions.js";
import { isLikelyFullTalk } from "./isLikelyFullTalk.js";
import { detectCoPresenters } from "./detectCoPresenters.js";
import { buildVideoExtractionPrompt } from "./buildVideoExtractionPrompt.js";
import { parseVideoExtractionResponse } from "./parseVideoExtractionResponse.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

// Mêmes leçons que extract-speaks.ts (timeout fixe de 5 min côté undici, trop
// court pour une inférence locale lente).
const longRunningDispatcher = new Agent({ headersTimeout: 10 * 60 * 1000, bodyTimeout: 10 * 60 * 1000 });

async function classifyVideo(speaker: Speaker, video: YoutubeResult): Promise<{ conferenceName: string; title: string } | null> {
  const { system, user } = buildVideoExtractionPrompt(speaker, { title: video.title, author: video.author ?? "" });

  const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    dispatcher: longRunningDispatcher,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: { num_predict: 300, temperature: 0, repeat_penalty: 1.15 },
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
  return parseVideoExtractionResponse(data.message.content);
}

// Recherche YouTube par nom (pas par talk connu, contrairement à findTalkVideo)
// : source de découverte de *nouveaux* talks non encore répertoriés.
export async function findSpeakerTalksOnYoutube(speaker: Speaker, knownSpeakers: Speaker[]): Promise<Speak[]> {
  const results = await searchYoutube(`"${speaker.firstname} ${speaker.lastname}"`);
  const candidates = results.filter(isLikelyFullTalk);

  const speaks: Speak[] = [];
  for (const video of candidates) {
    const extraction = await classifyVideo(speaker, video);
    if (!extraction) continue;

    const coPresenters = detectCoPresenters(video.title, speaker, knownSpeakers);
    speaks.push({
      id: crypto.randomUUID(),
      conference: { name: extraction.conferenceName },
      speakers: [speaker, ...coPresenters],
      title: extraction.title,
      videoUrl: video.url,
    });
  }
  return speaks;
}
