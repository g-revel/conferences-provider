// "AI" et "IA & Data" désignaient le même thème sous deux noms différents — une
// seule catégorie "IA" désormais. Centralisé ici pour que toute source de
// catégories (import Notion, catégorisation par mots-clés, ...) applique la même
// normalisation plutôt que de réintroduire "AI" par mégarde.
const CATEGORY_RENAMES: Record<string, string> = { AI: "IA", "IA & Data": "IA" };

export function normalizeCategory(category: string): string {
  return CATEGORY_RENAMES[category] ?? category;
}
