import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const page = path => fileURLToPath(new URL(path, import.meta.url));

/* Precarga de la fuente del nombre (Big Shoulders Display 900). Sin esto, el navegador no sabe que la necesita
   hasta que ha bajado y leído el CSS; con el <link rel="preload"> la pide a la vez que el CSS, y el nombre cambia
   antes de la fuente de reserva a la buena (menos salto de maqueta). Solo se precarga esta: precargar todas
   competiría con el CSS y el JS. El nombre del archivo lleva una huella que cambia en cada build, por eso se
   busca aquí y no se escribe a mano en el HTML. La 404 no la lleva */
const preloadNameFont = () => ({
  name: 'precarga-fuente-nombre',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      if (/404\.html$/.test(ctx.filename)) return html;
      const file = Object.keys(ctx.bundle ?? {}).find(f => /big-shoulders-display-latin-900-normal-[^.]+\.woff2$/.test(f));
      if (!file) { this.warn('No encuentro la fuente del nombre: no se precarga'); return html; }
      // crossorigin es obligatorio en las fuentes aunque sean del mismo dominio: sin él se descargaría dos veces
      return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true, href: `/${file}` }, injectTo: 'head' }];
    },
  },
});

/* Página propia de Zalapp (zalapp/index.html y en/zalapp/index.html). Sus nueve etapas no están escritas allí: se
   copian aquí, al compilar (y en `npm run dev`), del cuaderno de la portada (#zSheet en index.html o en/index.html).
   Así el texto vive en un solo sitio y las dos versiones no pueden desincronizarse.
   La portada lo tiene como piezas interactivas; para una página de lectura se adapta:
   - fuera el lienzo de las ilustraciones de puntos y sus descripciones («Ilustración: …»), que aquí no existen;
   - el título de cada etapa pasa de h3 a h2 (en la página cuelgan directamente del h1);
   - las salidas del cruce y las señales del DAFO dejan de ser botones: aquí no abren ni giran nada, y un botón
     que no hace nada confunde a quien navega con teclado o lector de pantalla.
   También genera el índice de etapas. Si el HTML de la portada cambia y algo no se encuentra, el build falla con un
   mensaje claro en vez de publicar la página vacía */
const zalappPage = () => ({
  name: 'pagina-zalapp',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      if (!html.includes('<!--cuaderno-->')) return html;
      const en = /[\\/]en[\\/]zalapp[\\/]/.test(ctx.filename);
      const home = readFileSync(page(en ? './en/index.html' : './index.html'), 'utf8');
      const found = home.match(/<div class="log-sheet" id="zSheet">([\s\S]*?)<\/div>\s*<p class="sr-only" id="zLive"/);
      if (!found) throw new Error('pagina-zalapp: no encuentro el cuaderno (#zSheet) en la portada');
      const sheet = found[1]
        .replace(/\s*<canvas class="log-art"[^>]*><\/canvas>/, '')
        .replace(/\s*<p class="sr-only">(?:Ilustración|Illustration):[^<]*<\/p>/g, '')
        .replace(/<h3 class="log-h"([^>]*)>([\s\S]*?)<\/h3>/g, '<h2 class="log-h"$1>$2</h2>')
        .replace(/<button type="button" class="exit-btn"[^>]*>([^<]*)<\/button>/g, '<h3 class="exit-btn">$1</h3>')
        .replace(/<button type="button" class="(sign sign-\d)"[^>]*>([\s\S]*?)<\/button>/g, '<div class="$1">$2</div>')
        .replace(/<span class="sign-front" aria-hidden="true">/g, '<span class="sign-front">')
        .replace(/ aria-live="polite"/g, '');
      const stages = [...sheet.matchAll(/<section class="log-page" id="(zEt\d+)"[^>]*>\s*<p class="log-km">[^<]*<\/p>\s*<h2 class="log-h"[^>]*>([^<]*)<\/h2>/g)];
      if (stages.length !== 9 || /<button|<canvas|sr-only/.test(sheet)) throw new Error('pagina-zalapp: el cuaderno de la portada ha cambiado y no sé adaptarlo; revisa vite.config.js');
      const toc = stages.map(([, id, title]) => `<li><a class="pill" href="#${id}">${title}</a></li>`).join('');
      return html.replace('<!--cuaderno-->', sheet).replace('<!--etapas-->', toc);
    },
  },
});

/* El ID de Umami no se escribe en el HTML: las cuatro páginas llevan el marcador UMAMI_WEBSITE_ID y aquí se cambia
   por el valor de la variable de entorno del mismo nombre (archivo .env en tu ordenador o en el VPS; ver
   .env.example y DESPLIEGUE.md). Así el ID vive en un solo sitio y no hay que tocar cuatro archivos.
   Sin la variable (o en `npm run dev`), la etiqueta del script y su preconnect se quitan: no tiene sentido pedir un
   script que no va a registrar nada, y la web funciona igual porque track() no hace nada si Umami no está */
const umami = id => ({
  name: 'umami-id',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      if (!html.includes('UMAMI_WEBSITE_ID')) return html;
      if (id) return html.replaceAll('UMAMI_WEBSITE_ID', id);
      return html
        .replace(/[ \t]*<link rel="preconnect" href="https:\/\/stats\.aosuna\.es">\r?\n/, '')
        .replace(/[ \t]*<script defer src="https:\/\/stats\.aosuna\.es\/script\.js"[^>]*><\/script>\r?\n/, '');
    },
  },
});

export default defineConfig(({ mode, command }) => {
  // loadEnv lee .env, .env.local… y también las variables del sistema (así llega en el build de Docker)
  const id = (loadEnv(mode, process.cwd(), 'UMAMI_').UMAMI_WEBSITE_ID || '').trim();
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new Error(`UMAMI_WEBSITE_ID no parece un ID de Umami (36 caracteres, como 1a2b3c4d-…): «${id}»`);
  if (!id && command === 'build') console.warn('\n  Aviso: sin UMAMI_WEBSITE_ID, este build sale SIN analítica (ver .env.example)\n');
  return {
  plugins: [umami(command === 'build' ? id : ''), zalappPage(), preloadNameFont()],
  build: {
    // Las fuentes van como archivos, nunca incrustadas, para permitir una CSP estricta
    assetsInlineLimit: 0,
    // Cuatro páginas: la portada y la de Zalapp, en español (/ y /zalapp/) y en inglés (/en/ y /en/zalapp/)
    rollupOptions: {
      input: {
        es: page('./index.html'),
        en: page('./en/index.html'),
        zalapp: page('./zalapp/index.html'),
        zalappEn: page('./en/zalapp/index.html'),
        notFound: page('./404.html'),
      },
    },
  },
  };
});
