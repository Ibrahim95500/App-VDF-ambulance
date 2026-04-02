---
description: Comment ajouter un nouveau collaborateur au Sniper Telegram Automatique (BotPRTScrap)
---
# Procédure d'Ajout d'un Utilisateur Telegram (Sniper AMC)

Ce workflow vous permet d'ajouter un nouveau collègue au système d'alerte Telegram pour qu'il reçoive les missions d'ambulances snipées en temps réel.

## 1. Récupération du Chat ID Telegram
Demandez au nouveau collègue de chercher le bot **@PRTScrapBOT** (ou le nom actuel de votre bot) sur son application Telegram et de lui envoyer le message `Salut` ou `/start`.
Le bot vient d'être mis à jour avec la fonction "Radar". Il va automatiquement répondre au collaborateur en lui donnant son ID Secret à 9 ou 10 chiffres. (ex: `123456789`).

## 2. Ajout de l'ID dans le code
Une fois que le collaborateur vous a transmis son numéro `ID`, vous devez l'ajouter dans la mémoire du programme.

// turbo
3. Ouvrir le fichier "amc-agent" pour le modifier.
   * Modifiez le fichier `src/scripts/amc-agent/index.ts`
   * Localisez la ligne `const TELEGRAM_CHAT_IDS = ["1634444351", "...", ...]` (autour de la ligne 17).
   * Ajoutez le nouveau numéro, par exemple `"123456789"`, entre guillemets, à l'intérieur du crochet `[]`.

## 4. Déploiement sur le Serveur VPS Hostinger
Une fois le numéro ajouté dans le code local, lancez ces commandes pour pousser le code et redémarrer le robot en production :

// turbo
5. Pousser le code vers la branche `develop`
```bash
git add src/scripts/amc-agent/index.ts
git commit -m "feat(telegram): ajout d'un nouveau collaborateur à la liste de diffusion du bot"
git push origin develop
```

## 5. Côté VPS (À faire par l'Administrateur)
Connectez-vous à votre machine distante (serveur Ubuntu VPS) et exécutez ces commandes :
```bash
cd /var/www/vdf-ambulance
git pull origin develop
pm2 restart amc-spy-bot
pm2 logs amc-spy-bot
```

Et voilà ! Au prochain succès du sniper, les téléphones de tous les membres de la liste sonneront en même temps ! 🕸️
