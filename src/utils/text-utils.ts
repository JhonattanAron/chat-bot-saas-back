// src/utils/text-utils.ts
const synonymMap: Record<string, string[]> = {
  frío: ["invierno", "helado", "nevado"],
  ropa: ["vestimenta", "prenda"],
  montaña: ["senderismo", "trekking", "escalada"],
};

export function normalizeText(text: string): string[] {
  return text.toLowerCase().split(/\s+/);
}

export function expandWithSynonyms(words: string[]): string[] {
  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    if (synonymMap[word]) {
      synonymMap[word].forEach((s) => expanded.add(s));
    }
  }
  return [...expanded];
}
