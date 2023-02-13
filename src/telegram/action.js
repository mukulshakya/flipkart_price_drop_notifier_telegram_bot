module.exports = (bot, db) => {
  bot.action(/delete_alert_.*/, async (ctx) => {
    try {
      const [subId, userId] = ctx.callbackQuery.data.replace("delete_alert_", "").split(":");

      if (!subId || !userId) throw new Error();

      // Delete subscription if only one user have it.
      // const userCount = await db.User.find({ subscriptions: subId }).countDocuments();
      // let subscription;
      // if (userCount === 1) subscription = await db.Subscription.findByIdAndDelete(subId);

      // Remove subscription from the user
      await db.User.findByIdAndUpdate(userId, { $pull: { subscriptions: subId } });
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      await ctx.reply("Alert Deleted!");
      return await ctx.answerCbQuery();
    } catch (e) {
      // console.log(e);
      return ctx.reply("Some unexpected error occurred! Please try again.");
    }
  });

  bot.action(/pricehistory_.*/, async (ctx) => {
    try {
      const [subId, userId] = ctx.callbackQuery.data.replace("pricehistory_", "").split(":");
      const subscription = await db.Subscription.findById(subId);
      let caption = `*Title: *${subscription.title}\n\n*Current Price: *₹${subscription.currentPrice}\n\n*Availability: *${subscription.availability}\n\n*Url: *${subscription.url}\n\n*Price Histories: *\n\n`;
      subscription.priceHistories.reverse().forEach((item) => {
        caption += `₹${item.price} @ ${new Date(item.datetime).toLocaleString("en-IN", {
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
                callback_data: `delete_alert_${subscription._id}:${userId}`,
                hide: false,
              },
            ],
          ],
        },
      });
    } catch (e) {
      // console.log(e);
      return ctx.reply("Some unexpected error occurred! Please try again.");
    }
  });
};
