require("dotenv").config();

const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");
const Agenda = require("agenda");

const db = require("./src/db");
const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
const env = process.env.NODE_ENV || "local";
let botOptions = {};
if (env === "production") {
  botOptions = {
    webhook: {
      domain: process.env.CYCLIC_URL,
      port: process.env.PORT || 3000,
      secretToken: process.env.SECRET,
    },
  };
}

// INITIALIZE JOB QUEUE AFTER MONGOOSE CONNECTION
mongoose.connection.on("connected", async () => {
  console.log("mongo connection open");
  try {
    // BOT SERVER LISTENER
    await bot.launch(botOptions);
    console.log("BOT Started Successfully!");
    // INITIALIZE BOT ACTIONS
    require("./src/telegram")(bot, db);

    // set scheduled false when server restarts
    await db.Subscription.updateMany({}, { $set: { scheduled: false } });

    const agenda = new Agenda({
      db: { address: process.env.MONGODB_URI, options: { useNewUrlParser: true } },
    });
    agenda.on("ready", () => {
      require("./src/agenda")(agenda, bot, db);
    });
  } catch (e) {
    console.log("BOT Start Failed:", e);
  }
});
