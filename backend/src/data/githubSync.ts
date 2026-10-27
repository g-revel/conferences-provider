import path from "node:path";

const GITHUB_API = "https://api.github.com";

// Commit direct dans le repo via l'API GitHub Contents : seul moyen simple et
// gratuit de rendre une écriture admin réellement persistante. Sur le plan
// gratuit Render (voir render.yaml), le disque du conteneur est entièrement
// recréé depuis le code source à chaque déploiement, et même à chaque réveil du
// conteneur après une mise en veille d'inactivité — un writeFile() seul sur ce
// disque ne survit à aucun des deux. No-op silencieux si GITHUB_TOKEN/GITHUB_REPO
// ne sont pas configurés (dev local, CI) : l'écriture locale reste alors le seul
// effet, exactement comme avant l'ajout de cette fonction.
export async function commitJsonToGitHub(absolutePath: string, content: string, message: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  // paths.ts résout vers backend/data quelle que soit la position du fichier sur
  // le disque du conteneur (src/ en dev, dist/ en prod) — mais le chemin dans le
  // repo git, lui, commence toujours par "backend/data/".
  const repoPath = path.posix.join("backend/data", path.basename(absolutePath));
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  // Le endpoint PUT Contents exige le sha du blob existant pour une mise à jour
  // (sinon GitHub la refuse en pensant écraser un contenu concurrent inconnu) —
  // absent uniquement si le fichier n'existe pas encore à cette branche.
  const getResponse = await fetch(`${GITHUB_API}/repos/${repo}/contents/${repoPath}?ref=${branch}`, { headers });
  const sha = getResponse.ok ? ((await getResponse.json()) as { sha: string }).sha : undefined;

  const putResponse = await fetch(`${GITHUB_API}/repos/${repo}/contents/${repoPath}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putResponse.ok) {
    throw new Error(`Échec du commit GitHub de ${repoPath} : ${putResponse.status} ${await putResponse.text()}`);
  }
}
