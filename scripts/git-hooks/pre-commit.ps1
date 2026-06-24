# Pre-commit hook: block .env files and obvious secrets in added lines only.

Write-Host "Verification des secrets avant commit..." -ForegroundColor Cyan

$stagedNames = @(git diff --cached --name-only)
$envFiles = $stagedNames | Where-Object { $_ -match '\.env$|\.env\.local$' }

if ($envFiles) {
    Write-Host ""
    Write-Host "ERREUR: Tentative de commit d un fichier .env" -ForegroundColor Red
    Write-Host ""
    exit 1
}

$scanPaths = @(
    $stagedNames | Where-Object {
        $_ -notmatch '^scripts/git-hooks/' -and
        $_ -notmatch '^scripts/install-git-hooks'
    }
)

if ($scanPaths.Count -eq 0) {
    Write-Host "Aucun secret detecte" -ForegroundColor Green
    exit 0
}

$diffOutput = git diff --cached -U0 -- @scanPaths
$addedLines = @($diffOutput | Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' })

if ($addedLines.Count -eq 0) {
    Write-Host "Aucun secret detecte" -ForegroundColor Green
    exit 0
}

$addedText = $addedLines -join "`n"

$patterns = @(
    'password\s*=\s*\S+'
    'api[_-]?key\s*=\s*\S+'
    'secret\s*=\s*\S+'
    'token\s*=\s*\S+'
    'AKIA[0-9A-Z]+'
)

$found = $false

foreach ($pattern in $patterns) {
    if ($addedText -match $pattern) {
        if (-not $found) {
            Write-Host ""
            Write-Host "ERREUR: Possible secret detecte dans le commit" -ForegroundColor Red
            Write-Host ""
        }
        Write-Host "  Pattern detecte: $pattern" -ForegroundColor Yellow
        $found = $true
    }
}

# URL PostgreSQL avec identifiants reels (hors definitions de patterns dans les hooks).
if ($addedText -match 'postgresql://[a-zA-Z0-9_]+:[a-zA-Z0-9]{6,}@[a-zA-Z0-9.-]+') {
    if (-not $found) {
        Write-Host ""
        Write-Host "ERREUR: Possible secret detecte dans le commit" -ForegroundColor Red
        Write-Host ""
    }
    Write-Host "  Pattern detecte: postgresql://user:password@host" -ForegroundColor Yellow
    $found = $true
}

if ($addedText -match 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') {
    if (-not $found) {
        Write-Host ""
        Write-Host "ERREUR: Possible secret detecte dans le commit" -ForegroundColor Red
        Write-Host ""
    }
    Write-Host "  Pattern detecte: JWT (eyJ...)" -ForegroundColor Yellow
    $found = $true
}

if ($found) {
    Write-Host ""
    Write-Host "Verifiez que vous ne commitez pas de credentials." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Aucun secret detecte" -ForegroundColor Green
exit 0
