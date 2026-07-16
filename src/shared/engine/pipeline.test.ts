import { describe, it, expect } from 'vitest';
import { SovereignPipeline, RoundTripError, canonical } from './pipeline';
import { jsonStage, compressStage, encryptStage } from './stages';

const payloads: Array<[string, unknown]> = [
  ['nested object', { projects: [{ id: 'p1', name: 'Vault' }], mass: 42, flags: { a: true, b: null } }],
  ['unicode + emoji', { note: 'eYe — {8} — 0 — {8} — eYe 👁️♾️0♾️👁️ 中文 עברית' }],
  ['deep array', [[1, [2, [3, [4.5, -6]]]], 'x', false]],
  ['empty object', {}],
  ['large repetitive', { rows: Array.from({ length: 500 }, (_, i) => ({ i, v: 'row-' + (i % 7) })) }],
];

async function freshKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('SovereignPipeline — the round-trip law', () => {
  it.each(payloads)('decode(encode(x)) deep-equals x: %s', async (_name, value) => {
    const pipeline = new SovereignPipeline([jsonStage, compressStage]);
    const sealed = await pipeline.encode(value);
    const returned = await pipeline.decode(sealed);
    expect(returned).toEqual(value);
  });

  it('holds through the full palindrome: json -> deflate -> aes-gcm and back', async () => {
    const key = await freshKey();
    const pipeline = new SovereignPipeline([jsonStage, compressStage, encryptStage(async () => key)]);
    for (const [, value] of payloads) {
      const sealed = await pipeline.encode(value);
      expect(sealed.stages).toEqual(['json', 'deflate', 'aes-gcm']);
      expect(sealed.payload).toBeInstanceOf(Uint8Array);
      await expect(pipeline.decode(sealed)).resolves.toEqual(value);
    }
  });

  it('observer hash is canonical: key order does not change identity', () => {
    expect(canonical({ b: 1, a: { d: 2, c: 3 } })).toBe(canonical({ a: { c: 3, d: 2 }, b: 1 }));
  });

  it('detects a forged observer hash (RoundTripError, not silent corruption)', async () => {
    const pipeline = new SovereignPipeline([jsonStage, compressStage]);
    const sealed = await pipeline.encode({ secret: 'truth' });
    sealed.observerHash = 'f'.repeat(64);
    await expect(pipeline.decode(sealed)).rejects.toBeInstanceOf(RoundTripError);
  });

  it('detects payload tampering (stage inverse or hash check must reject)', async () => {
    const pipeline = new SovereignPipeline([jsonStage, compressStage]);
    const sealed = await pipeline.encode({ ledger: [1, 2, 3] });
    sealed.payload = sealed.payload.slice();
    sealed.payload[sealed.payload.length - 1] ^= 0xff;
    await expect(pipeline.decode(sealed)).rejects.toThrow();
  });

  it('refuses decryption with the wrong key', async () => {
    const rightKey = await freshKey();
    const wrongKey = await freshKey();
    const sealer = new SovereignPipeline([jsonStage, compressStage, encryptStage(async () => rightKey)]);
    const opener = new SovereignPipeline([jsonStage, compressStage, encryptStage(async () => wrongKey)]);
    const sealed = await sealer.encode({ sovereign: true });
    await expect(opener.decode(sealed)).rejects.toThrow();
  });

  it('encryption is non-deterministic (fresh IV) but always round-trips', async () => {
    const key = await freshKey();
    const pipeline = new SovereignPipeline([jsonStage, compressStage, encryptStage(async () => key)]);
    const a = await pipeline.encode({ v: 1 });
    const b = await pipeline.encode({ v: 1 });
    expect(Buffer.from(a.payload).equals(Buffer.from(b.payload))).toBe(false);
    await expect(pipeline.decode(a)).resolves.toEqual({ v: 1 });
    await expect(pipeline.decode(b)).resolves.toEqual({ v: 1 });
  });

  it('rejects an empty pipeline and a pipeline that does not end in bytes', async () => {
    expect(() => new SovereignPipeline([])).toThrow();
    const identity = { name: 'identity', forward: (x: unknown) => x, inverse: (x: unknown) => x };
    const bad = new SovereignPipeline([identity]);
    await expect(bad.encode({ not: 'bytes' })).rejects.toThrow(/terminate in bytes/);
  });
});
