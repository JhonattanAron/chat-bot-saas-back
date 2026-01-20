"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.expandWithSynonyms = expandWithSynonyms;
const synonymMap = {
    frío: ["invierno", "helado", "nevado"],
    ropa: ["vestimenta", "prenda"],
    montaña: ["senderismo", "trekking", "escalada"],
};
function normalizeText(text) {
    return text.toLowerCase().split(/\s+/);
}
function expandWithSynonyms(words) {
    const expanded = new Set();
    for (const word of words) {
        expanded.add(word);
        if (synonymMap[word]) {
            synonymMap[word].forEach((s) => expanded.add(s));
        }
    }
    return [...expanded];
}
//# sourceMappingURL=text-utils.js.map