import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";

export interface Speak {
  id: string;
  conference: Conference;
  speakers: Speaker[];
  title?: string | null;
  videoUrl?: string | null;
  // Un talk peut couvrir plusieurs thèmes (ex. une conférence DDD qui mentionne
  // aussi l'IA en passant) — pas une catégorie unique. Texte libre comme avant,
  // pas une enum séparée à maintenir.
  categories?: string[];
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
  // Override admin : afficher ce talk publiquement même sans année connue (il
  // apparaît alors après tous les talks datés, voir src/routes/talks.ts).
  showWithoutYear?: boolean;
  // État Notion ("Idée", "Scopé", "En construction") pour un talk importé qui n'est
  // pas encore "Construit" — absent pour un talk normal. Tant qu'un admin ne l'a
  // pas validé (voir `validated` ci-dessous), ce talk reste invisible du portail
  // quels que soient par ailleurs son lien/son année, et n'apparaît que dans
  // l'onglet admin portant ce nom (import-notion-export.ts).
  status?: string;
  // Override admin : confirme qu'un talk à l'état Notion non-"Construit" peut
  // rejoindre le flux normal (toujours soumis ensuite aux gates lien/année).
  validated?: boolean;
}
