# Analítica con Umami

La web usa [Umami](https://umami.is) alojado en tu VPS, en `https://stats.aosuna.es`. No usa cookies ni guarda datos personales, así que no hace falta banner de consentimiento.

Si Umami está caído, bloqueado por un bloqueador de anuncios o todavía no está montado, la web funciona igual: todos los eventos pasan por `track()` en `src/main.js`, que no hace nada si `window.umami` no existe y nunca lanza errores.

## Qué tienes que rellenar

En `index.html` y en `en/index.html`, cambia `UMAMI_WEBSITE_ID` por el ID que te da Umami al dar de alta la web (Settings → Websites → Add website → copia el *Website ID*).

```html
<script defer src="https://stats.aosuna.es/script.js" data-website-id="UMAMI_WEBSITE_ID" data-domains="aosuna.es"></script>
```

Las visitas a páginas (`/` y `/en/`) se cuentan solas. Los eventos de abajo se ven en Umami → la web → *Events*.

## Eventos

Esta tabla sale del código de `src/main.js` y de `src/scenes/mapping.js` (todas las llamadas a `track()`). Si añades o cambias un evento, cámbialo también aquí.

Los valores de los datos van siempre en español, aunque la visita sea en la versión inglesa. Así cada evento suma en una sola fila y no se reparte entre dos idiomas.

### Contacto (la conversión)

| Evento | Cuándo se envía | Datos | Notas |
| --- | --- | --- | --- |
| `scroll-contacto` | La primera vez en cada visita que la sección de contacto entra en pantalla (20 % visible) | — | Es el paso previo del embudo. |
| `email-clic` | Clic en el email grande de contacto (enlace `mailto:`) | — | La conversión principal. |
| `email-copiado` | Clic en «Copiar email» (`#copy`), cuando ya se sabe qué ha pasado | `modo`: `portapapeles` (copiado) o `seleccion` (el navegador no deja copiar y el email queda seleccionado) | |
| `linkedin` | Clic en el enlace de LinkedIn | — | |
| `cv-descargado` | Clic en «Descargar CV» | `idioma`: `es` o `en` (el CV que se descarga) | |
| `dock-contacto` | Clic en «Escríbeme» del dock (`#bContact`), que lleva a la sección de contacto | — | Mide si el acceso fijo se usa. |

### Navegación y herramientas de la página

| Evento | Cuándo se envía | Datos | Notas |
| --- | --- | --- | --- |
| `scroll-profundidad` | La primera vez en cada visita que se llega al 25, 50, 75 y 100 % de la página | `pct`: 25, 50, 75 o 100 | Quien salta a «Contacto» desde el menú o el dock pasa por los cuatro de golpe: para saber si se ha leído, míralo junto a los eventos de cada proyecto. |
| `laboratorio-visto` | La primera vez en cada visita que la caja de herramientas entra en pantalla | — | La entrada al laboratorio. `herramienta` y `caja-volcada` dicen si además se juega con él. |
| `menu` | Clic en un enlace del menú de arriba | `a`: `#inicio`, `#historia`, `#herramientas`, `#trabajo` o `#contacto` | `#trabajo` es «Proyectos». |
| `idioma` | Clic en el selector ES / EN | `a`: el idioma al que se cambia, `es` o `en` | |
| `intro-completa` | La intro llega al final sin que nadie la corte (o al tope de 2,4 s en un equipo lento) | — | La intro solo sale en la primera visita (se recuerda en `localStorage`), así que cuenta visitantes nuevos. Compárala con `intro-saltada`. |
| `intro-saltada` | La intro se corta antes de acabar | `modo`: `boton` («Saltar intro»), `scroll` (rueda), `toque` (deslizar en táctil) o `tecla` | Con «reducir movimiento» o con las animaciones en pausa no hay intro y no llega ninguno de los dos. |
| `pausa` | Clic en «Pausar animaciones» (`#bPause`) | `activa`: `si` al pausar, `no` al reanudar | |
| `auditar-abierto` | Al activar «Auditar esta web» (`#bAudit`) | — | |
| `auditar-nota` | Cada vez que se abre una nota de la auditoría (también la primera, al activar el modo) | `nota`: de 1 a 14 (ver la lista de abajo) | |
| `jefe-abierto` | Al abrir el panel «Jefe de obra» (botón o tecla `/`) | — | |
| `jefe-orden` | Al enviar una orden, escrita o con una de las sugerencias | `orden`: la orden reconocida (ver abajo) o `desconocida` | Nunca se envía el texto que escribe la gente. |

Valores de `orden` en `jefe-orden`:

- `letter:a`, `letter:l`, `letter:o`, `letter:n`, `letter:s`: traer o tirar una letra («Traed la O»).
- `break`: romper el nombre. `reset`: dejarlo normal.
- `paint:red`, `paint:blue`, `paint:green`, `paint:pink`, `paint:yellow`, `paint:orange`, `paint:purple`, `paint:black`: pintar el fondo. `paint:otro`: un color que no hay.
- `goto:projects`, `goto:contact`, `goto:tools`, `goto:home`, `goto:zalapp`, `goto:nautes`, `goto:explora`, `goto:alcar`, `goto:mapping`, `goto:formacion`, `goto:sellos`: ir a una sección.
- `dance`, `follow`, `circle`, `leave`, `strike`, `work`: las órdenes al equipo (bailar, seguir, círculo, vacaciones, huelga, volver al trabajo).
- `desconocida`: cualquier otra cosa.

### Proyectos

| Evento | Cuándo se envía | Datos | Notas |
| --- | --- | --- | --- |
| `sello` | Al abrir uno de los sellos de formación de «Ese equipo soy yo» (no cuenta al cerrarlo) | `sello`: 1 (Actividades Comerciales) o 2 (Marketing y Publicidad) | |
| `nautes-velero` | La primera vez en cada visita que el velero termina de convertirse en la web de Nautes y aparece la captura | — | |
| `nautes-web` | Clic en «Ver nautes.es ↗» de la ficha, o clic en la captura de la web cuando el velero ya se ha transformado | — | Las dos cosas abren nautes.es en otra pestaña. |
| `nautes-paso` | Al abrir una boya del rumbo de Nautes (ratón encima, foco o toque) | `paso`: Pregunta, Brief, Estructura o Metadatos | Al pasar el ratón por varias boyas, cuenta una vez por cada una. |
| `explora-brujula` | Cada vez que un punto cardinal de la brújula pasa a estar activo (ratón encima, foco o toque) | `punto`: N, E, S u O | Si el mismo punto sigue activo, no se repite. |
| `explora-pieza` | Al pulsar una pieza del diario de prácticas | `fecha`: la fecha corta en español, p. ej. «19 mar» | |
| `zalapp-movil` | En el móvil de Zalapp: al encenderlo, al abrir el cuaderno y al pulsar «Ver la web» | `accion`: `encender`, `cuaderno` o `web` | `cuaderno` cuenta desde la hoja del móvil, desde la captura fija y desde «Abrir el cuaderno de ruta» de la ficha. |
| `zalapp-etapa` | Cada etapa del cuaderno que se ve (también la primera, al abrirlo) | `etapa`: El problema, La encuesta, La competencia, DAFO y CAME, La marca, La beta, Lo que no prometemos, Próxima salida o El equipo | |
| `zalapp-cerrar` | Al cerrar el cuaderno (botón o Escape) | `etapa`: el número de la etapa en la que se cierra, de 1 a 9 | Dice hasta dónde se lee. |
| `zalapp-filtro` | Al pulsar un filtro de la encuesta, en la etapa «La encuesta» | `filtro`: p. ej. «41 conductores» | |
| `zalapp-pagina-etapa` | En la página propia de Zalapp (`/zalapp/` y `/en/zalapp/`): cada etapa, la primera vez que cruza el centro de la pantalla | `etapa`: los mismos nombres que `zalapp-etapa` | Dice hasta dónde se lee la página. La visita en sí no necesita evento: Umami la cuenta como página vista de `/zalapp/`. |
| `zalapp-pagina-cta` | En la página propia de Zalapp: clic en uno de los dos botones del final | `a`: `contacto` («Escríbeme») o `portfolio` («Ver el portfolio») | Mide si la página lleva gente al resto del portfolio. |
| `alcar-obra` | Al levantar la captura de la web nueva de Alcar sobre el plano (ratón encima, foco o primer toque) y, cuando haya dirección, al entrar en la web | `accion`: `levantar` o `entrar` | Mientras `PORTAL_URL` esté vacío, solo llega `levantar`. |
| `videomapping-encajado` | La primera vez en cada visita que se encajan las cuatro esquinas del videomapping | — | |
| `letra-rota` | Al soltar una letra del nombre después de arrastrarla | `letra`: A, L, O, N o S | |
| `herramienta` | Al pulsar una herramienta de la caja | `nombre`: p. ej. «WordPress» | |
| `caja-volcada` | Clic en «Volcar la caja» (`#dump`) | — | |

Números de `auditar-nota` (los títulos de `src/i18n.js`):

1. La intro
2. Una frase
3. Invitar a tocar
4. Menú corto
5. Trayectoria elegida
6. Formación con sello
7. Del barco a la web
8. El método, en ruta
9. Un nudo, no un párrafo
10. La app, por dentro
11. Del plano a la obra
12. Probar en vez de leer
13. Nivel real
14. Un solo objetivo

## Embudo de contacto

El objetivo del portfolio es que te escriban. En Umami, crea un embudo (Reports → Funnel) con estos pasos:

1. Visita a `/` o a `/en/`.
2. `scroll-contacto`: ha llegado a la sección de contacto.
3. `email-clic`, `email-copiado`, `linkedin` o `cv-descargado`: ha hecho algo para contactar.

Para ver dónde se va la gente antes de llegar, mira `scroll-profundidad`: si muchos llegan al 25 % y pocos al 50 %, se pierden en los primeros proyectos.

Para ver qué lleva hasta ahí, compara el paso 2 con:

- `dock-contacto`: cuánta gente llega a contacto desde el botón fijo «Escríbeme», sin pasar por todo.
- `menu` con `a` = `#contacto`: lo mismo desde el menú.
- `zalapp-cerrar`, `nautes-web` y `explora-pieza`: si quien abre los proyectos acaba contactando más.

Fíjate también en `email-copiado` con `modo` = `seleccion`: si sale a menudo, hay navegadores que no dejan copiar y la gente tiene que hacerlo a mano.

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
- **Que no cuenten las pruebas en local:** la etiqueta del script ya lleva `data-domains="aosuna.es"`, así que Umami solo envía datos desde ese dominio y no desde `localhost`.
- **CSP:** cuando pongas la cabecera `Content-Security-Policy`, Umami necesita estar en `script-src` (para cargar `script.js`) y en `connect-src` (para enviar los eventos a `/api/send`):

  ```
  script-src 'self' https://stats.aosuna.es; connect-src 'self' https://stats.aosuna.es
  ```

- **Copias de seguridad:** los datos están en el volumen `umami-db`. Puedes volcarlos con `docker exec umami-db pg_dump -U umami umami > umami-$(date +%F).sql`.
