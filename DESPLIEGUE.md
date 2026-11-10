# Despliegue en el VPS (Docker + Caddy)

> **Estado de esta guía:** el contenedor del portfolio y Caddy delante de él **están probados en local con Docker** (11-11-2026: build, salud, redirecciones, caché, compresión, cabeceras, el ID de Umami y un recorrido completo de la web sin errores). **Lo que no se ha podido probar sin el VPS:** el HTTPS de Let's Encrypt, el DNS, el cortafuegos y el script `deploy.ps1` de principio a fin. Sigue los pasos en orden y, si algo no coincide con lo que ves, para y mira el apartado «Si algo falla». La guía supone un VPS con **Ubuntu o Debian**; si ya tienes Docker o Caddy instalados, sáltate esos pasos.

## Cómo queda montado

```
Internet ──► Caddy (puertos 80 y 443, HTTPS automático)
                │  red de Docker «web»
                ├──► portfolio  (nginx, puerto interno 8080)   aosuna.es
                ├──► umami      (más adelante)                  stats.aosuna.es
                └──► otras webs de prueba                       loquesea.aosuna.es
```

- **Caddy** es la única puerta de entrada: saca y renueva solo los certificados de Let's Encrypt, redirige de http a https y de `www` a sin `www`, comprime y reparte cada dominio a su contenedor.
- **Cada web o servicio va en su carpeta**, con su `compose.yaml`, conectado a la red `web` y **sin publicar puertos**. Añadir uno nuevo no toca a los demás.
- **El portfolio llega ya compilado**: la imagen se genera en tu ordenador (`Dockerfile`), se sube a Docker Hub (`alon54/aosuna-portfolio`) y el servidor solo la baja. En el servidor basta `git clone` y `docker compose up -d`.

En el servidor quedará así:

```
~/apps/
  caddy/     compose.yaml + Caddyfile     (copiados de deploy/caddy/ de este repositorio)
  aosuna/    este repositorio (git clone)
```

## Antes de empezar

1. **La imagen tiene que estar subida a Docker Hub** (paso 6) y la rama `main` de GitHub tiene que llevar el `compose.yaml` al día. El servidor baja la web de Docker Hub y el `compose.yaml` de GitHub.
2. **DNS** (en el panel de OVH, zona DNS de `aosuna.es`): dos registros de tipo **A** apuntando a la IP del VPS, uno para `aosuna.es` y otro para `www`. Si el VPS tiene IPv6, lo mismo con **AAAA**. Comprueba desde tu ordenador que ya responde antes de arrancar Caddy (si no, no podrá sacar el certificado):
   ```powershell
   nslookup aosuna.es
   nslookup www.aosuna.es
   ```
3. **Entrar por SSH** al VPS con el usuario que te dio OVH: `ssh usuario@IP`.

## 1. Preparar el servidor (una sola vez)

Todo esto se ejecuta **en el VPS**.

```sh
# Al día
sudo apt update && sudo apt upgrade -y

# Cortafuegos: solo SSH, web y HTTP/3
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable

# Docker (instalador oficial) y permiso para usarlo sin sudo
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit    # sal y vuelve a entrar por SSH para que el permiso tenga efecto
```

De vuelta en el VPS:

```sh
docker --version && docker compose version   # deben responder los dos
docker network create web                    # la red que comparten Caddy y las webs
mkdir -p ~/apps
```

**Por qué una red aparte:** dentro de la red `web`, los contenedores se ven por su nombre (`portfolio`, `umami`…). Caddy los encuentra así, y ninguno necesita abrir puertos al exterior.

## 2. Bajar el repositorio

```sh
cd ~/apps
git clone https://github.com/trabucooo/aosuna.git aosuna
```

Si el repositorio es **privado**, GitHub pedirá permiso. Lo más limpio es una *deploy key* (una llave que solo sirve para leer este repositorio):

```sh
ssh-keygen -t ed25519 -f ~/.ssh/aosuna_deploy -N ""
cat ~/.ssh/aosuna_deploy.pub     # copia esta línea
```

En GitHub: el repositorio → Settings → Deploy keys → Add deploy key → pega la línea (sin marcar «Allow write access»). Después:

```sh
printf 'Host github.com\n  IdentityFile ~/.ssh/aosuna_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
cd ~/apps && git clone git@github.com:trabucooo/aosuna.git aosuna
```

## 3. Arrancar el portfolio

```sh
cd ~/apps/aosuna
docker compose up -d        # baja la imagen de Docker Hub y arranca el contenedor
docker compose ps           # al medio minuto debe decir «healthy»
```

Si el repositorio de Docker Hub es **privado**, antes hay que entrar con `docker login -u alon54` (te pedirá un *access token*, que se crea en Docker Hub → Account settings → Personal access tokens).

Todavía no se ve desde fuera: falta Caddy.

## 4. Arrancar Caddy

```sh
mkdir -p ~/apps/caddy
cp ~/apps/aosuna/deploy/caddy/compose.yaml ~/apps/aosuna/deploy/caddy/Caddyfile ~/apps/caddy/
cd ~/apps/caddy
docker compose up -d
docker logs -f caddy        # verás cómo pide los certificados; Ctrl+C para salir
```

Se copia fuera del repositorio a propósito: el `Caddyfile` del servidor irá creciendo con otros dominios (Umami, pruebas) que no son del portfolio, y así un `git pull` nunca lo pisa. Los archivos de `deploy/caddy/` son el punto de partida.

## 5. Comprobar

Desde tu ordenador (PowerShell; `curl.exe` viene con Windows):

```powershell
curl.exe -sI https://aosuna.es/                 # 200, con content-security-policy y strict-transport-security
curl.exe -sI http://aosuna.es/                  # 308 hacia https
curl.exe -sI https://www.aosuna.es/zalapp/      # 301 hacia https://aosuna.es/zalapp/
curl.exe -sI https://aosuna.es/zalapp/          # 200
curl.exe -sI https://aosuna.es/en               # 301 hacia /en/ (sin «:8080» en la dirección)
curl.exe -sI https://aosuna.es/no-existe        # 404
curl.exe -sI https://aosuna.es/retrato-puntos.json   # cache-control: public, max-age=86400…
curl.exe -sI -H "Accept-Encoding: gzip" https://aosuna.es/retrato-puntos.json   # content-encoding: gzip
```

Y un archivo con huella (cópialo del código fuente de la página, empieza por `/assets/`): debe traer `cache-control: public, max-age=31536000, immutable`.

## 6. Publicar cambios

Cada vez que quieras publicar, dos pasos.

**1. En tu ordenador** (con Docker Desktop abierto, en la carpeta del proyecto): genera la imagen y súbela a Docker Hub. La primera vez hay que entrar con `docker login`.

```powershell
docker compose -f compose.yaml -f compose.local.yaml build
docker compose -f compose.yaml -f compose.local.yaml push
```

Conviene dejar además una copia con número de versión, para poder volver atrás (paso 9):

```powershell
docker tag alon54/aosuna-portfolio:latest alon54/aosuna-portfolio:v1.1
docker push alon54/aosuna-portfolio:v1.1
```

**2. En el VPS:**

```sh
cd ~/apps/aosuna
git pull                    # solo hace falta si ha cambiado compose.yaml
docker compose up -d        # baja la imagen nueva y cambia el contenedor
```

Si la imagen no se puede bajar, la versión anterior sigue en marcha.

### Con el script (opcional)

`deploy\deploy.ps1` hace el paso 2 desde Windows: comprueba que GitHub tiene lo último, entra por SSH, hace `git pull` y `docker compose up -d`, y comprueba que la web responde. **No genera ni sube la imagen:** el paso 1 hay que hacerlo antes.

```powershell
.\deploy\deploy.ps1 -Destino usuario@IP
```

Para no escribir el destino cada vez (una sola vez, y abre otra terminal después):

```powershell
[Environment]::SetEnvironmentVariable('AOSUNA_SSH', 'usuario@IP', 'User')
```

Si PowerShell no deja ejecutar scripts: `powershell -ExecutionPolicy Bypass -File .\deploy\deploy.ps1`.

## 7. Poner el ID de Umami (cuando Umami esté instalado)

El ID no está en el HTML: las cuatro páginas llevan el marcador `UMAMI_WEBSITE_ID` y el build lo cambia por el valor del archivo `.env`. Como la imagen se compila en tu ordenador, el `.env` va **en tu ordenador**, no en el VPS:

1. En la carpeta del proyecto, copia `.env.example` como `.env` y rellena `UMAMI_WEBSITE_ID=el-id-que-te-da-umami`.
2. Genera y sube la imagen otra vez, y actualiza el servidor (paso 6). Hay que reconstruir: el ID se pone al compilar.

Compruébalo: `curl.exe -s https://aosuna.es/ | findstr data-website-id`. La instalación de Umami está en `ANALITICA.md`.

## 8. Añadir otro contenedor (Umami, una web de prueba…)

1. Su carpeta en `~/apps/` con su `compose.yaml`. Dos reglas: la red `web` como externa y **ningún** `ports:`.
   ```yaml
   services:
     miweb:
       image: ...
       container_name: miweb
       restart: unless-stopped
       networks: [web]
   networks:
     web:
       external: true
   ```
2. Un registro DNS de tipo A para el subdominio.
3. Un bloque en `~/apps/caddy/Caddyfile` (hay dos de ejemplo comentados al final) y recargar:
   ```sh
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

## 9. Volver atrás

La forma segura: deshaz el cambio en tu ordenador con `git revert <commit>`, genera y sube la imagen otra vez y actualiza el servidor (paso 6). Queda registrado y el servidor sigue en `latest`.

Si corre prisa, directamente en el VPS, usando una versión numerada que subiste antes (y luego arréglalo con calma):

```sh
cd ~/apps/aosuna
nano compose.yaml                  # en «image:», cambia «latest» por la versión buena, p. ej. «v1.0»
docker compose up -d
# para volver a la normalidad:  git checkout compose.yaml && docker compose up -d
```

## 10. HSTS: de 5 minutos a un año

El `Caddyfile` empieza con `Strict-Transport-Security "max-age=300"`. Esa cabecera le dice al navegador «no vuelvas a entrar aquí sin HTTPS» durante ese tiempo. Cuando lleves unos días sin problemas, cámbiala por:

```
Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

- `includeSubDomains` obliga a que **todos** los subdominios de aosuna.es funcionen por HTTPS. Con Caddy delante de todo, lo cumplen. Si algún día creas uno sin HTTPS, los navegadores que ya vieron la cabecera no podrán abrirlo durante un año.
- No añadas `preload` salvo que quieras entrar en la lista de precarga de los navegadores: salir tarda meses.

## Mantenimiento

- **Sistema:** `sudo apt update && sudo apt upgrade -y` de vez en cuando.
- **Imágenes:** las versiones están fijadas en `Dockerfile` (Node y nginx) y en `deploy/caddy/compose.yaml` (Caddy). Para actualizar, cambia el número, genera y sube la imagen (paso 6) y comprueba. En Caddy: edita `~/apps/caddy/compose.yaml` y `docker compose up -d`.
- **Certificados:** Caddy los renueva solo. Viven en el volumen `caddy_data`: no lo borres.
- **Espacio:** `docker system df`. Las imágenes viejas se borran con `docker image prune -f` (el script de despliegue ya lo hace).

## Si algo falla

| Síntoma | Dónde mirar |
| --- | --- |
| El navegador dice que el certificado no es válido o no carga | `docker logs --tail 50 caddy`. Casi siempre es el DNS (aún no apunta al VPS) o el cortafuegos (80 y 443 cerrados). |
| 502 Bad Gateway | El contenedor `portfolio` no está en marcha o no está en la red `web`: `cd ~/apps/aosuna && docker compose ps && docker compose logs --tail 30`. |
| El build falla (en tu ordenador) | El error sale en pantalla. No se sube nada y el servidor sigue con la versión anterior. |
| `pull access denied` o no baja la imagen | La imagen no está subida a Docker Hub, o el repositorio es privado y falta `docker login` en el VPS. |
| `network web declared as external, but could not be found` | Falta `docker network create web`. |
| La web sale sin analítica | El `.env` de tu ordenador estaba vacío al generar la imagen: paso 7. |
| Caddy no arranca tras editar el `Caddyfile` | `docker run --rm -v ~/apps/caddy/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2.11.9-alpine caddy validate --config /etc/caddy/Caddyfile` |

## Probar el contenedor en tu ordenador

Con Docker Desktop abierto:

```powershell
docker network create web      # solo la primera vez
docker compose -f compose.yaml -f compose.local.yaml up -d --build
# http://localhost:8080  ·  para parar:  docker compose down
```

Con los dos archivos, la imagen se compila aquí con el `Dockerfile`. Con `compose.yaml` solo (como en el servidor), se baja de Docker Hub.
