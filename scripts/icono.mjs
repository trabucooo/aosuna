// Genera public/apple-touch-icon.png (180×180) a partir del cursor de public/favicon.svg.
// iOS no usa favicons SVG al guardar la web en la pantalla de inicio: necesita un PNG. Uso: npm run icono
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
// Se reutiliza el trazo del favicon (viewBox 24×28), centrado y a escala 4 sobre el fondo de la web
const path = readFileSync(join(pub, 'favicon.svg'), 'utf8').match(/<path[^>]*>/)[0];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
<rect width="180" height="180" fill="#0E1014"/><g transform="translate(42 34) scale(4)">${path}</g></svg>`;
writeFileSync(join(pub, 'apple-touch-icon.png'), new Resvg(svg).render().asPng());
console.log('public/apple-touch-icon.png');
