---
description: Diagnostic et résolution d'une "Client-Side Exception" (Page Blanche) sur changement de contexte RH/Salarié
---

Tu es un ingénieur Fullstack senior expert en Next.js, React et architectures mobiles hybrides. Je rencontre une erreur critique (page blanche avec message 'client-side exception') sur mon application dev.vdf-ambulance.fr.

Le problème :
L'erreur survient principalement à l'ouverture de l'application et lors de la navigation via la bottombar, spécifiquement lors du basculement entre le compartiment 'Salarié' et le compartiment 'RH'.

Ta mission :

### 1. Analyse de recherche (Web Study)
Analyse les causes fréquentes de crash client-side lors de switchs de contextes lourds dans Next.js (fuites de mémoire, hooks mal nettoyés, désynchronisation du state de navigation).

### 2. Audit de la BottomBar
Propose une méthode pour vérifier si le crash vient d'un conflit de Z-index, d'un rendu conditionnel qui tente d'accéder à des données non encore chargées, ou d'une boucle infinie de redirection.

### 3. Solution technique
Propose une implémentation de 'Error Boundaries' (Périmètres de sécurité) pour éviter que toute l'application ne devienne blanche si un seul onglet plante.

### 4. Optimisation de l'expérience utilisateur (UX)
- Propose une astuce d'Animation de Transition (ex: avec Framer Motion) pour masquer le temps de chargement/basculement entre le mode Salarié et RH.
- Suggère une méthode pour persister le state afin que le passage d'un groupe d'onglets à l'autre ne déclenche pas un re-montage (remount) complet des composants.

### 5. Debug Actionable
Donne-moi les étapes précises pour inspecter la console du navigateur mobile afin d'extraire la stacktrace exacte de l'erreur.

---

### Pistes Immédiates (Capitalisation)

1. **Hydration Mismatch** : Si Next.js essaie d'afficher le mode RH alors que le mobile est encore sur Salarié. 
   - *Solution* : Utiliser un `useEffect` avec un état `isMounted` pour ne rendre le switch qu'une fois le composant monté côté client.
2. **View Stack (Anti-Crash)** : Ne pas supprimer brusquement un composant. Garder les deux vues (RH/Salarié) dans le DOM et jouer sur le `display: none` ou l'opacité.
3. **Variables de Session** : Vérifier si `user.rh_data` est lu alors que `user` est momentanément null pendant la transition.
4. **Chrome Inspect** : Utiliser `chrome://inspect/#devices` (Android) ou le menu Safari (iOS) pour lire la console mobile en temps réel.
