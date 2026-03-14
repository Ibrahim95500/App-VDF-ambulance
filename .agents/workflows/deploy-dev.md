---
description: Procédure de déploiement Docker sur le serveur DEV Hostinger (srv1437657)
---

# 🚧 Workflow de Déploiement VDF (ENVIRONNEMENT DEV)

> [!IMPORTANT]
> Ce workflow est réservé à l'environnement de **DÉVELOPPEMENT**. 
> Environnement : srv1437657 
> Branche : `develop`

## Procédure à suivre par l'agent :

1. **Vérification Git locale**
   ```bash
   git status
   git push origin develop
   ```

2. **Déploiement Distant (DEV)**
   Indiquer à l'utilisateur d'exécuter ces commandes sur le serveur srv1437657 :
   
   // turbo
   ```bash
   ssh root@srv1437657 "cd /var/www/vdf-ambulance && git pull origin develop && docker compose -f docker-compose.dev.yml up -d --build app-dev && docker exec vdf-app-dev npx prisma db push"
   ```

## Points de Capitalisation DEV
- **Répertoire de travail DEV** : `/var/www/vdf-ambulance`
- **Méthode** : Git pull + Docker Build sur le service `app-dev`.
- **Isolation** : Toujours utiliser le fichier `-f docker-compose.dev.yml` pour ne pas impacter la production.
