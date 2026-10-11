import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";

export interface Speak {
  conference: Conference;
  speakers: Speaker[];
  title?: string | null;
  videoUrl?: string | null;
  category?: string | null;
}
