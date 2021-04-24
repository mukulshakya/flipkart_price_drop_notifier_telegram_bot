const { Telegraf } = require("telegraf");
require("dotenv");
const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
const db = require("./src/db");

// BOT SERVER LISTENER
bot
  .launch()
  .then(() => console.log("BOT Started Successfully!"))
  .catch((e) => console.log("BOT Start Failed:", e));

// INITIALIZE BOT ACTIONS
require("./src/telegram")(bot, db);

// START CRON JOB
require("./src/utilities/notifier")(bot, db);
