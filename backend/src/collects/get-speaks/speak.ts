import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";

export interface Speak {
  id: string;
  conference: Conference;
  speakers: Speaker[];
  title?: string | null;
  videoUrl?: string | null;
  category?: string | null;
  format?: string | null;
  level?: string | null;
  language?: string | null;
  slidesUrl?: string | null;
  description?: string | null;
  year?: number | null;
  deletedAt?: string | null;
}
