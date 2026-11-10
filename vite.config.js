import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

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

export default defineConfig({
  plugins: [preloadNameFont()],
  build: {
    // Las fuentes van como archivos, nunca incrustadas, para permitir una CSP estricta
    assetsInlineLimit: 0,
    // Dos páginas: español en / e inglés en /en/
    rollupOptions: {
      input: {
        es: page('./index.html'),
        en: page('./en/index.html'),
        notFound: page('./404.html'),
      },
    },
  },
});
