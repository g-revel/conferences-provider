import { readFile, writeFile } from "node:fs/promises";
import { commitJsonToGitHub } from "./githubSync.js";

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, serialize(value), "utf-8");
}

// Réservé aux écritures déclenchées par une action admin (contrairement aux
// scripts de pipeline, exécutés et committés manuellement par un humain) :
// commit directement le fichier sur GitHub en plus de l'écriture locale, seule
// façon de survivre à un redéploiement Render (voir githubSync.ts). Si on
// appelait ça depuis writeJson() lui-même, un dev avec un GITHUB_TOKEN local
// configuré pour un autre usage pousserait silencieusement des commits à chaque
// lancement de script de refresh — d'où une fonction séparée, à appeler
// explicitement là où la persistance entre déploiements est requise.
export async function writeJsonPersisted(path: string, value: unknown, commitMessage: string): Promise<void> {
  const content = serialize(value);
  await writeFile(path, content, "utf-8");
  await commitJsonToGitHub(path, content, commitMessage);
}
