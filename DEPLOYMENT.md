# Guide de Déploiement

Ce guide explique comment déployer UniPath en production.

---

## 🎯 Options de Déploiement

### Option 1 : Docker Compose (Recommandé pour VPS)
### Option 2 : Services Cloud Séparés (Render + Vercel)
### Option 3 : Kubernetes (Pour grande échelle)

---

## 🐳 Option 1 : Docker Compose

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Serveur avec minimum 2GB RAM

### Étapes

1. **Cloner le projet sur le serveur**

```bash
git clone https://github.com/votre-org/unipath-mvp.git
cd unipath-mvp
```

2. **Configurer les variables d'environnement**

```bash
# Backend
cp unipath-api/.env.example unipath-api/.env
nano unipath-api/.env  # Éditer avec vos valeurs

# Frontend (optionnel, défini dans docker-compose.yml)
```

3. **Build et démarrer les containers**

```bash
docker-compose up -d --build
```

4. **Exécuter les migrations**

```bash
docker-compose exec api npx prisma migrate deploy
```

5. **Vérifier le statut**

```bash
docker-compose ps
docker-compose logs -f
```

6. **Accéder à l'application**

- Frontend : `http://votre-serveur`
- API : `http://votre-serveur:3001`
- Health check : `http://votre-serveur:3001/health`

### Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f api
docker-compose logs -f frontend

# Redémarrer un service
docker-compose restart api

# Arrêter tout
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Mettre à jour
git pull
docker-compose up -d --build
```

---

## ☁️ Option 2 : Services Cloud Séparés

### Backend sur Render

1. **Créer un compte sur [Render](https://render.com)**

2. **Créer un service PostgreSQL**
   - New → PostgreSQL
   - Nom : `unipath-db`
   - Plan : Free ou Starter
   - Copier l'URL de connexion (Internal Database URL)

3. **Créer un Web Service**
   - New → Web Service
   - Connecter votre repo GitHub
   - Settings :
     - **Name** : `unipath-api`
     - **Root Directory** : `unipath-api`
     - **Environment** : `Node`
     - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
     - **Start Command** : `npm start`
     - **Plan** : Free ou Starter

4. **Configurer les variables d'environnement**

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<URL_depuis_PostgreSQL_Render>
SUPABASE_URL=<votre_url>
SUPABASE_ANON_KEY=<votre_key>
SUPABASE_SERVICE_KEY=<votre_key>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<votre_email>
EMAIL_PASS=<votre_app_password>
EMAIL_FROM=<votre_email>
```

5. **Déployer**
   - Render déploie automatiquement
   - Vérifier : `https://unipath-api.onrender.com/health`

### Frontend sur Vercel

1. **Créer un compte sur [Vercel](https://vercel.com)**

2. **Importer le projet**
   - New Project → Import Git Repository
   - Sélectionner votre repo

3. **Configurer le projet**
   - **Framework Preset** : Vite
   - **Root Directory** : `unipath-front`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

4. **Configurer les variables d'environnement**

```env
VITE_API_URL=https://unipath-api.onrender.com/api
```

5. **Déployer**
   - Vercel déploie automatiquement
   - Accéder : `https://unipath-mvp.vercel.app`

### Déploiements Automatiques

Les deux services se redéploient automatiquement à chaque push sur `main`.

---

## 🚢 Option 3 : Kubernetes

### Prérequis

- Cluster Kubernetes
- kubectl configuré
- Helm 3+ (optionnel)

### Fichiers de Configuration

Créer les fichiers suivants dans `k8s/` :

#### `k8s/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: unipath
```

#### `k8s/postgres.yaml`

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: unipath
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: unipath
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: unipath
        - name: POSTGRES_USER
          value: unipath
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: unipath
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

#### `k8s/api.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: unipath
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/unipath-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secret
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: unipath
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Déploiement

```bash
# Créer le namespace
kubectl apply -f k8s/namespace.yaml

# Créer les secrets
kubectl create secret generic postgres-secret \
  --from-literal=password=your_password \
  -n unipath

kubectl create secret generic api-secret \
  --from-literal=database-url=postgresql://... \
  -n unipath

# Déployer
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api.yaml

# Vérifier
kubectl get pods -n unipath
kubectl logs -f deployment/api -n unipath
```

---

## 🔒 Sécurité en Production

### Checklist

- [ ] Utiliser HTTPS (Let's Encrypt, Cloudflare)
- [ ] Configurer les CORS strictement
- [ ] Activer rate limiting
- [ ] Utiliser des secrets forts et uniques
- [ ] Activer les logs d'audit
- [ ] Configurer les backups automatiques
- [ ] Mettre en place un monitoring (Sentry, Datadog)
- [ ] Configurer les alertes
- [ ] Utiliser httpOnly cookies pour JWT
- [ ] Activer CSRF protection

### Variables d'Environnement Sensibles

Ne jamais exposer :
- `DATABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `EMAIL_PASS`
- Clés API tierces

---

## 📊 Monitoring

### Health Checks

- API : `GET /health`
- Frontend : `GET /` (doit retourner 200)

### Logs

**Docker :**
```bash
docker-compose logs -f api
```

**Render :**
- Dashboard → Logs

**Kubernetes :**
```bash
kubectl logs -f deployment/api -n unipath
```

### Métriques

Intégrer :
- **Sentry** pour le tracking d'erreurs
- **Datadog** ou **New Relic** pour les métriques
- **Uptime Robot** pour le monitoring uptime

---

## 🔄 Mises à Jour

### Docker Compose

```bash
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
```

### Render

- Push sur `main` → Déploiement automatique
- Ou : Dashboard → Manual Deploy

### Vercel

- Push sur `main` → Déploiement automatique
- Ou : Dashboard → Redeploy

---

## 🆘 Dépannage

### L'API ne démarre pas

1. Vérifier les logs : `docker-compose logs api`
2. Vérifier `DATABASE_URL`
3. Vérifier que PostgreSQL est accessible
4. Exécuter les migrations : `npx prisma migrate deploy`

### Erreur de connexion à la base

1. Tester la connexion : `npx prisma db pull`
2. Vérifier les credentials
3. Vérifier que le port 5432 est ouvert

### Frontend ne se connecte pas à l'API

1. Vérifier `VITE_API_URL`
2. Vérifier les CORS dans `unipath-api/src/app.js`
3. Vérifier que l'API est accessible

### Erreurs 502 Bad Gateway

1. Vérifier que l'API est démarrée
2. Vérifier les health checks
3. Augmenter les timeouts

---

## 📞 Support

Pour aide au déploiement : harrydedji@gmail.com
