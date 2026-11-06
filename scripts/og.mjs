// Convierte public/og*.svg en PNG (public/og.png, public/og-en.png) para las vistas previas al compartir.
// Uso: npm run og
// Las fuentes salen de @fontsource (en WOFF). resvg solo lee TTF/OTF, así que se descomprimen al vuelo.
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const font = (pkg, file) => join(root, 'node_modules', '@fontsource', pkg, 'files', file);

const FONTS = [
  font('big-shoulders-display', 'big-shoulders-display-latin-900-normal.woff'),
  font('schibsted-grotesk', 'schibsted-grotesk-latin-400-normal.woff'),
  font('martian-mono', 'martian-mono-latin-600-normal.woff'),
];
// Estos archivos de @fontsource llevan dentro un nombre de familia distinto del habitual
const INTERNAL_NAMES = {
  'Big Shoulders Display': 'Big Shoulders Display Thin Black',
  'Martian Mono': 'Martian Mono SemiBold',
};
const useInternalNames = svg => svg.replace(/font-family="([^"]+)"/g, (m, fam) => `font-family="${INTERNAL_NAMES[fam] ?? fam}"`);

// WOFF 1.0 → TTF/OTF: copia cada tabla, descomprimida si hace falta, a un SFNT normal
function woffToSfnt(buf) {
  if (buf.toString('ascii', 0, 4) !== 'wOFF') throw new Error('No es un archivo WOFF 1.0');
  const flavor = buf.readUInt32BE(4), numTables = buf.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const e = 44 + i * 20;
    const offset = buf.readUInt32BE(e + 4), compLength = buf.readUInt32BE(e + 8), origLength = buf.readUInt32BE(e + 12);
    const raw = buf.subarray(offset, offset + compLength);
    tables.push({ tag: buf.subarray(e, e + 4), checksum: buf.readUInt32BE(e + 16), data: compLength < origLength ? inflateSync(raw) : raw });
  }
  let pow = 1, log = 0;
  while (pow * 2 <= numTables) { pow *= 2; log++; }
  const headerSize = 12 + numTables * 16;
  const size = tables.reduce((n, t) => n + ((t.data.length + 3) & ~3), headerSize);
  const out = Buffer.alloc(size);
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(pow * 16, 6);
  out.writeUInt16BE(log, 8);
  out.writeUInt16BE(numTables * 16 - pow * 16, 10);
  let at = headerSize;
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    t.tag.copy(out, r);
    out.writeUInt32BE(t.checksum, r + 4);
    out.writeUInt32BE(at, r + 8);
    out.writeUInt32BE(t.data.length, r + 12);
    t.data.copy(out, at);
    at += (t.data.length + 3) & ~3;
  });
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'og-fonts-'));
try {
  const fontFiles = FONTS.map((f, i) => {
    const p = join(tmp, `font-${i}.ttf`);
    writeFileSync(p, woffToSfnt(readFileSync(f)));
    return p;
  });
  const svgs = readdirSync(pub).filter(f => /^og.*\.svg$/.test(f));
  if (!svgs.length) throw new Error('No hay ningún public/og*.svg');
  for (const f of svgs) {
    const svg = useInternalNames(readFileSync(join(pub, f), 'utf8'));
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Schibsted Grotesk' },
    }).render().asPng();
    const outName = f.replace(/\.svg$/, '.png');
    writeFileSync(join(pub, outName), png);
    console.log(`public/${f} → public/${outName} (${Math.round(png.length / 1024)} KB)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
