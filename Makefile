# Makefile pour UniPath MVP
# Usage: make <command>

.PHONY: help install setup dev start test clean lint format

# Couleurs pour l'affichage
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Afficher l'aide
	@echo "$(BLUE)╔═══════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     UniPath MVP - Commandes Make         ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Installer toutes les dépendances
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	cd unipath-api && npm install
	cd unipath-front && npm install
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

setup: install ## Setup complet du projet (install + config)
	@echo "$(BLUE)🔧 Configuration du projet...$(NC)"
	@if [ ! -f unipath-api/.env ]; then \
		cp unipath-api/.env.example unipath-api/.env; \
		echo "$(GREEN)✅ unipath-api/.env créé$(NC)"; \
	fi
	@if [ ! -f unipath-front/.env.local ]; then \
		cp unipath-front/.env.example unipath-front/.env.local; \
		echo "$(GREEN)✅ unipath-front/.env.local créé$(NC)"; \
	fi
	cd unipath-api && npx prisma generate
	@echo "$(GREEN)✅ Setup terminé !$(NC)"
	@echo "$(YELLOW)⚠️  N'oubliez pas d'éditer les fichiers .env$(NC)"

dev: ## Démarrer le backend ET le frontend en mode dev
	@echo "$(BLUE)🚀 Démarrage en mode développement...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:5173$(NC)"
	@make -j2 dev-api dev-front

dev-api: ## Démarrer uniquement le backend
	@echo "$(BLUE)🔧 Démarrage du backend...$(NC)"
	cd unipath-api && npm start

dev-front: ## Démarrer uniquement le frontend
	@echo "$(BLUE)🎨 Démarrage du frontend...$(NC)"
	cd unipath-front && npm run dev

start: dev ## Alias pour 'make dev'

test: ## Exécuter tous les tests
	@echo "$(BLUE)🧪 Exécution des tests...$(NC)"
	cd unipath-api && npm test
	@echo "$(GREEN)✅ Tests terminés$(NC)"

test-api: ## Tester uniquement le backend
	@echo "$(BLUE)🧪 Tests backend...$(NC)"
	cd unipath-api && npm test

test-watch: ## Tests backend en mode watch
	@echo "$(BLUE)🧪 Tests backend (watch mode)...$(NC)"
	cd unipath-api && npm run test:watch

lint: ## Linter le code
	@echo "$(BLUE)🔍 Linting...$(NC)"
	cd unipath-front && npm run lint
	@echo "$(GREEN)✅ Linting terminé$(NC)"

build: ## Build pour production
	@echo "$(BLUE)📦 Build production...$(NC)"
	cd unipath-front && npm run build
	@echo "$(GREEN)✅ Build terminé$(NC)"

prisma-migrate: ## Créer une nouvelle migration Prisma
	@echo "$(BLUE)🗄️  Création de migration...$(NC)"
	cd unipath-api && npx prisma migrate dev

prisma-studio: ## Ouvrir Prisma Studio
	@echo "$(BLUE)🗄️  Ouverture de Prisma Studio...$(NC)"
	cd unipath-api && npx prisma studio

prisma-seed: ## Seed la base de données
	@echo "$(BLUE)🌱 Seeding de la base de données...$(NC)"
	cd unipath-api && npx prisma db seed
	@echo "$(GREEN)✅ Seed terminé$(NC)"

clean: ## Nettoyer les fichiers générés
	@echo "$(BLUE)🧹 Nettoyage...$(NC)"
	rm -rf unipath-api/node_modules
	rm -rf unipath-front/node_modules
	rm -rf unipath-api/dist
	rm -rf unipath-front/dist
	rm -rf unipath-api/coverage
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

health: ## Vérifier la santé du projet
	@echo "$(BLUE)🔍 Vérification de la santé du projet...$(NC)"
	@bash scripts/health-check.sh

logs-api: ## Afficher les logs du backend
	@echo "$(BLUE)📋 Logs backend...$(NC)"
	cd unipath-api && npm start 2>&1 | tee logs/api.log

update: ## Mettre à jour les dépendances
	@echo "$(BLUE)⬆️  Mise à jour des dépendances...$(NC)"
	cd unipath-api && npm update
	cd unipath-front && npm update
	@echo "$(GREEN)✅ Dépendances mises à jour$(NC)"

security-audit: ## Audit de sécurité
	@echo "$(BLUE)🔒 Audit de sécurité...$(NC)"
	cd unipath-api && npm audit
	cd unipath-front && npm audit
	@echo "$(GREEN)✅ Audit terminé$(NC)"

docker-build: ## Build les images Docker (si Docker est configuré)
	@echo "$(BLUE)🐳 Build Docker...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ Build Docker terminé$(NC)"

docker-up: ## Démarrer avec Docker Compose
	@echo "$(BLUE)🐳 Démarrage Docker...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers démarrés$(NC)"

docker-down: ## Arrêter Docker Compose
	@echo "$(BLUE)🐳 Arrêt Docker...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Containers arrêtés$(NC)"

.DEFAULT_GOAL := help
