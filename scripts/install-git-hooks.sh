#!/bin/bash

# Installe les hooks Git de sécurité depuis scripts/git-hooks/
# Usage: bash scripts/install-git-hooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_ROOT/scripts/git-hooks"
DEST_DIR="$REPO_ROOT/.git/hooks"

echo "🔧 Installation des hooks Git de sécurité..."
echo ""

if [ ! -d "$DEST_DIR" ]; then
  echo "❌ Dossier .git/hooks introuvable."
  exit 1
fi

cp "$SRC_DIR/pre-commit" "$DEST_DIR/pre-commit"
cp "$SRC_DIR/pre-commit.ps1" "$DEST_DIR/pre-commit.ps1"
cp "$SRC_DIR/pre-commit.sh" "$DEST_DIR/pre-commit.sh"
chmod +x "$DEST_DIR/pre-commit" "$DEST_DIR/pre-commit.sh"

echo "✅ Hooks pre-commit installés depuis scripts/git-hooks/"
echo ""
echo "Vérifications actives sur les lignes ajoutées uniquement :"
echo "  • Fichiers .env"
echo "  • Mots de passe / clés API / tokens"
echo "  • URLs PostgreSQL avec credentials"
echo "  • Clés AWS (AKIA…) et JWT (eyJ…)"
echo ""
