import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const card = process.env.CARD;
if (!card) { console.error('Ustaw CARD=<numer karty>'); process.exit(1); }

const photos = {};
for (const name of ['zoom', 'blur', 'puzzle']) {
  photos[name] = 'data:image/jpeg;base64,' + readFileSync(`.build/${name}.jpg`).toString('base64');
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(card), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(photos))));
const out = new Uint8Array(salt.length + iv.length + ct.length);
out.set(salt, 0); out.set(iv, 16); out.set(ct, 28);
writeFileSync('zdjecia.bin', out);
console.log('zdjecia.bin', out.length, 'B');
