@architecture.md

# Backend — Conferences Providers

## Commandes essentielles

```bash
npm run dev        # Démarrer en mode développement
npm run typecheck  # Vérifier les types
npm run build      # Compiler vers dist/
npm run test       # Lancer les tests unitaires (Vitest)
npm run eval       # Lancer les evals promptfoo
npx promptfoo view # Ouvrir l'UI web des résultats (http://localhost:15500)

# Pipeline de découverte des talks (exécution manuelle, pas de CI) :
npm run refresh:speakers           # Slack -> data/speakers.json (additif)
npm run refresh:events:heavy       # SearXNG -> url + pastEditionUrls (5 éditions) dans data/events.json
npm run refresh:events:light       # fetch + Ollama -> data/talks.json (additif, toutes les éditions connues de chaque event)
npm run refresh:videos             # SearXNG (youtube) -> videoUrl sur les talks déjà connus sans lien vidéo
npm run refresh:priority-speakers  # SearXNG (youtube) + Ollama -> nouveaux talks pour Topcu/Pierrain/Castelein
```

## Conventions

- Chaque domaine fonctionnel = un fichier dans `src/routes/`
- Chaque plugin partagé = un fichier dans `src/plugins/`, enveloppé avec `fastify-plugin`
- Toujours enregistrer les nouvelles routes dans `src/app.ts`
- Ne pas lire `process.env` hors de `src/index.ts` et `src/app.ts`

## ESM

Le projet est en mode ESM (`"type": "module"`). Toujours mettre l'extension `.js` sur les imports relatifs :

```ts
import { buildApp } from './app.js'       // ✅
import { buildApp } from './app'          // ❌ erreur Node16
```

## Pipeline de découverte des talks

Le but du projet : pour chaque événement connu (ex. "BreizhCamp"), retrouver la page de l'édition en cours, en extraire les speakers, et croiser avec les membres Shodo (Slack) pour lister tous les talks donnés par des membres Shodo. Le résultat alimente le portail frontend (lien cliquable vers chaque conférence).

### Stockage : `data/` (fichiers JSON statiques, suivis par git)

- **`data/events.json`** — événements connus, avec `url` (édition en cours, nullable tant qu'elle n'a pas été trouvée) et `pastEditionUrls` (éditions antérieures, optionnel). Saisi/complété manuellement + par `refresh:events:heavy`.
- **`data/speakers.json`** — cache des membres Shodo (sortie de `getAllSpeakers()`), rempli par `refresh:speakers`.
- **`data/talks.json`** — talks trouvés `{ conference, speakers: Speaker[], title, videoUrl }`, rempli par `refresh:events:light` (`videoUrl` par `refresh:videos`, de nouveaux talks par `refresh:priority-speakers`). `speakers` est un tableau (pas un singulier) : un talk co-animé par deux membres Shodo est **une seule entrée** avec les deux dans `speakers`, pas deux entrées dupliquées — voir `groupCoPresentedTalks.ts` ci-dessous. Contient volontairement des entrées `title: null` (repère pour `mergeSpeaks.ts`, voir ci-dessous) — **`GET /api/talks` (`src/routes/talks.ts`) les filtre avant de servir** : un talk sans titre n'a aucune valeur pour l'utilisateur du portail, il ne doit jamais apparaître côté frontend, même si la donnée brute le garde en interne.

Module partagé `src/data/jsonStore.ts` (`readJson`/`writeJson`) + `src/data/paths.ts` (chemins absolus vers `data/`, résolus via `import.meta.url` donc valides en dev (`src/`) comme en build (`dist/`)).

**Tous les runs sont additifs** (jamais de réécriture totale) : chaque `merge*` (`mergeSpeakers.ts`, `mergeSpeaks.ts`, `updateEventUrls.ts`) ne fait qu'ajouter/mettre à jour des entrées sur une clé d'identité, jamais en supprimer. Aucune automatisation CI — ces scripts (`scripts/refresh-*.ts`, lancés via `tsx`) sont exécutés manuellement par l'utilisateur.

`mergeSpeaks.ts` (persistance entre runs) a une clé d'identité à deux niveaux à cause du regroupement multi-speakers : un talk **titré** s'identifie par `conference.name + titre` (les speakers s'ajoutent/s'unissent sur cette clé au fil des runs) ; un talk **sans titre connu** s'identifie par `conference.name + speaker` (un titre non trouvé ne permet pas de savoir si deux talks sans titre sont le même talk). Quand un run ultérieur trouve enfin le titre d'un speaker jusque-là sans titre, son ancienne entrée `title: null` est supprimée (remplacée par/fusionnée dans l'entrée titrée) plutôt que de laisser un doublon.

### Collects (src/collects/)

| Collect | Fichier | Pattern |
|---|---|---|
| `getConferences()` | `get-conferences/get-conferences.ts` | Lit `data/events.json`, pas de LLM |
| `getAllSpeakers()` | `get-all-speakers/get-all-speakers.ts` | Lookup Slack (`@slack/web-api`), pas de LLM |
| `extractSpeaksFromConference()` | `extract-speaks/extract-speaks.ts` | **Run léger** : fetch l'url d'**une** édition d'un event (appelé une fois par édition connue par le script), pipeline déterministe + Ollama (détail ci-dessous) |
| `findConferenceEditionUrl(s)()` | `find-conference-editions/find-conference-editions.ts` | **Run lourd** : SearXNG local, `findConferenceEditionUrl(name, year)` pour une année, `findConferenceEditionUrls(name)` balaie 5 éditions (année courante → -4) |
| `findTalkVideo()` | `find-talk-video/findTalkVideo.ts` | SearXNG (moteur `youtube`) : cherche un lien vidéo pour un talk **déjà connu** (titre déjà trouvé), pas de LLM |
| `findSpeakerTalksOnYoutube()` | `find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.ts` | SearXNG (moteur `youtube`) + Ollama : découvre de **nouveaux** talks en cherchant un speaker par nom |

⚠️ `get-speaks/get-speaks.ts` (ancienne signature `getSpeaks(conferences, speakers) => Speak[]`, jamais implémentée — `throw new Error("not implemented")`) est **superseded** par `extract-speaks.ts` : le rapprochement conférence↔speaker se fait maintenant via fetch+Ollama plutôt qu'en mémoire à partir des deux listes complètes. L'eval `tests/evals/get-speaks.yaml` qui ciblait ce stub échouera donc toujours — à supprimer avec le stub si l'occasion se présente.

**Pourquoi pas un LLM pour `getConferences()` ?** Historique de cette session : Mistral (payant/bloqué), Claude (payant), puis Ollama local (`llama3.1:8b`) ont été essayés pour *générer* la liste depuis la connaissance du modèle — tous insuffisants (rate limit, coût, ou absence de connaissance factuelle des conférences régionales françaises, remplacées par des noms génériques inventés). D'où la liste statique. Ollama reste pertinent pour une tâche différente dans `extract-speaks.ts` : **extraire** des noms déjà connus depuis le texte d'une page fournie (pas du recall).

#### Pipeline interne d'`extract-speaks.ts` (le détail compte — évolué après plusieurs bugs réels)

0. **Garde conférence** — avant tout : si le texte de la page ne contient même pas le nom de l'événement (`conference.name`, normalisé), on ignore la page entièrement (`return []`). Nécessaire depuis le balayage multi-années (ci-dessous) : une recherche SearXNG pour un nom d'événement générique peut remonter une page totalement sans rapport, et un prénom+nom de speaker connu peut s'y retrouver par pure coïncidence (observé : "Human Talks Nantes" → page de formation TypeScript avec avis clients, où "David" et "Franck" apparaissaient dans deux avis différents sans rapport).
1. **`findMentionedSpeakers.ts`** — filtrage *déterministe*, pas de LLM : pour chaque speaker connu, prénom **et** nom doivent chacun apparaître comme mot entier (`containsWholeWord`, `string.functions.ts`) dans le texte de la page. S'il n'y a aucun candidat, pas d'appel Ollama du tout.
2. **`findSpeakerProfileLinks.ts`** — opère sur le **HTML brut** (avant `stripHtml`, les hrefs disparaissent sinon) : certains sites (ex. mixitconf.org) ont une page dédiée par speaker liée depuis le programme (`<a href="/speakers/julien.topcu">Julien Topçu</a>`) — bien plus fiable pour le titre qu'une fenêtre dans la grosse page programme. Si trouvée, cette page est fetchée et utilisée comme contexte à la place de la fenêtre (étape 3).
3. **`extractContextWindows.ts`** — *fallback* quand aucune page dédiée n'existe : pour chaque candidat, une fenêtre de ±400 caractères autour de son nom dans la page programme (pas la page entière, pas juste la liste des speakers connus).
4. **`buildExtractionPrompt.ts` + un appel Ollama *par candidat*** (pas un seul appel groupé pour tous les candidats d'une conférence) — le modèle ne reçoit que le contexte de ce candidat (page profil tronquée ou fenêtre), avec la seule tâche de retrouver son titre de talk.
5. **`parseExtractionResponse.ts`** — reconstruit un garde-fou déterministe en sortie (même si (1) est déjà censé être vrai par construction, défense en profondeur ; la vérification mot-entier se fait contre le texte réellement montré au modèle — page profil si utilisée, sinon page programme), dédoublonne les éventuelles entrées répétées du modèle pour une même personne en préférant un titre non-null, et sanitize le titre (voir plus bas).
6. **`fillMissingCoPresenterTitles.ts`** — filet de sécurité déterministe : si un speaker connu reste sans titre mais qu'un autre speaker connu de la même conférence, avec titre, a son nom à moins de 60 caractères dans la page programme, lui attribue le même titre (cas des co-intervenants). Opère encore sur des entrées à un seul speaker chacune — la comparaison "voisin avec/sans titre" a besoin de cette granularité.
7. **`groupCoPresentedTalks.ts`** — dernière étape, *après* (6) : fusionne les entrées de la même conférence partageant le même intitulé (non-null) en une seule entrée `speakers: [...]` multi-speakers, au lieu de garder un doublon par intervenant. Un titre `null` n'est jamais une clé de regroupement (deux talks sans titre connu ne peuvent pas être prouvés identiques).

⚠️ **Plusieurs hallucinations réelles ont motivé cette architecture, pas une anticipation théorique :**
- Avec la liste complète des 219 speakers dans le prompt, `llama3.1:8b` a halluciné des matches sur une page sans contenu pertinent (`sunny-tech.io`, landing page) en "recopiant" des noms de la liste fournie plutôt que de renvoyer `{ "matches": [] }`. → étape 1 (filtrage déterministe en amont, le LLM ne voit jamais la liste complète).
- Avec tous les candidats d'une conférence dans un seul appel, le modèle n'attribuait le titre qu'au premier nom cité et laissait `title: null` pour un co-intervenant dont la fenêtre de contexte était pourtant identique. → étape 3 (un appel par candidat) + étape 5 (filet de sécurité si l'appel isolé échoue quand même sur ce cas, ex. "TITRE Nom1 Nom2" où le titre précède le groupe).
- Un simple `.includes()` sur le seul nom de famille est insuffisant : un nom court comme "Vo" matche à l'intérieur d'"avoir" en sous-chaîne — d'où l'exigence de mot entier (`\b`) sur prénom **et** nom partout où une correspondance est vérifiée.
- Le modèle sur-échappe parfois la ponctuation d'un titre (`\uXXXX` littéral ou `&#39;` littéral au lieu d'une vraie apostrophe) — `sanitizeLlmText()` (`html.functions.ts`, partagée avec `find-speaker-talks-on-youtube`) nettoie les deux formes.
- Sur une page profil dédiée d'un speaker qui intervient depuis plusieurs éditions, la bio peut être suivie de **plusieurs** titres (talk courant + anciens talks) sans démarcation claire — le modèle mélangeait les intitulés de différentes années. Le talk courant apparaît en premier : `MAX_PROFILE_TEXT_CHARS` (1800, `extract-speaks.ts`) tronque la page profil avant que le talk suivant ne commence. Si ce chiffre casse sur un autre site (bio plus longue), l'ajuster plutôt que le supprimer.
- **Résiduel connu, non résolu** : sur un site sans page profil par speaker, un titre peut encore être erroné (attribué à un créneau voisin plutôt qu'au bon, ex. observé sur BreizhCamp, qui n'a pas de page profil dédiée) plutôt que simplement absent — les garde-fous ci-dessus empêchent l'invention de personnes, pas l'attribution incorrecte d'un titre à une personne réellement présente sur la page. Reste une limite de fiabilité d'un petit modèle local sur du texte HTML strippé sans structure claire, quand la seule source est la grosse page programme.

⚠️ **Les pages web changent entre deux fetchs** (programme mis à jour, contenu dynamique/aléatoire) : un match validé pendant un run peut ne plus être reproductible sur un re-fetch ultérieur de la même URL (observé concrètement sur `mixitconf.org/schedule`). Ce n'est pas un bug du filtre, c'est une limite inhérente au scraping — les données de `talks.json` reflètent l'état de la page *au moment du run*, pas une vérité permanente.

**Pattern collect Slack :** `client.users.list()` du SDK `@slack/web-api` (token `SLACK_TOKEN`) récupère les membres du workspace, puis pipeline pur : filtrer les membres invalides (bot, `deleted`, `USLACKBOT`), puis `extractSpeakerOrUndefined` (`member.functions.ts`) extrait `{ firstname, lastname, company }` depuis `name` ("prenom.nom") ou en fallback `real_name` ("Prenom Nom") + domaine de l'email, **et** normalise en pascal case via `toPascalCase` (`string.functions.ts`) avant de retourner le `Speaker`. Voir `get-all-speakers.ts` comme référence — toute la logique après l'appel Slack est pure et déterministe, donc testable sans LLM ni eval.

⚠️ `get-all-speakers.ts` réapplique actuellement `applyPascalCaseInSpeaker` après `extractSpeakerOrUndefined`, qui normalise déjà en pascal case — double normalisation redondante (sans impact, `toPascalCase` est idempotent) à nettoyer si l'occasion se présente.

### SearXNG (recherche web, run lourd)

Méta-moteur de recherche open source auto-hébergé via Docker — gratuit, pas de clé API, pas de carte bancaire.

```bash
cd searxng && docker compose up -d   # démarre sur http://localhost:8080
```

`searxng/settings.yml` active le format `json` (désactivé par défaut dans l'image officielle pour raisons de sécurité) — `search.formats: [html, json]`. Sans ça, `GET /search?...&format=json` renvoie une erreur. Variable d'env optionnelle : `SEARXNG_HOST` (défaut `http://localhost:8080`).

⚠️ **Historique** : Brave Search API a d'abord été utilisé ici (clé gratuite, ~2000 req/mois, pas de CB) — supprimé le 12 février 2026 (toutes les clés nécessitent désormais une CB). SearXNG le remplace : même esprit "gratuit et local" que l'approche Ollama. Les résultats dépendent des moteurs upstream agrégés par SearXNG (Google, Bing, DuckDuckGo, etc. selon la config par défaut) — peuvent parfois retourner une page non pertinente pour une requête ambiguë (observé sur "Nantes JUG" → un blog sans rapport, et sur "Human Talks Nantes" → une page de formation, voir la garde conférence ci-dessus) ; les garde-fous anti-hallucination d'`extract-speaks.ts` absorbent ce bruit (aucun speaker trouvé ou page hors-sujet = 0 talk, pas d'erreur).

#### Balayage multi-années (`findConferenceEditionUrls`)

`findConferenceEditionUrl(eventName, year)` cherche "`<event> <year> programme`" pour une seule année ; `findConferenceEditionUrls(eventName)` l'appelle pour 5 années (année courante → -4) et renvoie toutes les URLs distinctes trouvées. `refresh-events-heavy.ts` tourne maintenant sur **tous** les events (pas seulement ceux sans `url`), mais `updateEventUrls` ne réécrit jamais une `url` déjà connue — seules les URLs supplémentaires s'accumulent dans `pastEditionUrls` (fusionnées avec celles déjà connues, dédupliquées). `refresh-events-light.ts` crawle ensuite `[url, ...pastEditionUrls]` de chaque event, pas seulement `url`.

### Moteur YouTube de SearXNG (`youtube.functions.ts`)

`searchYoutube(query)` interroge SearXNG avec `&engines=youtube` (pas la recherche web générale) — résultats nettement plus propres pour cibler des vidéos de conférence. Chaque résultat expose `url`, `title`, `author` (nom de la chaîne YouTube — souvent littéralement le nom de la conférence, ex. "MiXiT", "Touraine Tech") et `length` (durée `mm:ss`/`h:mm:ss`).

- **`find-talk-video/findTalkVideo.ts`** — pour un talk **déjà connu** (titre non-null) : cherche `"<nom de famille>" <titre>`, garde le premier résultat dont le titre contient (mot entier) **prénom et nom** d'au moins un des speakers du talk (`pickBestVideoMatch.ts`). ⚠️ Exiger seulement le nom de famille ne suffit pas : faux positif réel observé où "Introduction Sécurité" de *Guillaume Yan* matchait une vidéo de "*Yan* Rolland" (homonyme, "Yan" étant son prénom) — d'où l'exigence des deux.
- **`find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.ts`** — pour un speaker donné, cherche `"<Prénom> <Nom>"` et découvre de **nouveaux** talks (pas forcément liés à un event de `events.json`). Pipeline : `isLikelyFullTalk.ts` élimine d'abord les vidéos de moins de 10 min (trailers/shorts) sans appel LLM ; pour chaque candidat restant, un appel Ollama borné (titre + nom de chaîne seulement, pas de transcript — `buildVideoExtractionPrompt.ts`) décide si c'est un vrai talk de cette personne et extrait `{ conferenceName, title }` (`parseVideoExtractionResponse.ts`) ; `detectCoPresenters.ts` repère en plus, déterministiquement, les autres speakers Shodo connus cités dans le même titre (ex. "Julien Topçu & Thomas Pierrain"), pour construire une entrée multi-speakers dès la découverte sans dépendre d'un titre strictement identique (`groupCoPresentedTalks`).
- `refresh-priority-speakers.ts` limite volontairement cette recherche à 3 speakers nommés (Julien Topcu, Thomas Pierrain, Nathan Castelein), pas aux ~220 speakers connus — demandé explicitement, plus rapide et moins bruyant que d'ouvrir la recherche à des noms moins "googlables". Canonicalise le nom de conférence deviné par le LLM contre `events.json` avant de merger (`canonicalizeConferenceName`, dans le script) pour limiter les quasi-doublons d'orthographe (ex. "MiXiT" → "MixIT").

⚠️ **Résiduel connu, non résolu, des deux collects ci-dessus** : contrairement à `extract-speaks.ts`, il n'existe pas de "texte source" à comparer pour vérifier objectivement la réponse du LLM — l'extraction depuis un titre de vidéo seul ne peut pas être vérifiée par `containsWholeWord` comme sur une page de programme. Le risque de faux positif est atténué (durée minimale, prénom+nom requis pour les co-présentateurs) mais pas éliminé. Autre limite : un même talk trouvé à la fois par scraping de site (titre en français) et par YouTube (titre en anglais, ou en français mais légèrement reformulé) n'est **pas** dédupliqué par `mergeSpeaks` (clé = titre normalisé exact) — peut produire deux entrées pour le même talk réel. Observé concrètement : le talk "Hive pattern" de Thomas Pierrain existe en double (français, trouvé par scraping de MixIT 2025 ; anglais + Julien Topçu en co-présentateur, trouvé par YouTube).

### Ollama (extraction, pas génération)

```bash
brew install ollama
brew services start ollama   # http://localhost:11434
ollama pull llama3.1:8b
```

`extract-speaks.ts` utilise le `fetch` du package `undici` (dépendance directe) avec un `Agent` custom (`headersTimeout`/`bodyTimeout` étendus à 10 min) passé en `dispatcher` — **pas** le `fetch` global, qui vient d'une instance undici différente et rejette un dispatcher externe (`TypeError: fetch failed` immédiat). `options: { temperature: 0, repeat_penalty: 1.15, num_predict }` : `temperature: 0` (déterminisme maximal, utile pour déboguer — les appels sont maintenant petits et rapides grâce au filtrage en amont) + `repeat_penalty` évite les boucles de répétition déjà observées sur `llama3.1:8b` sans ce réglage.

Variables d'env (optionnelles, défauts dans le code) : `OLLAMA_HOST` (`http://localhost:11434`), `OLLAMA_MODEL` (`llama3.1:8b`).

## Tests unitaires (Vitest)

Les TU testent la logique déterministe (fonctions pures, pipeline de filtrage/transformation). `getConferences()` est maintenant purement déterministe (liste statique) et couvert par un TU plutôt qu'un eval — voir `get-conferences.test.ts`. Les evals promptfoo restent le rôle des collects qui appellent réellement un LLM (aucun actuellement dans ce repo).

**Convention** : fichier de test **co-localisé** avec la source, suffixe `.test.ts` — ex. `src/string.functions.ts` → `src/string.functions.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { toPascalCase } from "./string.functions.js"; // ⚠️ extension .js (Node16 ESM)

describe("toPascalCase", () => {
  it("capitalizes a single lowercase word", () => {
    expect(toPascalCase("hello")).toBe("Hello");
  });
});
```

`**/*.test.ts` est exclu de la compilation (`tsconfig.json` → `exclude`) : ces fichiers ne doivent jamais finir dans `dist/`.

```bash
npm run test   # vitest run
```

**Collect avec I/O (Slack, HTTP, …)** : ne mocker que le point d'I/O, laisser tourner réellement les fonctions pures qui en dépendent (ex. `member.functions.ts`, `string.functions.ts` ne sont jamais mockés). Utiliser `vi.hoisted` pour déclarer le mock avant l'import du module testé — voir `get-all-speakers.test.ts` comme référence :

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { usersListMock } = vi.hoisted(() => ({ usersListMock: vi.fn() }));

vi.mock("@slack/web-api", () => ({
  WebClient: vi.fn().mockImplementation(function () {
    // ⚠️ Vitest 4 : `function`/`class`, jamais une arrow function — WebClient
    // est instancié avec `new` dans le code source, et un mock arrow function
    // plante avec "is not a constructor".
    return { users: { list: usersListMock } };
  }),
}));

import { getAllSpeakers } from "./get-all-speakers.js"; // import après le mock

beforeEach(() => {
  usersListMock.mockReset();
});
```

## Evals (promptfoo)

Les evals sont dans `tests/evals/` et utilisent [promptfoo](https://promptfoo.dev/) (TypeScript-natif).

```
tests/evals/
├── get-all-speakers.yaml
├── get-all-speakers-provider.ts
├── get-speaks.yaml
└── get-speaks-provider.ts
```

**Provider** : doit être une **classe** (pas un objet littéral) car promptfoo l'instancie avec `new`.

**Assertions** : utiliser `throw new Error(message)` pour afficher la raison d'échec dans le terminal. `return { reason }` n'est pas affiché.

Aucun de ces evals n'utilise de LLM judge actuellement (assertions JS pures sur la sortie) — pas de clé API ni de serveur LLM requis pour `npm run eval`.

**Rate limit** : `getAllSpeakers` appelle l'API Slack (`users.list`), sujette au rate limit. Toujours tester cet eval avec `--max-concurrency 1` :
```bash
npx promptfoo eval --config tests/evals/get-all-speakers.yaml --max-concurrency 1
```

La CI (`/.github/workflows/evals.yml`) tourne les evals sur chaque push/PR sur `main`. Aucun secret requis actuellement (⚠️ `get-all-speakers.yaml` a quand même besoin de `SLACK_TOKEN` pour fonctionner réellement, non configuré dans le workflow — gap préexistant).
