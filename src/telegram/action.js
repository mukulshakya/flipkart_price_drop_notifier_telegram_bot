module.exports = (bot, db) => {
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
      let caption = `*Title: *${subscription.title}\n\n*Current Price: *₹${subscription.currentPrice}\n\n*Availability: *${subscription.availability}\n\n*Url: *${subscription.url}\n\n*Price Histories: *\n\n`;
      subscription.priceHistories.forEach((item) => {
        caption += `₹${item.price} @ ${new Date(
          item.datetime
        ).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n`;
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
};
