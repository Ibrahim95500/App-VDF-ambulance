module.exports = {
  apps: [
    {
      name: "amc-spy-bot",
      script: "node_modules/.bin/tsx",
      args: "src/scripts/amc-agent/index.ts",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Relance si la mémoire dépasse 1Go (Puppeteer peut être gourmand)
      error_file: "logs/amc-bot-error.log",
      out_file: "logs/amc-bot-out.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        // Identifiants forcés ici !
        AMC_USERNAME: "VDF",
        AMC_PASSWORD: "Jordan95500!",
        // À remplacer très important pour recevoir les alertes :
        // TELEGRAM_BOT_TOKEN: "Remplacer_Par_Le_Vrai_Token",
        // TELEGRAM_CHAT_ID: "Remplacer_Par_Le_Vrai_Chat_ID"
      }
    }
  ]
};
