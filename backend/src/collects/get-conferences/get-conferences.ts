import { Conference } from "./conference.js";
import { readConferences } from "../../data/conferencesStore.js";

export async function getConferences(): Promise<Conference[]> {
  return readConferences();
}
