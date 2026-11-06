# Caddy delante del portfolio

nginx (dentro del contenedor `portfolio`) solo habla HTTP en el puerto 8080 de la red `web`. Caddy es quien sirve HTTPS, así que **HSTS se pone en Caddy, no en nginx**. El resto de cabeceras de seguridad (CSP, nosniff, etc.) las pone nginx desde `nginx/security-headers.conf`.

## Bloque para el Caddyfile

```caddy
aosuna.es {
	encode zstd gzip

	# Obliga a usar HTTPS durante un año, también en los subdominios (stats.aosuna.es incluido)
	header Strict-Transport-Security "max-age=31536000; includeSubDomains"

	reverse_proxy portfolio:8080
}

# www siempre redirige al dominio sin www, conservando la ruta
www.aosuna.es {
	redir https://aosuna.es{uri} permanent
}
```

Después de editarlo, recarga Caddy sin cortar el servicio:

```sh
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

(cambia `caddy` por el nombre de tu contenedor de Caddy).

## Antes de activar HSTS

- `includeSubDomains` obliga a que **todos** los subdominios de aosuna.es funcionen por HTTPS. Hoy son `www` y `stats`, y los dos los sirve Caddy con certificado, así que no hay problema. Si algún día creas un subdominio sin HTTPS, los navegadores que ya hayan visto la cabecera no podrán abrirlo durante un año.
- Para probar con calma, puedes empezar con `max-age=300` (cinco minutos) y subirlo a `31536000` cuando veas que todo va bien.
- No añadas `preload` salvo que quieras pedir la inclusión en la lista de precarga de los navegadores: salir de esa lista tarda meses.

## Comprobar

```sh
curl -sI https://aosuna.es/ | grep -iE "strict-transport|content-security|x-frame"
curl -sI https://www.aosuna.es/cualquier/ruta   # debe dar 301 hacia https://aosuna.es/cualquier/ruta
```
