#!/bin/bash

# Script de vérification de la santé du projet
# Usage: ./scripts/health-check.sh

set -e

echo "🔍 Vérification de la santé du projet UniPath..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

# Fonction pour afficher les erreurs
error() {
  echo -e "${RED}❌ $1${NC}"
  ((ERRORS++))
}

# Fonction pour afficher les warnings
warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

# Fonction pour afficher les succès
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Vérifier Node.js
echo "📦 Vérification de Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  success "Node.js installé: $NODE_VERSION"
else
  error "Node.js n'est pas installé"
fi
echo ""

# Vérifier npm
echo "📦 Vérification de npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  success "npm installé: $NPM_VERSION"
else
  error "npm n'est pas installé"
fi
echo ""

# Vérifier les fichiers .env
echo "🔐 Vérification des fichiers .env..."
if [ -f "unipath-api/.env" ]; then
  success "unipath-api/.env existe"
else
  error "unipath-api/.env manquant (copier depuis .env.example)"
fi

if [ -f "unipath-front/.env.local" ]; then
  success "unipath-front/.env.local existe"
else
  warning "unipath-front/.env.local manquant (optionnel)"
fi
echo ""

# Vérifier les node_modules
echo "📚 Vérification des dépendances..."
if [ -d "unipath-api/node_modules" ]; then
  success "Dépendances backend installées"
else
  warning "Dépendances backend manquantes (exécuter: cd unipath-api && npm install)"
fi

if [ -d "unipath-front/node_modules" ]; then
  success "Dépendances frontend installées"
else
  warning "Dépendances frontend manquantes (exécuter: cd unipath-front && npm install)"
fi
echo ""

# Vérifier Prisma
echo "🗄️  Vérification de Prisma..."
if [ -f "unipath-api/prisma/schema.prisma" ]; then
  success "Schéma Prisma trouvé"
  
  if [ -d "unipath-api/node_modules/.prisma" ]; then
    success "Client Prisma généré"
  else
    warning "Client Prisma non généré (exécuter: cd unipath-api && npx prisma generate)"
  fi
else
  error "Schéma Prisma manquant"
fi
echo ""

# Vérifier Git
echo "🔀 Vérification de Git..."
if [ -d ".git" ]; then
  success "Dépôt Git initialisé"
  
  # Vérifier les fichiers non trackés sensibles
  if git ls-files --others --exclude-standard | grep -q "\.env$"; then
    error "Fichiers .env détectés dans les fichiers non trackés (vérifier .gitignore)"
  else
    success "Aucun fichier .env non tracké"
  fi
else
  warning "Pas de dépôt Git (exécuter: git init)"
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Tout est OK !${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s), $WARNINGS avertissement(s)${NC}"
  exit 1
fi
