import type { CompressionSeed } from "@/lib/compressionPods";
import { flattenCompressionSeeds } from "@/lib/compressionPods";

export type RankedSeed = {
  seed: CompressionSeed;
  score: number;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function subsequenceScore(query: string, target: string): number {
  if (!query || !target) return 0;
  if (query.length > 10) return 0;
  let qi = 0;
  let hits = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti += 1) {
    if (query[qi] === target[ti]) {
      qi += 1;
      hits += 1;
    }
  }
  if (qi < query.length) return 0;
  return Math.round((hits / Math.max(target.length, 1)) * 40);
}

function keywordScore(queryWords: string[], keywords: string[]): number {
  if (queryWords.length === 0) return 0;
  let score = 0;
  for (const q of queryWords) {
    for (const k of keywords) {
      const kw = normalize(k);
      if (kw === q) score += 24;
      else if (kw.startsWith(q) || q.startsWith(kw)) score += 14;
      else if (kw.includes(q) || q.includes(kw)) score += 8;
    }
  }
  return score;
}

export function scoreSeedIntent(query: string, seed: CompressionSeed): number {
  const q = normalize(query);
  if (!q) return 0;
  const words = q.split(" ");
  const label = normalize(seed.label);
  const icon = normalize(seed.icon);
  const nameScore = subsequenceScore(q.replace(/\s+/g, ""), label.replace(/\s+/g, ""));
  const direct = label === q ? 45 : label.includes(q) ? 18 : 0;
  const keywords = keywordScore(words, seed.keywords);
  const iconBonus = icon && words.some((w) => icon.includes(w)) ? 6 : 0;
  const base = direct + nameScore + keywords + iconBonus;
  const actionBonus = base > 0 && seed.action ? 3 : 0;
  return base + actionBonus;
}

export function matchCompressionSeeds(query: string, tree?: CompressionSeed[]): RankedSeed[] {
  const seeds = flattenCompressionSeeds(tree);
  return seeds
    .map((seed) => ({ seed, score: scoreSeedIntent(query, seed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.seed.label.localeCompare(b.seed.label));
}

export function shouldAutoNavigate(query: string, ranked: RankedSeed[]): boolean {
  const q = normalize(query);
  if (!q || ranked.length === 0) return false;
  if (q.length <= 1) return false;
  const top = ranked[0];
  const second = ranked[1];
  const topHasExactKeyword =
    normalize(top.seed.label) === q ||
    top.seed.keywords.some((keyword) => normalize(keyword) === q);
  const highConfidence = top.score >= 28;
  const decisive = !second || top.score - second.score >= 4;
  return topHasExactKeyword || (highConfidence && decisive);
}
