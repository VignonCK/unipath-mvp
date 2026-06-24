# Installe les hooks Git de sécurité (Windows / cross-platform)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/install-git-hooks.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$srcDir = Join-Path $repoRoot 'scripts\git-hooks'
$destDir = Join-Path $repoRoot '.git\hooks'

if (-not (Test-Path $destDir)) {
    Write-Error "Dossier .git/hooks introuvable. Exécutez ce script à la racine d'un dépôt Git."
}

Copy-Item (Join-Path $srcDir 'pre-commit') (Join-Path $destDir 'pre-commit') -Force
Copy-Item (Join-Path $srcDir 'pre-commit.ps1') (Join-Path $destDir 'pre-commit.ps1') -Force
Copy-Item (Join-Path $srcDir 'pre-commit.sh') (Join-Path $destDir 'pre-commit.sh') -Force

Write-Host "✅ Hooks pre-commit installés depuis scripts/git-hooks/" -ForegroundColor Green
Write-Host ""
Write-Host "Vérifications actives sur les lignes ajoutées uniquement :"
Write-Host "  • Fichiers .env"
Write-Host "  • Mots de passe / clés API / tokens"
Write-Host "  • URLs PostgreSQL avec credentials"
Write-Host "  • Clés AWS (AKIA…) et JWT (eyJ…)"
Write-Host ""
