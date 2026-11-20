$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$LogDir = Join-Path $Root 'clipstudio-logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$listener = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8792 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Output 'AION Clip Studio backend is already listening on 127.0.0.1:8792.'
    exit 0
}

$Node = (Get-Command node -ErrorAction Stop).Source
$Server = Join-Path $Root 'clipstudio-server.js'
$Stdout = Join-Path $LogDir 'server.log'
$Stderr = Join-Path $LogDir 'server-error.log'

Start-Process -FilePath $Node -ArgumentList @($Server) -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $Stdout -RedirectStandardError $Stderr
Start-Sleep -Seconds 2

try {
    $Health = Invoke-RestMethod 'http://127.0.0.1:8792/health' -TimeoutSec 4
    if ($Health.ok) {
        Write-Output 'AION Clip Studio backend started successfully.'
        Write-Output 'Private HTTPS ingress: https://aion-core.tail54b9ad.ts.net:8446'
        Write-Output 'Pairing code is written to clipstudio-logs\server.log.'
    } else {
        throw 'Health endpoint returned an unexpected response.'
    }
} catch {
    Write-Error "Backend did not become healthy: $($_.Exception.Message)"
    exit 1
}
