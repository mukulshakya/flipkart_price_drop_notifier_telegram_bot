const { Markup } = require("telegraf");
const flipkartScrapper = require("../utilities/flipkartScrapper");

module.exports = (bot, db) => {
  bot.on("message", async (ctx) => {
    try {
      let url = ctx.message.text.match(
        /http(s)?:\/\/((w){3}|(dl))?[.]?flipkart.com\/.{20,}/i
      );
      if (!url)
        return ctx.replyWithHTML(
          "Link does't seem to be a valid one!! Please try again."
        );

      url = url[0];

      const { message_id } = await ctx.reply("Please wait fetching details.");

      const previousTrackingCount = await db.Subscription.find({
        username: ctx.message.chat.username,
        chatId: ctx.message.chat.id,
      }).countDocuments();
      if (previousTrackingCount >= 5)
        return await ctx.reply(
          `You can only have upto 5 trackings set up. Delete previous to add new.`
        );

      const {
        title,
        pricing,
        imageUrl,
        webUrl,
        availability,
      } = await flipkartScrapper(url);
      const imageUrlFixed = imageUrl
        .split("?")[0]
        .replace("{@width}", "200")
        .replace("{@height}", "200");

      await ctx.deleteMessage(message_id);

      await ctx.replyWithPhoto(imageUrlFixed, {
        caption: `*Title: *${title}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${webUrl}`,
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
        subscription.availability = availability;
        await subscription.save();
      } else
        subscription = await db.Subscription.create({
          title,
          availability,
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
};
