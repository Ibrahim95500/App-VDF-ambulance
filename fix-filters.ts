import fs from 'fs';
let code = fs.readFileSync('src/scripts/amc-agent/index.ts', 'utf8');

if (!code.includes('let isFilterActive = true;')) {
  code = code.replace(
    'let isBotPaused = false',
    'let isBotPaused = false\nlet isFilterActive = true;'
  );
}

// Telegram buttons
code = code.replace(
    '[{ text: "📸 Capture d\\'écran" }, { text: "🔌 Déconnexion" }]',
    '[{ text: "✅ Mode: AVEC Villes" }, { text: "⚠️ Mode: TOUT PRENDRE" }],\n            [{ text: "📸 Capture d\\'écran" }, { text: "🔌 Déconnexion" }]'
);

// Telegram commands
if (!code.includes("text.includes('AVEC Villes')")) {
  const telegramCmds = `
    if (text.includes('TOUT PRENDRE')) {
        isFilterActive = false;
        bot.sendMessage(chatId, "⚠️ **MODE SANS CONDITION ACTIVÉ !**\n\nLe robot va sniper absolument TOUTES LES COURSES qui apparaissent sur l'écran (sans vérifier Gonesse, Paris, ou Province).\n\nPour réactiver la sécurité, utilise le bouton *✅ Mode: AVEC Villes*.", {parse_mode: 'Markdown'});
        return;
    }
    
    if (text.includes('AVEC Villes')) {
        isFilterActive = true;
        bot.sendMessage(chatId, "✅ **MODE SÉCURISÉ ACTIVÉ !**\n\nLe robot redevient sélectif. Il ne prendra QUE les courses au départ de Gonesse (GHT) vers les villes autorisées (Goussainville, Villiers, etc.)", {parse_mode: 'Markdown'});
        return;
    }
  `;
  code = code.replace(
    "if (text.includes('Capture')) {",
    telegramCmds + "\n    if (text.includes('Capture')) {"
  );
}

// snipeCourse call
code = code.replace(
    'const snipeResult = await snipeCourse(page);',
    'const snipeResult = await snipeCourse(page, isFilterActive);'
);

// snipeCourse definition
code = code.replace(
    'async function snipeCourse(page: any): Promise<{ buffer: Buffer | null, status: string, num?: string, depart?: string, arrivee?: string }> {',
    'async function snipeCourse(page: any, withFilters: boolean = true): Promise<{ buffer: Buffer | null, status: string, num?: string, depart?: string, arrivee?: string }> {'
);

// evaluate definition
code = code.replace(
    'const extraction = await page.evaluate((manualIds: string[], alertedIds: string[]) => {',
    'const extraction = await page.evaluate((manualIds: string[], alertedIds: string[], withFilters: boolean) => {'
);
code = code.replace(
    '}, manualClicksArray, alertedCoursesArray);',
    '}, manualClicksArray, alertedCoursesArray, withFilters);'
);

// VIP logic
code = code.replace(
    'const isVIP = isGonesseDepart && isAllowedArrivee;',
    'const isVIP = withFilters ? (isGonesseDepart && isAllowedArrivee) : true;'
);

fs.writeFileSync('src/scripts/amc-agent/index.ts', code);
