import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = path => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
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
