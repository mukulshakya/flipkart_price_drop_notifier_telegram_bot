const { Telegraf, Markup } = require("telegraf");
require("dotenv");
const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
const db = require("./db");

const flipkartScrapper = require("./flipkartScrapper");
const INVALID_LINK_MSG =
  "Link does't seem to be a valid one!! Please try again.";

// COMMANDS
bot.start((ctx) =>
  ctx.replyWithHTML(
    `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
  )
);
bot.help((ctx) =>
  ctx.replyWithHTML(
    `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
  )
);
bot.command("list_alerts", async (ctx) => {
  try {
    ctx.reply("Listing All Your Set Alerts.");
    const subscriptions = await db.Subscription.find({
      chatId: ctx.message.chat.id,
      username: ctx.message.chat.username,
    });
    for (const subscription of subscriptions) {
      await ctx.telegram.sendPhoto(ctx.message.chat.id, subscription.imageUrl, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Delete Alert?",
                callback_data: "delete_alert_" + subscription._id,
                hide: false,
              },
            ],
            [
              {
                text: "View Price History?",
                callback_data: "pricehistory_" + subscription._id,
                hide: false,
              },
            ],
          ],
        },
        caption: `*Title: *${subscription.title}\n\n*Current Price: *₹${subscription.currentPrice}\n\n*Url: *${subscription.url}`,
      });
    }
    return subscriptions.length
      ? null
      : ctx.reply(
          "You don't have any alert set, Paste link to start tracking.",
          { parse_mode: "Markdown" }
        );
  } catch (e) {
    console.log(e);
    return ctx.reply("Some unexpected error occurred! Please try again.");
  }
});

// GLOBAL MESSAGE HANDLER
bot.on("message", async (ctx) => {
  try {
    const url = ctx.message.text;
    if (!url.match(/^http(s)?:\/\/((w){3}|(dl))?[.]?flipkart.com\/.{20,}/i))
      return ctx.replyWithHTML(INVALID_LINK_MSG);

    const { message_id } = await ctx.reply("Please wait fetching details.");

    const { title, pricing, imageUrl, webUrl } = await flipkartScrapper(url);
    const imageUrlFixed = imageUrl
      .split("?")[0]
      .replace("{@width}", "200")
      .replace("{@height}", "200");

    await ctx.deleteMessage(message_id);

    await ctx.replyWithPhoto(imageUrlFixed, {
      caption: `*Title: *${title}\n\n*Current Price: *₹${pricing}\n\n*Url: *${webUrl}`,
      parse_mode: "Markdown",
    });

    let subscription = await db.Subscription.findOne({
      username: ctx.message.chat.username,
      chatId: ctx.message.chat.id,
      $or: [{ url: webUrl }, { title }, { imageUrl: imageUrlFixed }],
    });
    if (subscription) {
      if (subscription.currentPrice != pricing)
        subscription.priceHistories.push({
          datetime: new Date(),
          price: pricing,
        });
      subscription.currentPrice = pricing;
      await subscription.save();
    } else
      subscription = await db.Subscription.create({
        title,
        imageUrl: imageUrlFixed,
        url: webUrl,
        chatId: ctx.message.chat.id,
        username: ctx.message.chat.username,
        initialPrice: pricing,
        currentPrice: pricing,
        priceHistories: [{ datetime: new Date(), price: pricing }],
      });

    return await ctx.reply(
      `You will be notified when the price drops below <b>₹${pricing}</b>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          Markup.button.callback(
            "Delete Alert?",
            "delete_alert_" + subscription._id
          ),
        ]),
      }
    );
  } catch (e) {
    console.log(e);
    return ctx.reply("Some unexpected error occurred! Please try again.");
  }
});

bot.action(/delete_alert_.*/, async (ctx) => {
  try {
    const id = ctx.callbackQuery.data.replace("delete_alert_", "");
    await db.Subscription.findByIdAndDelete(id);
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    await ctx.reply("Alert Deleted!");
    return await ctx.answerCbQuery();
  } catch (e) {
    console.log(e);
    return ctx.reply("Some unexpected error occurred! Please try again.");
  }
});

bot.action(/pricehistory_.*/, async (ctx) => {
  try {
    const id = ctx.callbackQuery.data.replace("pricehistory_", "");
    const subscription = await db.Subscription.findById(id);
    let caption = `*Title: *${subscription.title}\n\n*Current Price: *₹${subscription.currentPrice}\n\n*Url: *${subscription.url}\n\n*Price Histories: *\n\n`;
    subscription.priceHistories.forEach((item) => {
      caption += `₹${item.price} @ ${new Date(item.datetime).toLocaleString({
        timeZone: "Asia/Kolkata",
      })}\n\n`;
    });
    await ctx.answerCbQuery();
    return await ctx.editMessageCaption(caption, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Delete Alert?",
              callback_data: "delete_alert_" + subscription._id,
              hide: false,
            },
          ],
        ],
      },
    });
  } catch (e) {
    console.log(e);
    return ctx.reply("Some unexpected error occurred! Please try again.");
  }
});

// BOT SERVER LISTENER
bot
  .launch()
  .then(() => console.log("BOT Started Successfully!"))
  .catch((e) => console.log("BOT Start Failed:", e));

// START CRON JOB
require("./notifier")(bot, db);
