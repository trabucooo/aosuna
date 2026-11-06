import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Las fuentes van como archivos, nunca incrustadas, para permitir una CSP estricta
    assetsInlineLimit: 0,
  },
});
