import { Conference } from "./conference.js";
import { readJson } from "../../data/jsonStore.js";
import { EVENTS_PATH } from "../../data/paths.js";

export async function getConferences(): Promise<Conference[]> {
  return readJson<Conference[]>(EVENTS_PATH, []);
}
