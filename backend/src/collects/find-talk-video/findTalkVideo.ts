import { Speak } from "../get-speaks/speak.js";
import { searchYoutube } from "../../youtube.functions.js";
import { pickBestVideoMatch } from "./pickBestVideoMatch.js";

export async function findTalkVideo(speak: Speak): Promise<string | null> {
  if (speak.title == null) return null;

  const [firstSpeaker] = speak.speakers;
  const query = `"${firstSpeaker.lastname}" ${speak.title}`;
  const results = await searchYoutube(query);

  return pickBestVideoMatch(results, speak.speakers);
}
