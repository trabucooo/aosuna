# Portfolio de Alonso Osuna

Web hecha con Vite y servida con nginx en un contenedor Docker.

- `npm install`: instala lo necesario.
- `npm run dev`: abre la web en modo desarrollo.
- `npm run build`: genera la versión final en `dist/`.
- `npm run og`: regenera `public/og.png` y `public/og-en.png` (las imágenes al compartir) a partir de sus SVG.
- Prueba en Docker: `docker compose -f compose.yaml -f compose.local.yaml up -d --build`
