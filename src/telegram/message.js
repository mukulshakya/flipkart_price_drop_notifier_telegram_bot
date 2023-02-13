const { Markup } = require("telegraf");
const flipkartScrapper = require("../utilities/flipkartScrapper");

const ALLOWED_LINKS = ["Flipkart"];
const REQUIRED_KEYS = ["title", "pricing", "imageUrl", "webUrl", "availability"];

module.exports = (bot, db) => {
  bot.on("message", async (ctx) => {
    try {
      let url = ctx.message.text.match(/http(s)?:\/\/((w){3}|(dl))?[.]?flipkart.com\/.{20,}/i);
      if (!url)
        return ctx.replyWithHTML(
          `Link doesn't seem to be a valid one!! Please try again.\n\nWe only support links from ${ALLOWED_LINKS.join(
            ", "
          )}`
        );

      const { message_id } = await ctx.reply("Please wait! fetching details.");

      const { username, id: chatId } = ctx.message.chat;

      let user = await db.User.findOne({ username, chatId });
      if (user && user.subscriptions.length >= 5) {
        return await ctx.reply(`You can only have upto 5 trackings set up. Delete previous to add new.`);
      }

      const resp = await flipkartScrapper(url[0]);
      const someKeyMissing = REQUIRED_KEYS.some((key) => resp[key] === null);
      if (someKeyMissing)
        return ctx.reply("Link doesn't seem to be a valid one! Please provide the product page url only.");
      const { title, pricing, imageUrl, webUrl, availability } = resp;
      const imageUrlFixed = imageUrl.split("?")[0].replace("{@width}", "200").replace("{@height}", "200");

      console.log(1);

      let subscription = await db.Subscription.findOne({
        $or: [{ url: webUrl }, { title }, { imageUrl: imageUrlFixed }],
      });
      console.log(2);
      if (subscription) {
        console.log(3);
        if (subscription.currentPrice != pricing)
          subscription.priceHistories.push({
            datetime: new Date(),
            price: pricing,
          });
        console.log(4);
        subscription.currentPrice = pricing;
        subscription.availability = availability;
        await subscription.save();
        console.log(5);
      } else {
        console.log(6);
        subscription = await db.Subscription.create({
          title,
          availability,
          imageUrl: imageUrlFixed,
          url: webUrl,
          initialPrice: pricing,
          currentPrice: pricing,
          priceHistories: [{ datetime: new Date(), price: pricing }],
        });
        console.log(7);
      }

      console.log(8);
      const upsertedUser = await db.User.updateOne(
        { username, chatId },
        { $addToSet: { subscriptions: subscription._id } },
        { upsert: true }
      );
      console.log(9);

      const userId = user
        ? user._id
        : upsertedUser && Array.isArray(upsertedUser.upserted) && upsertedUser.upserted.length
        ? upsertedUser.upserted[0]._id
        : "";

      console.log(10);

      await ctx.deleteMessage(message_id);
      await ctx.replyWithPhoto(imageUrlFixed, {
        caption: `*Title: *${title}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${webUrl}`,
        parse_mode: "Markdown",
      });
      return await ctx.reply(`You will be notified when the price drops below <b>₹${pricing}</b>`, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          Markup.button.callback("Delete Alert?", `delete_alert_${subscription._id}:${userId}`),
        ]),
      });
    } catch (e) {
      console.log("Error in message:", e);
      return ctx.reply("Some unexpected error occurred! Please try again.");
    }
  });
};
