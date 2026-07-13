// Encryption utilities for vault data at-rest
// Uses simple XOR-based encryption for browser compatibility
// For production, consider Web Crypto API or TweetNaCl.js

import { deflate, inflate } from 'fflate';

type EncryptionKey = string;

function generateKey(userId: string, vaultId: string = 'default'): EncryptionKey {
  // Derive a key from user ID + vault ID
  return `${userId}:${vaultId}`;
}

function xorEncrypt(data: string, key: EncryptionKey): string {
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const encrypted: number[] = [];

  for (let i = 0; i < dataBytes.length; i++) {
    encrypted.push(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
  }

  return btoa(String.fromCharCode(...encrypted));
}

function xorDecrypt(encrypted: string, key: EncryptionKey): string {
  try {
    const keyBytes = new TextEncoder().encode(key);
    const dataBytes = new Uint8Array(
      atob(encrypted)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    const decrypted: number[] = [];

    for (let i = 0; i < dataBytes.length; i++) {
      decrypted.push(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
    }

    return new TextDecoder().decode(new Uint8Array(decrypted));
  } catch (e) {
    console.error('Decryption failed:', e);
    return '';
  }
}

export async function encryptData(
  data: unknown,
  userId: string
): Promise<string> {
  const key = generateKey(userId);
  const json = JSON.stringify(data);
  // Compress then encrypt for better security + size
  return new Promise((resolve, reject) => {
    deflate(new TextEncoder().encode(json), (err, compressed) => {
      if (err) {
        reject(err);
      } else {
        const compressedStr = btoa(String.fromCharCode(...compressed));
        const encrypted = xorEncrypt(compressedStr, key);
        resolve(encrypted);
      }
    });
  });
}

export async function decryptData<T>(
  encrypted: string,
  userId: string
): Promise<T> {
  const key = generateKey(userId);
  const compressedStr = xorDecrypt(encrypted, key);

  return new Promise((resolve, reject) => {
    if (!compressedStr) {
      reject(new Error('Decryption failed: invalid data'));
      return;
    }

    const compressed = Uint8Array.from(
      atob(compressedStr)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    inflate(compressed, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        try {
          const json = new TextDecoder().decode(decompressed);
          const data = JSON.parse(json) as T;
          resolve(data);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}
