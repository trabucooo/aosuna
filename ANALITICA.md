# Analítica con Umami

La web usa [Umami](https://umami.is) alojado en tu VPS, en `https://stats.aosuna.es`. No usa cookies ni guarda datos personales, así que no hace falta banner de consentimiento.

Si Umami está caído, bloqueado por un bloqueador de anuncios o todavía no está montado, la web funciona igual: todos los eventos pasan por `track()` en `src/main.js`, que no hace nada si `window.umami` no existe y nunca lanza errores.

## Qué tienes que rellenar

En `index.html` y en `en/index.html`, cambia `UMAMI_WEBSITE_ID` por el ID que te da Umami al dar de alta la web (Settings → Websites → Add website → copia el *Website ID*).

```html
<script defer src="https://stats.aosuna.es/script.js" data-website-id="UMAMI_WEBSITE_ID"></script>
```

Las visitas a páginas (`/` y `/en/`) se cuentan solas. Los eventos de abajo se ven en Umami → la web → *Events*.

## Eventos

Los valores de los datos van siempre en español, aunque la visita sea en la versión inglesa. Así cada evento suma en una sola fila y no se reparte entre dos idiomas.

| Evento | Cuándo se envía | Datos |
| --- | --- | --- |
| `intro-saltada` | Clic en «Saltar intro» (`#skip`) | — |
| `letra-rota` | Al soltar una letra del nombre después de arrastrarla | `letra`: A, L, O, N o S |
| `auditar-abierto` | Al activar «Auditar esta web» (`#bAudit`) | — |
| `auditar-nota` | Cada vez que se abre una nota de la auditoría | `nota`: número de 1 a 11 (ver tabla de abajo) |
| `jefe-abierto` | Al abrir el panel «Jefe de obra» (botón o tecla `/`) | — |
| `jefe-orden` | Al enviar una orden, escrita o con una de las sugerencias | `orden`: el texto en minúsculas, sin tildes y recortado a 40 caracteres |
| `zalapp-filtro` | Al pulsar un filtro de la muestra de Zalapp | `filtro`: p. ej. «41 conductores» |
| `nautes-paso` | Al pulsar un paso de Nautes | `paso`: Pregunta, Brief, Estructura o Metadatos |
| `portal-alcar` | Clic en la captura de Alcar (`#portal`). En móvil, el primer toque solo abre la vista previa y no cuenta; cuenta el segundo, el que entra | — |
| `videomapping-encajado` | La primera vez que se encajan las cuatro esquinas del videomapping | — |
| `herramienta` | Al pulsar una herramienta de la caja | `nombre`: p. ej. «WordPress» |
| `caja-volcada` | Clic en «Volcar la caja» (`#dump`) | — |
| `email-copiado` | Clic en «Copiar email» (`#copy`) | — |
| `linkedin` | Clic en el enlace de LinkedIn | — |
| `cv-descargado` | Clic en «Descargar CV» | `idioma`: `es` o `en` |
| `idioma` | Clic en el selector ES / EN | `a`: el idioma al que se cambia, `es` o `en` |
| `scroll-contacto` | La primera vez en cada visita que la sección de contacto entra en pantalla | — |

Números de `auditar-nota`:

1. La intro
2. Una frase
3. Invitar a tocar
4. Menú corto
5. Trayectoria elegida
6. Enseñar la base
7. Decir el límite
8. Entrar a la web
9. Probar en vez de leer
10. Nivel real
11. Un solo objetivo

Ten en cuenta que `jefe-orden` envía lo que el visitante escribe (recortado a 40 caracteres). Es lo que pediste para ver qué órdenes prueba la gente, pero si alguien escribe algo personal, llegará a tu Umami.

## Montar Umami en la VPS

Esto supone que Caddy ya corre en Docker en la red externa `web`, la misma que usa el portfolio.

### 1. DNS

Crea un registro `A` (y `AAAA` si usas IPv6) para `stats.aosuna.es` que apunte a la IP de la VPS.

### 2. Carpeta y secretos

```sh
mkdir -p ~/umami && cd ~/umami
printf 'POSTGRES_PASSWORD=%s\nAPP_SECRET=%s\n' "$(openssl rand -hex 24)" "$(openssl rand -hex 32)" > .env
chmod 600 .env
```

### 3. `compose.yaml`

```yaml
services:
  umami:
    # Fija una versión concreta en cuanto la hayas probado, p. ej. ghcr.io/umami-software/umami:v3.x.x
    image: ghcr.io/umami-software/umami:latest
    container_name: umami
    restart: unless-stopped
    init: true
    environment:
      DATABASE_URL: postgresql://umami:${POSTGRES_PASSWORD}@umami-db:5432/umami
      APP_SECRET: ${APP_SECRET}
    depends_on:
      umami-db:
        condition: service_healthy
    networks:
      - web       # para que Caddy llegue a umami:3000
      - interna   # para hablar con la base de datos
    security_opt:
      - no-new-privileges:true
    mem_limit: 512m

  umami-db:
    image: postgres:16-alpine
    container_name: umami-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - umami-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - interna   # la base de datos no está en la red de Caddy
    security_opt:
      - no-new-privileges:true
    mem_limit: 256m

volumes:
  umami-db:

networks:
  web:
    external: true
  interna:
```

No se publica ningún puerto: igual que con el portfolio, solo Caddy está expuesto a internet.

```sh
docker compose up -d
docker compose logs -f umami   # espera a ver que arranca y aplica las migraciones
```

### 4. Caddy

Añade esto a tu `Caddyfile` y recarga Caddy (`docker exec caddy caddy reload --config /etc/caddy/Caddyfile`, cambiando `caddy` por el nombre de tu contenedor):

```caddy
stats.aosuna.es {
    encode zstd gzip
    reverse_proxy umami:3000
}
```

Caddy saca el certificado HTTPS solo.

### 5. Primer acceso

1. Entra en `https://stats.aosuna.es`. El usuario inicial es `admin` y la contraseña `umami`: **cámbiala nada más entrar**.
2. Settings → Websites → Add website: nombre «Portfolio», dominio `aosuna.es`.
3. Copia el *Website ID* y ponlo en lugar de `UMAMI_WEBSITE_ID` en `index.html` y `en/index.html`.
4. Vuelve a desplegar el portfolio.

## Recomendaciones

- **Que no cuenten tus propias visitas:** en la consola del navegador, estando en aosuna.es, ejecuta `localStorage.setItem('umami.disabled', 1)`.
- **Que no cuenten las pruebas en local:** si añades `data-domains="aosuna.es"` a la etiqueta del script, Umami solo envía datos desde ese dominio y no desde `localhost`.
- **CSP:** cuando pongas la cabecera `Content-Security-Policy`, Umami necesita estar en `script-src` (para cargar `script.js`) y en `connect-src` (para enviar los eventos a `/api/send`):

  ```
  script-src 'self' https://stats.aosuna.es; connect-src 'self' https://stats.aosuna.es
  ```

- **Copias de seguridad:** los datos están en el volumen `umami-db`. Puedes volcarlos con `docker exec umami-db pg_dump -U umami umami > umami-$(date +%F).sql`.
