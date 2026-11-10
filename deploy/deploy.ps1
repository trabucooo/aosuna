# Despliega el portfolio en el VPS desde Windows (PowerShell).
#
# Que hace: entra por SSH en el servidor, baja de GitHub la ultima version de la rama, reconstruye la imagen
# de Docker y cambia el contenedor por el nuevo. Caddy no se toca: sigue atendiendo mientras tanto.
# La web se compila DENTRO del servidor (Dockerfile), asi que no hace falta subir dist/ ni tener Docker aqui.
#
# Uso:
#   .\deploy\deploy.ps1 -Destino usuario@servidor
# o, para no escribirlo cada vez, guarda el destino una vez en una variable de entorno de tu usuario:
#   [Environment]::SetEnvironmentVariable('AOSUNA_SSH', 'usuario@servidor', 'User')    (y abre otra terminal)
#   .\deploy\deploy.ps1
#
# Antes de la primera vez hay que preparar el servidor: ver DESPLIEGUE.md.
# (Este archivo va sin tildes a proposito: PowerShell 5.1 las lee mal si el archivo no lleva BOM.)

param(
    # usuario@servidor (o un alias de tu ~/.ssh/config)
    [string]$Destino = $env:AOSUNA_SSH,
    # Carpeta del repositorio en el servidor, relativa a la carpeta personal del usuario
    [string]$Ruta = 'apps/aosuna',
    # Rama que se despliega
    [string]$Rama = 'main',
    # Direccion publica, para la comprobacion final
    [string]$Url = 'https://aosuna.es'
)

$ErrorActionPreference = 'Stop'

function Paso($texto) { Write-Host ''; Write-Host "== $texto" -ForegroundColor Cyan }

if (-not $Destino) {
    Write-Host 'Falta el destino. Usa:  .\deploy\deploy.ps1 -Destino usuario@servidor' -ForegroundColor Red
    Write-Host '(o define la variable de entorno AOSUNA_SSH; ver el comentario al principio de este archivo)'
    exit 1
}

# 1. Lo que se despliega es lo que hay en GitHub, no lo que hay en este ordenador: se avisa si no coinciden
Paso "Comprobando que GitHub tiene lo ultimo de '$Rama'"
git fetch --quiet origin
if ($LASTEXITCODE -ne 0) { Write-Host 'No puedo hablar con GitHub (git fetch).' -ForegroundColor Red; exit 1 }
$local = (git rev-parse --verify --quiet $Rama)
$remoto = (git rev-parse --verify --quiet "origin/$Rama")
if (-not $remoto) { Write-Host "La rama '$Rama' no existe en GitHub." -ForegroundColor Red; exit 1 }
if ($local -and ($local -ne $remoto)) {
    Write-Host "Tu '$Rama' local y la de GitHub no coinciden. Si tienes commits sin subir:  git push origin $Rama" -ForegroundColor Yellow
    $r = Read-Host 'Se desplegara lo que hay en GitHub. Seguir? (s/n)'
    if ($r -ne 's') { exit 1 }
}
Write-Host ('Se va a desplegar: ' + (git log -1 --format='%h %s' "origin/$Rama"))

# 2. En el servidor: bajar, reconstruir y arrancar. "set -e" corta en el primer fallo, asi el contenedor
#    que esta en marcha no se toca si el build falla. --ff-only: nunca mezcla ni pisa nada alli
Paso "Desplegando en $Destino (~/$Ruta)"
$remotoCmd = @(
    'set -e',
    "cd ~/$Ruta",
    'git fetch --quiet origin',
    "git checkout --quiet $Rama",
    "git pull --ff-only --quiet origin $Rama",
    'docker compose build',
    'docker compose up -d',
    'docker image prune -f > /dev/null',
    'sleep 3',
    'docker compose ps'
) -join ' && '
ssh $Destino $remotoCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'El despliegue ha fallado. Si fallo el build, la version anterior sigue en marcha.' -ForegroundColor Red
    Write-Host "Mira el error de arriba. Para ver el estado:  ssh $Destino 'cd ~/$Ruta && docker compose ps && docker compose logs --tail 30'"
    exit 1
}

# 3. Comprobacion desde fuera: que responde y con que cabeceras
Paso "Comprobando $Url"
$cabeceras = curl.exe -sI --max-time 15 "$Url/"
if ($LASTEXITCODE -ne 0 -or -not $cabeceras) {
    Write-Host "No responde $Url. Revisa Caddy:  ssh $Destino 'docker logs --tail 30 caddy'" -ForegroundColor Red
    exit 1
}
$cabeceras | Select-String -Pattern '^HTTP|^cache-control|^content-security-policy|^strict-transport-security' | ForEach-Object { Write-Host ('  ' + $_.Line.Substring(0, [Math]::Min(110, $_.Line.Length))) }
$zalapp = curl.exe -s -o NUL -w '%{http_code}' --max-time 15 "$Url/zalapp/"
Write-Host "  /zalapp/ -> $zalapp"
if (($cabeceras | Select-Object -First 1) -notmatch ' 200') { Write-Host 'La portada no devuelve 200.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host 'Desplegado.' -ForegroundColor Green
