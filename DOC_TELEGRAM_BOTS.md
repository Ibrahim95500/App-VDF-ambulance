<div align="center">
  <img src="public/logo.png" alt="VDF Ambulance Logo" width="150"/>
  <h1>Manuel d'Utilisation - Le Cerveau AMC (Bot Telegram)</h1>
</div>

---

## 🤖 1. Le Rôle du Robot AMC
Le "Sniper" est votre régulateur automatisé de remplacement. Il a été programmé pour lire le logiciel Atout Majeur Concept à la vitesse de la lumière (en moyenne une analyse complète prend 0,1 seconde) de façon ininterrompue. Il garantit que VDF Ambulance aura toujours une réactivité maximale sur les nouvelles offres.

## 📱 2. Le Pilotage Tactile par Telegram
Ce robot est télécommandé via une application invisible pour vos concurrents : l'outil sécurisé Telegram. Il ne répond qu'aux identifiants intégrés par VDF. 
En tapant la commande **/start**, un clavier tactile apparaît sur votre écran. 

### Que font les 6 Boutons ?
*   ▶️ **Démarrer** : Le bouton de mise à feu. Le robot charge sa page web et entre en mode chasse.
*   ⏸️ **Pause** : Vous devez reprendre la main manuellement sur la plateforme pour une action spécifique ? Pesez sur Pause, le robot figera ses recherches pour ne pas rafraîchir la page sous vos yeux. Relancez-le aves *Démarrer*.
*   ✅ **Mode: AVEC Villes** : C'est le comportement "Smart" du robot par défaut. Il s'assure obligatoirement que la course parte du secteur habilité (Gonesse/95500) ET que l'arrivée est validée contre votre fichier de "Codes Postaux VIP" (les 17 destinations). Toute autre course sera mise de côté.
*   ⚠️ **Mode: TOUT PRENDRE** : Le comportement "Aggressif". Tous les tris géographiques sont désactivés. Dès qu'une coche verte apparaît à l'écran, le robot la clique (réservé aux urgences ou aux plannings vides).
*   📸 **Capture d'écran** : Vous doutez du statut du robot ? Cliquez ici et il vous enverra instantanément une photo de son écran pour que vous puissiez voir ce qu'il a devant les yeux.
*   🔌 **Déconnexion** : Un bouton de sécurité (killswitch) utilisé pour fermer totalement la session côté serveur en 1 seconde.

## 🔥 3. Le Super Pouvoir : L'Alerte Interactive
Dans son mode "Avec Villes", si une course apparaît mais ne va pas vers le bon code postal (exemple: Trajet vers la province), le robot va l'ignorer pour respecter ses consignes. 

**Mais il a été conçu pour être collaboratif :**
Plutôt que de la rater sans rien dire, il va isoler cette course, vous prendre une belle photo des adresses, et sonnera sur votre téléphone via Telegram. 
Sur la photo apparaîtra un bouton temporaire : **"✅ Accepter MANUELLEMENT"**. 
Si vous concluez que *malgré la destination lointaine* cette course est bonne à prendre, cliquez depuis votre canapé. Le robot se connectera et l'arrachera au nez de la concurrence.

## 🛠 4. Résolution de petits bugs
*   Si le clavier Telegram n'apparaît plus, envoyez le texte `/start` au bot.
*   Si un message d'erreur rouge apparaît sur le VPS du type `502 Bad Gateway Telegram`, **ignorez-le totalement**. Ce n'est qu'une micro-panne mondiale de 3 secondes du serveur de messagerie Telegram, cela n'affecte en rien le logiciel AMC caché derrière. 
