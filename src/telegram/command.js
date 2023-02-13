module.exports = (bot, db) => {
  //  /start
  bot.start((ctx) =>
    ctx.replyWithHTML(
      `<b>Hi! Welcome to Online Price Tracker</b>

     Send Link to Start Tracking
    `
    )
  );
  //  /help
  bot.help((ctx) =>
    ctx.replyWithHTML(
      `<b>Hi! Welcome to Online Price Tracker</b>

     Send Link to Start Tracking
    `
    )
  );
  //  /list_alerts
  bot.command("list_alerts", async (ctx) => {
    try {
      ctx.reply("Listing All Your Set Alerts.");

      const user = await db.User.findOne({
        chatId: ctx.message.chat.id,
        username: ctx.message.chat.username,
      }).populate("subscriptions");

      const subscriptions = user && Array.isArray(user.subscriptions) ? user.subscriptions : [];
      for (const subscription of subscriptions) {
        await ctx.telegram.sendPhoto(ctx.message.chat.id, subscription.imageUrl, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Delete Alert?",
                  callback_data: `delete_alert_${subscription._id}:${user._id}`,
                  hide: false,
                },
              ],
              [
                {
                  text: "View Price History?",
                  callback_data: `pricehistory_${subscription._id}:${user._id}`,
                  hide: false,
                },
              ],
            ],
          },
          caption: `*Title: *${subscription.title}\n\n*Lowest Price: *₹${subscription.lowestPrice}\n\n*Highest Price: *₹${subscription.highestPrice}\n\n*Current Price: *₹${subscription.currentPrice}\n\n*Availability: *${subscription.availability}\n\n*Url: *${subscription.url}`,
        });
      }
      return subscriptions.length
        ? null
        : ctx.reply("You don't have any alert set, Paste link to start tracking.", {
            parse_mode: "Markdown",
          });
    } catch (e) {
      // console.log(e);
      return ctx.reply("Some unexpected error occurred! Please try again.");
    }
  });
  //  /delete_all_alerts
  bot.command("delete_all_alerts", async (ctx) => {
    try {
      ctx.reply("Deleting All Your Set Alerts.");

      const user = await db.User.findOne({
        chatId: ctx.message.chat.id,
        username: ctx.message.chat.username,
      });
      const subscriptions = user && Array.isArray(user.subscriptions) ? [...user.subscriptions] : [];
      user.subscriptions = [];
      await user.save();

      // Delete subscription if only one user have it.
      // for (const subId of subscriptions) {
      //   const otherUserCount = await db.User.find({ subscriptions: subId }).countDocuments();
      //   if (otherUserCount === 0) await db.Subscription.findByIdAndDelete(subId);
      // }

      return ctx.reply(
        subscriptions.length
          ? `${subscriptions.length} tracking(s) successfully removed.`
          : "You don't have any alert set, Paste link to start tracking.",
        { parse_mode: "Markdown" }
      );
    } catch (e) {
      // console.log(e);
      return ctx.reply("Some unexpected error occurred! Please try again.");
    }
  });
};
