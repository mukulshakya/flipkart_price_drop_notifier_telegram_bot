require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
const db = require("./src/db");

// EXPRESS SERVER
const app = express();
const port = process.env.PORT || 5000;
app.get("/", (req, res) =>
  res.status(200).json({
    message: `Server up on ${port}`,
  })
);
app.listen(port, () => console.log(`Server up on ${port}`));

// BOT SERVER LISTENER
bot
  .launch()
  .then(() => console.log("BOT Started Successfully!"))
  .catch((e) => console.log("BOT Start Failed:", e));

// INITIALIZE BOT ACTIONS
require("./src/telegram")(bot, db);

// START CRON JOB
require("./src/utilities/notifier")(bot, db);
