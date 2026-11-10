# Portfolio de Alonso Osuna

Web hecha con Vite y servida con nginx en un contenedor Docker.

- `npm install`: instala lo necesario.
- `npm run dev`: abre la web en modo desarrollo.
- `npm run build`: genera la versión final en `dist/`.
- `npm run og`: regenera `public/og.png` y `public/og-en.png` (las imágenes al compartir) a partir de sus SVG.
- Prueba en Docker: `docker compose -f compose.yaml -f compose.local.yaml up -d --build`
- Publicar en el VPS: `.deploydeploy.ps1` (la guía completa está en `DESPLIEGUE.md`).
- Analítica: el ID de Umami va en `.env` (plantilla en `.env.example`); sin él, el build sale sin analítica.

Páginas: la portada (`index.html`, y `en/index.html` en inglés) y la de Zalapp (`zalapp/index.html` y `en/zalapp/index.html`). Las etapas de la página de Zalapp no se escriben a mano: `vite.config.js` las copia del cuaderno de la portada al compilar.
