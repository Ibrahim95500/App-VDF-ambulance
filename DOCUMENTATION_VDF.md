<div align="center">
  <img src="public/logo.png" alt="VDF Ambulance Logo" width="200"/>
  <h1>Documentation Officielle - Écosystème VDF</h1>
  <p><i>Version 1.0 - Confidentiel & Interne</i></p>
</div>

---

## 📅 Sommaire
1. [Introduction](#1-introduction)
2. [L'Agent Sniper AMC (Scraping Bot Telegram)](#2-lagent-sniper-amc-bot-telegram)
3. [L'Application VDF Ambulance (Tableau de Bord)](#3-lapplication-vdf-ambulance)
4. [Maintenance et Logs](#4-maintenance-et-logs)

---

## 1. Introduction
Bienvenue dans la documentation officielle de l'écosystème numérique **VDF Ambulance**. Ce document a pour but de vous guider dans l'utilisation de nos processus automatisés conçus pour gagner en rentabilité et fluidifier la gestion interne : 

1.  **L'Agent Sniper AMC** : Un robot intelligent autonome chargé de capturer les meilleures courses sur la plateforme Atout Majeur Concept.
2.  **L'Application VDF** : Le logiciel web de gestion central (Ressources Humaines, Demandes d'Acomptes, Supervision du Bot).

---

## 2. L'Agent Sniper AMC (Bot Telegram)

### 2.1. Qu'est-ce que le Sniper ?
C'est un robot d'automatisation d'interface (RPA) qui surveille le tableau de bord de régulation PRT (Atout Majeur Concept) en temps réel, 24/7. Son rôle est d'analyser chaque nouvelle mission et d'accepter immédiatement celles qui sont rentables (selon un filtre géographique strict), avant même que d'autres entreprises concurrentes ne réagissent.

### 2.2. Le Contrôle à distance (Telegram)
Le pilotage du Sniper s'effectue intégralement et discrètement depuis votre téléphone, via Telegram (compte sécurisé). Un pavé de 6 commandes tactiles est à la disposition du régulateur :

*   ▶️ **Démarrer** : Lance la surveillance active. Le robot se connecte au PRT et lit la page.
*   ⏸️ **Pause** : Met temporairement le robot en sommeil sans le déconnecter. Idéal si le régulateur humain souhaite cliquer manuellement sans que le robot n'interfère avec sa session.
*   🔌 **Déconnexion** : Force le robot à purger sa session Web et fermer l'onglet par sécurité.
*   📸 **Capture d'écran** : Demande au robot d'envoyer un instantané photo récent de ce qu'il "voit".

### 2.3. Les Modes de Capture
*   ✅ **Mode: AVEC Villes (Recommandé)** : Le filtre chirurgical est activé. Le robot cherche en priorité un départ sur Gonesse (ou secteur 95500), et vérifie que le code postal d'arrivée fait bien partie de la liste interne restreinte (Les codes VIP : 95500, 95400, 75012, etc.).
*   ⚠️ **Mode: TOUT PRENDRE (Agressif)** : Les filtres géographiques sont ignorés. Le robot ciblera toutes les demandes disponibles, peu importe le trajet. À utiliser en période de faible flux.

### 2.4. Actions Manuelles & Assistées
Si le robot détecte une proposition de course mais qu'elle ne respecte pas les critères VIP, il choisira de l'ignorer. Cependant, afin de faciliter la régulation humaine, il prendra secrètement la course en photo et vous l'enverra sur Telegram, assortie d'un bouton rouge : **"✅ Accepter MANUELLEMENT"**.  
Vous conservez un droit de veto direct : un simple clic sur ce bouton Telegram ordonnera au robot d'aller forcer l'acceptation de cette course spécifique !

---

## 3. L'Application VDF Ambulance

### 3.1. Présentation
Le portail d'entreprise VDF est la plaque tournante interne. Construite de façon sécurisée, elle compartimente les données selon des niveaux d'authentification stricts (Salariés vs. Direction).

### 3.2. Rôles et Accès
*   **Rôle Administratif / RH** : Accès total aux validations d'acomptes, intégration/modification de nouveaux salariés, visualisation sans restriction des tableaux de bord financiers.
*   **Rôle Régulateur** : Accès centré sur le suivi "Live" du Sniper AMC et sur l'affectation du planning journalier des ambulanciers.
*   **Rôle Salarié / Chauffeur** : Interface épurée permettant de soumettre des tickets personnels (demandes d'acomptes, signalements) et de consulter ses propres historiques.

### 3.3. Module: Suivi du Sniper (Live)
Ce module consigne l'historique chirurgical des actions du robot :
*   Enregistrement des courses "Valitées avec succès".
*   Informations structurées (Demandeur, Patient, Numéro de Course, Dates).
*   Visualisation directe de la Capture d'écran "Preuve de validation" sans avoir à chercher dans les mails.

### 3.4. Module: RH & Acomptes
Digitalisation complète de la demande d'acompte :
1. Le salarié remplit une demande depuis son espace.
2. Le RH reçoit l'alerte sur le tableau de bord RH.
3. Un simple bouton permet d'Accepter ou de Rejeter la demande, l'historique et le solde du mois étant calculés et archivés instantanément pour faciliter la comptabilité.

---

## 4. Maintenance et Logs

### 4.1. Vérification des Alertes (VPS)
Le système Sniper est monitoré par l'outil `PM2` sur le serveur sécurisé.
L'administrateur peut remonter dans le temps pour consulter l'historique brut des boucles du robot via la commande serveur :
\`\`\`bash
pm2 logs amc-spy-bot --lines 1000
\`\`\`

### 4.2. Mises à jour Continues
Toute nouvelle demande d'intégration est testée puis déployée instantanément sur le serveur de production sans interruption de service pour l'application Web.
L'agent d'écoute Telegram est relancé automatiquement à chaque déploiement. Pour forcer l'affichage du menu clavier sur le téléphone des gérants, tapez simplement `/start` dans la conversation Telegram avec le bot.
