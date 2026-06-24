#!/bin/sh

# Hook pre-commit : bloque les fichiers .env et les secrets évidents dans les lignes ajoutées.

echo "🔍 Vérification des secrets avant commit..."

if git diff --cached --name-only | grep -qE '\.env$|\.env\.local$'; then
  echo ""
  echo "❌ ERREUR: Tentative de commit d'un fichier .env"
  echo ""
  echo "Les fichiers .env contiennent des secrets et ne doivent JAMAIS être commités."
  echo ""
  echo "Pour corriger:"
  echo "  git reset HEAD <fichier.env>"
  echo ""
  exit 1
fi

ADDED_LINES=$(git diff --cached -U0 | grep '^+' | grep -v '^\+\+\+' || true)

if [ -z "$ADDED_LINES" ]; then
  echo "✅ Aucun secret détecté"
  exit 0
fi

FOUND=0

check_pattern() {
  pattern="$1"
  if printf '%s\n' "$ADDED_LINES" | grep -qiE "$pattern"; then
    if [ "$FOUND" -eq 0 ]; then
      echo ""
      echo "❌ ERREUR: Possible secret détecté dans le commit"
      echo ""
    fi
    echo "  Pattern détecté: $pattern"
    FOUND=1
  fi
}

check_pattern 'password[[:space:]]*=[[:space:]]*[^[:space:]]{8,}'
check_pattern 'api[_-]?key[[:space:]]*=[[:space:]]*[^[:space:]]{10,}'
check_pattern 'secret[[:space:]]*=[[:space:]]*[^[:space:]]{10,}'
check_pattern 'token[[:space:]]*=[[:space:]]*[^[:space:]]{20,}'
check_pattern 'postgresql://[a-zA-Z0-9_]+:[^[:space:]]{6,}@[a-zA-Z0-9.-]+'
check_pattern 'AKIA[0-9A-Z]{16}'
check_pattern 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.'

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Vérifiez que vous ne commitez pas de credentials."
  echo ""
  exit 1
fi

echo "✅ Aucun secret détecté"
exit 0
