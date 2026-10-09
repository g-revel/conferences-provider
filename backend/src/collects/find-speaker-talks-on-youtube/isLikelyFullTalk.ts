import { YoutubeResult } from "../../youtube.functions.js";

// Trailers, extraits et shorts faussent la recherche sans jamais être un vrai
// talk complet. Durée inconnue (champ absent) : on ne filtre pas, par prudence.
const MIN_TALK_SECONDS = 10 * 60;

export function parseDurationSeconds(length: string | undefined): number | null {
  if (!length) return null;
  const parts = length.split(":").map(Number);
  if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) return null;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

export function isLikelyFullTalk(video: Pick<YoutubeResult, "length">): boolean {
  const seconds = parseDurationSeconds(video.length);
  return seconds === null || seconds >= MIN_TALK_SECONDS;
}
