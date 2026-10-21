// Déterministe, pas de LLM : un simple mot-clé isolé ("IA" en minuscule, "ML"...)
// matche trop de sous-chaînes anodines en français (ex. "rag" dans "antifragile")
// — chaque expression ci-dessous est soit un acronyme en mot entier ("IA" en
// MAJUSCULES uniquement, jamais insensible à la casse), soit une expression assez
// spécifique pour ne pas apparaître par accident dans un talk sans rapport.
// Calibré sur le corpus réel de talks.json (voir le script categorize-talks.ts).
const AI_PHRASES_CASE_INSENSITIVE = [
  "intelligence artificielle",
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "generative ai",
  "genai",
  "agents? ia",
  "agents? ai",
  "agentique",
  "agentic",
  "chatbot",
  "chatgpt",
  "copilot",
  "llm",
  "gpt",
  "rag",
  "nlp",
];

function containsWholeWordCI(text: string, phrase: string): boolean {
  return new RegExp(`\\b${phrase}\\b`, "i").test(text);
}

function containsWholeWordCS(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(text);
}

export function mentionsAI(text: string): boolean {
  if (containsWholeWordCS(text, "IA")) return true;
  return AI_PHRASES_CASE_INSENSITIVE.some((phrase) => containsWholeWordCI(text, phrase));
}
