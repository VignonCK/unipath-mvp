#!/bin/bash

# Script de setup automatique du projet UniPath
# Usage: ./scripts/setup.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     🚀 Setup UniPath MVP                  ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Fonction pour afficher les étapes
step() {
  echo -e "\n${BLUE}▶ $1${NC}"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier Node.js
step "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
  error "Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
fi
NODE_VERSION=$(node -v)
success "Node.js $NODE_VERSION détecté"

# Vérifier npm
step "Vérification de npm..."
if ! command -v npm &> /dev/null; then
  error "npm n'est pas installé"
fi
NPM_VERSION=$(npm -v)
success "npm $NPM_VERSION détecté"

# Installation des dépendances backend
step "Installation des dépendances backend..."
cd unipath-api
if [ -f "package.json" ]; then
  npm install
  success "Dépendances backend installées"
else
  error "package.json introuvable dans unipath-api/"
fi
cd ..

# Installation des dépendances frontend
step "Installation des dépendances frontend..."
cd unipath-front
if [ -f "package.json" ]; then
  npm install
  success "Dépendances frontend installées"
else
  error "package.json introuvable dans unipath-front/"
fi
cd ..

# Configuration des fichiers .env
step "Configuration des fichiers .env..."

# Backend .env
if [ ! -f "unipath-api/.env" ]; then
  if [ -f "unipath-api/.env.example" ]; then
    cp unipath-api/.env.example unipath-api/.env
    success "Fichier unipath-api/.env créé depuis .env.example"
    warning "⚠️  Vous devez éditer unipath-api/.env avec vos vraies valeurs"
  else
    error ".env.example introuvable dans unipath-api/"
  fi
else
  success "unipath-api/.env existe déjà"
fi

# Frontend .env.local
if [ ! -f "unipath-front/.env.local" ]; then
  if [ -f "unipath-front/.env.example" ]; then
    cp unipath-front/.env.example unipath-front/.env.local
    success "Fichier unipath-front/.env.local créé depuis .env.example"
  else
    warning ".env.example introuvable dans unipath-front/ (optionnel)"
  fi
else
  success "unipath-front/.env.local existe déjà"
fi

# Génération du client Prisma
step "Génération du client Prisma..."
cd unipath-api
if [ -f "prisma/schema.prisma" ]; then
  npx prisma generate
  success "Client Prisma généré"
else
  error "prisma/schema.prisma introuvable"
fi
cd ..

# Vérifier la connexion à la base de données
step "Vérification de la connexion à la base de données..."
cd unipath-api
if npx prisma db pull --force 2>/dev/null; then
  success "Connexion à la base de données OK"
else
  warning "Impossible de se connecter à la base de données"
  warning "Vérifiez DATABASE_URL dans unipath-api/.env"
fi
cd ..

# Résumé
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║     ✅ Setup terminé avec succès !        ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${BLUE}📋 Prochaines étapes :${NC}\n"
echo "1. Éditer les fichiers .env avec vos vraies valeurs :"
echo -e "   ${YELLOW}unipath-api/.env${NC}"
echo -e "   ${YELLOW}unipath-front/.env.local${NC}"
echo ""
echo "2. Exécuter les migrations Prisma :"
echo -e "   ${YELLOW}cd unipath-api && npx prisma migrate dev${NC}"
echo ""
echo "3. (Optionnel) Seed la base de données :"
echo -e "   ${YELLOW}cd unipath-api && npx prisma db seed${NC}"
echo ""
echo "4. Démarrer le backend :"
echo -e "   ${YELLOW}cd unipath-api && npm start${NC}"
echo ""
echo "5. Démarrer le frontend (dans un autre terminal) :"
echo -e "   ${YELLOW}cd unipath-front && npm run dev${NC}"
echo ""
echo -e "${GREEN}🎉 Bon développement !${NC}\n"
