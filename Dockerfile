# Las dos imágenes van por etiqueta móvil: hay que fijarlas a la versión exacta que se use hoy
# (p. ej. node:24.x.y-alpine y nginx-unprivileged:1.x.y-alpine, o su digest @sha256:…) (SEC-03)

# 1. Compila la web con Vite
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. La sirve con nginx sin privilegios de root
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Fuera de conf.d para que nginx no lo cargue solo a nivel http: se incluye a mano desde cada location
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Docker sabe si nginx responde (SEC-03). wget viene en la imagen alpine (busybox)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
