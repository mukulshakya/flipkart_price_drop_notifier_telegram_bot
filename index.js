require("dotenv").config();

const { Telegraf } = require("telegraf");
const Redis = require("ioredis");
const mongoose = require("mongoose");
const Bull = require("bull");

const db = require("./src/db");
const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());

// CREATE QUEUE
const subscriptionQueue = new Bull("subscriptionQueue", {
  limiter: { max: 50, duration: 1000 },
});

// REDIS CONNECTION FOR `BULL` JOB QUEUE TO WORK
const redis = new Redis();
redis.on("connect", () => {
  console.log("redis connected");
});

// BOT SERVER LISTENER
bot
  .launch()
  .then(() => console.log("BOT Started Successfully!"))
  .catch((e) => console.log("BOT Start Failed:", e));

// INITIALIZE JOB QUEUE AFTER MONGOOSE CONNECTION
mongoose.connection.once("open", async () => {
  console.log("mongoose connection open");

  // INITIALIZE QUEUE ACTIONS
  await require("./src/utilities/queue/jobQueue")(queue, bot, db);

  // INITIALIZE BOT ACTIONS
  require("./src/telegram")(bot, db);
});
