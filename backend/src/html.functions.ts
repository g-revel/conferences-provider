const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

const HTML_ENTITY_PATTERN = /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&nbsp;/g;

export function decodeHtmlEntities(text: string): string {
  return text.replace(HTML_ENTITY_PATTERN, (entity) => HTML_ENTITIES[entity] ?? entity);
}

// Le modèle sur-échappe parfois la ponctuation au lieu de recopier le caractère
// réel : séquence \uXXXX littérale (ex. "l\\u0027architecture") que JSON.parse
// laisse telle quelle puisque c'est un JSON valide, pas un \uXXXX à décoder, ou
// entité HTML littérale (ex. "l&#39;architecture") recopiée depuis la page source.
export function sanitizeLlmText(text: string): string {
  const withoutUnicodeEscapes = text.replace(
    /\\u([0-9a-fA-F]{4})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );
  return decodeHtmlEntities(withoutUnicodeEscapes);
}

export function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}
