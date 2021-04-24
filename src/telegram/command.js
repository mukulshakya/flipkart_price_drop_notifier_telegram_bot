module.exports = (bot, db) => {
  //  /start
  bot.start((ctx) =>
    ctx.replyWithHTML(
      `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
    )
  );
  //  /help
  bot.help((ctx) =>
    ctx.replyWithHTML(
      `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
    )
  );
  //  /list_alerts
  bot.command("list_alerts", async (ctx) => {
    try {
      ctx.reply("Listing All Your Set Alerts.");
      const subscriptions = await db.Subscription.find({
        chatId: ctx.message.chat.id,
        username: ctx.message.chat.username,
      });
      for (const subscription of subscriptions) {
        await ctx.telegram.sendPhoto(
          ctx.message.chat.id,
          subscription.imageUrl,
          {
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
          }
        );
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
};
