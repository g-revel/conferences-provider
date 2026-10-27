import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { TALKS_PATH, SPEAKERS_PATH } from "../src/data/paths.js";
import { normalizeForMatch, toPascalCase } from "../src/string.functions.js";

// Lignes à ignorer purement et simplement : un "Abandonné" ou "Archivé" n'a aucune
// valeur à faire apparaître quelque part dans l'admin (contrairement à "Idée"/
// "Scopé"/"En construction", qui attendent juste une validation humaine).
const SKIPPED_STATUSES = new Set(["Abandonné"]);
const BUILT_STATUS = "Construit";

interface NotionRow {
  Titre: string;
  Shodoers: string;
  "Thême": string;
  Formats: string;
  Niveau: string;
  "État": string;
  Langue: string;
  Slides: string;
  Captation: string;
  "Archivé": string;
  "Candidaté à": string;
}

async function findFiles(dir: string, matches: (name: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFiles(full, matches)));
    } else if (matches(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// Le nom de fichier Notion tronque le titre et ajoute un hash — peu fiable pour
// retrouver la bonne page. La 1ère ligne du fichier ("# Titre") reprend elle le
// titre complet, exactement comme la colonne "Titre" du CSV.
async function loadDescriptionsByTitle(mdFiles: string[]): Promise<Map<string, string>> {
  const byTitle = new Map<string, string>();
  for (const file of mdFiles) {
    const content = await readFile(file, "utf-8");
    const firstLine = content.split("\n")[0] ?? "";
    const title = firstLine.replace(/^#\s*/, "").trim();
    if (!title) continue;

    const marker = "## Description";
    const index = content.indexOf(marker);
    if (index === -1) continue;
    const description = content.slice(index + marker.length).trim();
    if (description) byTitle.set(normalizeTitleForDedup(title), description);
  }
  return byTitle;
}

// "Julien Topçu" -> prénom en casse normale, nom en casse normale ; "Sylvain
// DECOUT" -> nom tout en majuscules dans Notion. Les deux doivent matcher le
// même speaker Shodo connu, d'où la comparaison via normalizeForMatch plutôt
// qu'une simple égalité de casse.
function parseSpeaker(raw: string, knownSpeakers: Speaker[]): Speaker {
  const parts = raw.trim().split(/\s+/);
  const firstnameRaw = parts[0] ?? "";
  const lastnameRaw = parts.slice(1).join(" ");

  const known = knownSpeakers.find(
    (s) =>
      normalizeForMatch(s.firstname) === normalizeForMatch(firstnameRaw) &&
      normalizeForMatch(s.lastname) === normalizeForMatch(lastnameRaw),
  );
  if (known) return known;

  return { firstname: toPascalCase(firstnameRaw), lastname: toPascalCase(lastnameRaw), company: "Shodo" };
}

// `normalizeForMatch` (casse + accents) ne suffit pas pour comparer des titres
// venant de deux sources différentes (export Notion vs scraping web) : observé en
// pratique des faux-négatifs à cause d'apostrophes typographiques (’) vs droites
// ('), et d'espaces avant la ponctuation française ("accessible ?" vs
// "accessible?"). Uniquement pour la déduplication de cet import — pas touché à
// `normalizeForMatch` lui-même, utilisé ailleurs pour des comparaisons de noms où
// ce starter de normalisation n'a pas été validé.
function normalizeTitleForDedup(title: string): string {
  return normalizeForMatch(title)
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+([?!:;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Même vidéo, deux URLs différentes : "youtu.be/ID", "youtube.com/watch?v=ID",
// avec ou sans "&si=.../&t=...". Comparer l'URL brute a raté plusieurs doublons
// réels en pratique (ex. "Rendu 3D..." déjà connu sous youtube.com/watch?v=X,
// réimporté sous youtu.be/X?si=Y) — on compare l'ID extrait quand c'est une URL
// YouTube reconnaissable, sinon l'URL brute (ex. lien de session BreizhCamp).
function videoMatchKey(url: string): string {
  const match = url.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : url;
}

// "Candidaté à" liste une ou plusieurs conférences au format "Nom (lien Notion)"
// séparées par des virgules — une candidature, pas une garantie que le talk y a
// réellement été donné. On ne retient que la première, à défaut de mieux : c'est
// la seule indication de conférence disponible pour un talk encore en brouillon.
function parseConferenceName(candidatedTo: string): string {
  const first = candidatedTo.split(",")[0]?.trim() ?? "";
  const withoutLink = first.replace(/\s*\(https?:\/\/[^)]*\)\s*$/, "").trim();
  return withoutLink || "Conférence non précisée";
}

interface ExistingLookup {
  byVideoUrl: Map<string, number>;
  byTitle: Map<string, number>;
}

function buildLookup(talks: Speak[]): ExistingLookup {
  const byVideoUrl = new Map<string, number>();
  const byTitle = new Map<string, number>();
  talks.forEach((t, i) => {
    if (t.videoUrl) byVideoUrl.set(videoMatchKey(t.videoUrl), i);
    if (t.title) byTitle.set(normalizeTitleForDedup(t.title), i);
  });
  return { byVideoUrl, byTitle };
}

async function main(): Promise<void> {
  const exportRoot = process.argv[2];
  if (!exportRoot) {
    console.error("Usage: npm run import:notion -- <chemin-vers-export-notion-decompresse>");
    process.exit(1);
  }

  const csvFiles = await findFiles(exportRoot, (name) => name.endsWith("_all.csv"));
  if (csvFiles.length === 0) throw new Error(`Aucun fichier *_all.csv trouvé sous ${exportRoot}`);
  const mdFiles = await findFiles(exportRoot, (name) => name.endsWith(".md"));

  // Notion exporte le CSV avec un BOM UTF-8 en tête — sans le retirer, la clé de
  // la 1ère colonne devient "﻿Titre" au lieu de "Titre" et toutes les lignes
  // semblent avoir un titre vide.
  const csvContent = (await readFile(csvFiles[0], "utf-8")).replace(/^﻿/, "");
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as NotionRow[];
  const descriptionsByTitle = await loadDescriptionsByTitle(mdFiles);

  const talks = await readJson<Speak[]>(TALKS_PATH, []);
  const knownSpeakers = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  const lookup = buildLookup(talks);
  const result = [...talks];

  let inserted = 0;
  let merged = 0;
  let skippedArchived = 0;
  let skippedAbandoned = 0;
  let skippedEmpty = 0;
  let skippedUrlAsTitle = 0;
  const insertedByStatus: Record<string, number> = {};
  const urlAsTitleRows: string[] = [];

  for (const row of rows) {
    const title = row.Titre?.trim();
    if (!title) {
      skippedEmpty++;
      continue;
    }
    // Observé en pratique : une ligne où personne n'a jamais rempli le titre,
    // Notion affiche alors l'URL d'une autre propriété (Captation) à la place —
    // inutile de publier "https://..." comme titre d'un talk, mieux vaut l'ignorer
    // et laisser un humain renommer la page dans Notion avant de relancer l'import.
    if (/^https?:\/\//.test(title)) {
      skippedUrlAsTitle++;
      urlAsTitleRows.push(title);
      continue;
    }
    if (SKIPPED_STATUSES.has(row["État"])) {
      skippedAbandoned++;
      continue;
    }
    if (row["Archivé"] === "Yes") {
      skippedArchived++;
      continue;
    }

    const videoUrl = row.Captation?.trim() || null;
    const speakers = (row.Shodoers ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseSpeaker(s, knownSpeakers));
    const categories = row["Thême"]?.trim() ? [row["Thême"].trim()] : [];
    const format = row.Formats?.trim() || null;
    const level = row.Niveau?.trim() || null;
    const language = row.Langue?.trim() || null;
    const slidesUrl = row.Slides?.trim() || null;
    const description = descriptionsByTitle.get(normalizeTitleForDedup(title)) ?? null;
    const conferenceName = parseConferenceName(row["Candidaté à"] ?? "");
    const status = row["État"] === BUILT_STATUS ? undefined : row["État"];

    const matchIndex = videoUrl && lookup.byVideoUrl.has(videoMatchKey(videoUrl))
      ? lookup.byVideoUrl.get(videoMatchKey(videoUrl))
      : lookup.byTitle.get(normalizeTitleForDedup(title));

    if (matchIndex !== undefined) {
      // Un talk déjà connu (trouvé par scraping/YouTube/import précédent) ne doit
      // jamais régresser vers un statut brouillon, même si Notion dit encore
      // "Scopé" — l'existence même de l'entrée est une preuve plus forte. On ne
      // complète que les champs manquants, sans écraser ce qui est déjà su.
      // `?? existing.x` plutôt que l'inverse : ne JAMAIS introduire une clé
      // `x: null` explicite là où elle était simplement absente avant — un champ
      // non trouvé par cet import ne doit pas polluer le diff de talks.json.
      const existing = result[matchIndex];
      result[matchIndex] = {
        ...existing,
        videoUrl: existing.videoUrl ?? videoUrl ?? existing.videoUrl,
        format: existing.format ?? format ?? existing.format,
        level: existing.level ?? level ?? existing.level,
        language: existing.language ?? language ?? existing.language,
        slidesUrl: existing.slidesUrl ?? slidesUrl ?? existing.slidesUrl,
        description: existing.description ?? description ?? existing.description,
        categories: existing.categories && existing.categories.length > 0 ? existing.categories : categories,
      };
      merged++;
    } else {
      const speak: Speak = {
        id: crypto.randomUUID(),
        conference: { name: conferenceName },
        speakers,
        title,
        videoUrl,
        categories,
        format,
        level,
        language,
        slidesUrl,
        description,
        ...(status ? { status } : {}),
      };
      result.push(speak);
      lookup.byTitle.set(normalizeTitleForDedup(title), result.length - 1);
      if (videoUrl) lookup.byVideoUrl.set(videoMatchKey(videoUrl), result.length - 1);
      inserted++;
      if (status) insertedByStatus[status] = (insertedByStatus[status] ?? 0) + 1;
    }
  }

  await writeJson(TALKS_PATH, result);

  console.log(`${rows.length} ligne(s) lues dans l'export Notion.`);
  console.log(`${inserted} nouveau(x) talk(s) ajouté(s), dont :`);
  for (const [status, count] of Object.entries(insertedByStatus)) {
    console.log(`  - ${count} en attente de validation ("${status}")`);
  }
  console.log(`  - ${inserted - Object.values(insertedByStatus).reduce((a, b) => a + b, 0)} déjà "Construit"`);
  console.log(`${merged} talk(s) déjà connu(s), complété(s) avec les champs manquants.`);
  console.log(
    `${skippedAbandoned} ignoré(s) ("Abandonné"), ${skippedArchived} ignoré(s) (archivé), ` +
      `${skippedEmpty} ignoré(s) (titre vide), ${skippedUrlAsTitle} ignoré(s) (titre = URL, à corriger dans Notion).`,
  );
  if (urlAsTitleRows.length > 0) {
    console.log("Titres = URL ignorés (renommer la page dans Notion puis relancer l'import) :");
    for (const t of urlAsTitleRows) console.log(`  - ${t}`);
  }
}

main();
