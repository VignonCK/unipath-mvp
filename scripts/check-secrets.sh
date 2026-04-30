#!/bin/bash

# Script pour vérifier la présence de secrets dans le code
# Usage: bash scripts/check-secrets.sh

echo "🔍 Vérification des secrets dans le repository..."
echo ""

# Patterns à rechercher
PATTERNS=(
  "password.*=.*[a-zA-Z0-9]"
  "api[_-]?key.*=.*[a-zA-Z0-9]"
  "secret.*=.*[a-zA-Z0-9]"
  "token.*=.*[a-zA-Z0-9]"
  "[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}"
  "postgresql://.*:.*@"
  "smtp.*password"
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  echo "Recherche de: $pattern"
  
  # Rechercher dans les fichiers trackés
  results=$(git grep -i -E "$pattern" -- ':!*.md' ':!*.example' ':!scripts/*' 2>/dev/null)
  
  if [ ! -z "$results" ]; then
    echo "❌ TROUVÉ dans les fichiers trackés:"
    echo "$results"
    echo ""
    FOUND=1
  fi
done

# Vérifier les fichiers .env
echo "Vérification des fichiers .env..."
if git ls-files | grep -E '\.env$|\.env\.local$'; then
  echo "❌ ERREUR: Fichiers .env trouvés dans Git!"
  FOUND=1
else
  echo "✅ Aucun fichier .env dans Git"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FOUND -eq 1 ]; then
  echo "❌ SECRETS DÉTECTÉS!"
  echo ""
  echo "Actions à faire:"
  echo "1. Révoquer tous les secrets trouvés"
  echo "2. Générer de nouveaux secrets"
  echo "3. Nettoyer l'historique Git avec BFG"
  echo "4. Lire SECURITY_ALERT.md pour les instructions"
  exit 1
else
  echo "✅ Aucun secret détecté dans les fichiers trackés"
  echo ""
  echo "⚠️  Note: Ce script ne vérifie pas l'historique Git"
  echo "Pour vérifier l'historique, utiliser:"
  echo "  git log -p | grep -i 'password'"
  exit 0
fi
