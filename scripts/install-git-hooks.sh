#!/bin/bash

# Script pour installer les hooks Git de sécurité
# Usage: bash scripts/install-git-hooks.sh

echo "🔧 Installation des hooks Git de sécurité..."
echo ""

# Créer le hook pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Hook pre-commit pour empêcher les commits de secrets

echo "🔍 Vérification des secrets avant commit..."

# Vérifier les fichiers .env
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
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

# Patterns de secrets à détecter
PATTERNS=(
  "password.*=.*[a-zA-Z0-9]{4,}"
  "api[_-]?key.*=.*[a-zA-Z0-9]{10,}"
  "secret.*=.*[a-zA-Z0-9]{10,}"
  "token.*=.*[a-zA-Z0-9]{20,}"
  "[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}"
  "postgresql://[^:]+:[^@]+@"
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Vérifier dans le diff staged
  if git diff --cached | grep -i -E "$pattern" > /dev/null; then
    if [ $FOUND -eq 0 ]; then
      echo ""
      echo "❌ ERREUR: Possible secret détecté dans le commit"
      echo ""
    fi
    echo "  Pattern détecté: $pattern"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "Vérifiez que vous ne commitez pas de credentials."
  echo "Si c'est un faux positif, utilisez: git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ Aucun secret détecté"
exit 0
EOF

# Rendre le hook exécutable
chmod +x .git/hooks/pre-commit

echo "✅ Hook pre-commit installé avec succès"
echo ""
echo "Le hook vérifiera automatiquement:"
echo "  • Fichiers .env"
echo "  • Mots de passe"
echo "  • Clés API"
echo "  • Tokens"
echo "  • Credentials de base de données"
echo ""
echo "Pour bypasser le hook (déconseillé):"
echo "  git commit --no-verify"
echo ""
