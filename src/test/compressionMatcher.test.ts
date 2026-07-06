import { describe, expect, it } from "vitest";
import { COMPRESSION_PODS } from "@/lib/compressionPods";
import { matchCompressionSeeds, scoreSeedIntent, shouldAutoNavigate } from "@/lib/compressionMatcher";

describe("compressionMatcher", () => {
  it("matches wallet intent to wallet seed", () => {
    const ranked = matchCompressionSeeds("wallet", COMPRESSION_PODS);
    expect(ranked[0]?.seed.id).toBe("game-wallet");
  });

  it("matches arena intent to arena seed", () => {
    const ranked = matchCompressionSeeds("arena", COMPRESSION_PODS);
    expect(ranked[0]?.seed.id).toBe("game-arena");
  });

  it("matches guild intent to guild bank seed", () => {
    const ranked = matchCompressionSeeds("guild", COMPRESSION_PODS);
    expect(ranked[0]?.seed.id).toBe("game-guild");
  });

  it("supports subsequence matching", () => {
    const ranked = matchCompressionSeeds("flpr", COMPRESSION_PODS);
    expect(ranked[0]?.seed.id).toBe("ai-flipper");
  });

  it("prefers exact keyword over partials", () => {
    const ranked = matchCompressionSeeds("swarm", COMPRESSION_PODS);
    expect(ranked[0]?.seed.id).toBe("ai-swarm");
  });

  it("returns empty for unrelated query", () => {
    const ranked = matchCompressionSeeds("totally unrelated quantum banana", COMPRESSION_PODS);
    expect(ranked.length).toBe(0);
  });

  it("auto navigate requires high confidence", () => {
    const ranked = matchCompressionSeeds("wallet", COMPRESSION_PODS);
    expect(shouldAutoNavigate("wallet", ranked)).toBe(true);
  });

  it("auto navigate rejects weak ambiguous query", () => {
    const ranked = matchCompressionSeeds("a", COMPRESSION_PODS);
    expect(shouldAutoNavigate("a", ranked)).toBe(false);
  });

  it("scores direct label higher than weak partial", () => {
    const walletSeed = matchCompressionSeeds("wallet", COMPRESSION_PODS)[0].seed;
    const direct = scoreSeedIntent("wallet", walletSeed);
    const weak = scoreSeedIntent("w", walletSeed);
    expect(direct).toBeGreaterThan(weak);
  });
});
