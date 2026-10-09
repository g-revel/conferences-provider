
export function toPascalCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Casse + accents ignorés, pour comparer un nom renvoyé par un LLM à un nom canonique.
export function normalizeForMatch(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Les deux arguments doivent déjà être passés par normalizeForMatch. `\b` seul
// évite les faux positifs en sous-chaîne (ex. "Vo" dans "avoir").
export function containsWholeWord(normalizedText: string, normalizedWord: string): boolean {
  if (!normalizedWord) return false;
  const escaped = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(normalizedText);
}
