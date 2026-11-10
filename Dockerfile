# Las dos imágenes van con la versión exacta (SEC-03): así el mismo commit construye siempre lo mismo y una
# actualización no entra sin que tú la decidas. Para actualizar, cambia el número aquí y vuelve a desplegar.
# Versiones a 10-11-2026: Node 24 (LTS) y la rama estable de nginx (1.30).

# 1. Compila la web con Vite
FROM node:24.22.2-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# El ID de Umami llega como argumento del build (compose.local.yaml lo lee del .env de tu ordenador) y Vite lo pone en el HTML.
# Vacío: la web sale sin analítica. No es un secreto: acaba a la vista en el HTML de cualquier visitante
ARG UMAMI_WEBSITE_ID=""
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID
RUN npm run build

# 2. La sirve con nginx sin privilegios de root
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Fuera de conf.d para que nginx no lo cargue solo a nivel http: se incluye a mano desde cada location
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Docker sabe si nginx responde (SEC-03). wget viene en la imagen alpine (busybox)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
