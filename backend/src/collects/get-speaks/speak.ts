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
  // Lien candidat trouvé automatiquement (recherche web) mais pas encore validé par
  // un admin — jamais exposé comme `videoUrl` tant qu'il n'a pas été confirmé.
  pendingVideoUrl?: string | null;
  // Override admin : afficher ce talk publiquement même sans videoUrl connu.
  showWithoutLink?: boolean;
}
