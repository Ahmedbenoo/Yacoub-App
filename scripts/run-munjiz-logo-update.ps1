# Free disk, then repaint Munjiz center icon (run from repo root)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
& (Join-Path $here 'free-disk-for-logo.ps1')
& (Join-Path $here 'replace-munjiz-logo-center.ps1')
