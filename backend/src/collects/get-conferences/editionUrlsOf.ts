import { Conference } from "./conference.js";

export function editionUrlsOf(event: Conference): string[] {
  return [event.url, ...(event.pastEditionUrls ?? [])].filter((url): url is string => !!url);
}
