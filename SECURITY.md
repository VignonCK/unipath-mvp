# Politique de Sécurité

## 🔒 Versions Supportées

| Version | Support         |
| ------- | --------------- |
| 1.0.x   | ✅ Supportée    |
| < 1.0   | ❌ Non supportée |

## 🚨 Signaler une Vulnérabilité

Si vous découvrez une vulnérabilité de sécurité, **ne créez pas d'issue publique**.

### Procédure

1. Envoyer un email à **harrydedji@gmail.com** avec :
   - Description détaillée de la vulnérabilité
   - Étapes pour la reproduire
   - Impact potentiel
   - Suggestions de correction (si possible)

2. Vous recevrez une réponse sous **48 heures**

3. Nous travaillerons avec vous pour :
   - Confirmer la vulnérabilité
   - Développer un correctif
   - Planifier la publication

4. Une fois corrigée, nous publierons :
   - Un patch de sécurité
   - Un advisory de sécurité
   - Des remerciements (si vous le souhaitez)

## 🛡️ Bonnes Pratiques

### Pour les Contributeurs

- Ne jamais commiter de secrets (`.env`, tokens, clés API)
- Utiliser des mots de passe forts et uniques
- Activer l'authentification à deux facteurs (2FA)
- Valider toutes les entrées utilisateur
- Utiliser HTTPS en production
- Garder les dépendances à jour

### Pour les Utilisateurs

- Changer les mots de passe par défaut
- Ne pas partager vos credentials
- Signaler tout comportement suspect
- Garder votre navigateur à jour

## 🔐 Mesures de Sécurité Actuelles

- ✅ Validation des inputs avec Zod
- ✅ Variables d'environnement pour les secrets
- ✅ CORS configuré
- ✅ Gestion des erreurs sans exposition de stack traces en production
- ⚠️ JWT stockés en localStorage (à améliorer avec httpOnly cookies)
- ⚠️ Pas de rate limiting (à ajouter)
- ⚠️ Pas de CSRF protection (à ajouter)

## 📋 Roadmap Sécurité

- [ ] Implémenter httpOnly cookies pour les tokens
- [ ] Ajouter rate limiting sur les endpoints sensibles
- [ ] Ajouter CSRF protection
- [ ] Implémenter un système de logs d'audit
- [ ] Ajouter des tests de sécurité automatisés
- [ ] Configurer Content Security Policy (CSP)
- [ ] Implémenter la rotation des secrets

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
