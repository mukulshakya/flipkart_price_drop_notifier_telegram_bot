const { Markup } = require("telegraf");
const flipkartScrapper = require("../utilities/flipkartScrapper");

const ALLOWED_LINKS = ["Flipkart"];
const REQUIRED_KEYS = ["title", "pricing", "imageUrl", "webUrl", "availability"];
const MAX_TRACKINGS = 10;
const SKIP_MAX_TRACKING_USERS = ["mukulshakya"];
const FK_URL_REGEX = /http(s)?:\/\/((w){3}|(dl))?[.]?flipkart.com\/[^\s]+/i;

module.exports = (bot, db) => {
  bot.on("message", async (ctx) => {
    try {
      let url = ctx.message.text.match(FK_URL_REGEX);
      if (!url)
        return ctx.replyWithHTML(
          `Link doesn't seem to be a valid one!! Please try again.\n\nWe only support links from ${ALLOWED_LINKS.join(
            ", "
          )}`
        );

      const { message_id } = await ctx.reply("Please wait! fetching details.");

      const { username, id: chatId } = ctx.message.chat;

      let user = await db.User.findOne({ username, chatId });
      if (!SKIP_MAX_TRACKING_USERS.includes(username) && user && user.subscriptions.length >= MAX_TRACKINGS) {
        return await ctx.reply(
          `You can only have upto ${MAX_TRACKINGS} trackings set up. Delete previous to add new.`
        );
      }

      const resp = await flipkartScrapper(url[0]);
      const someKeyMissing = REQUIRED_KEYS.some((key) => resp[key] === null);
      if (someKeyMissing)
        return ctx.reply("Link doesn't seem to be a valid one! Please provide the product page url only.");
      const { title, pricing, imageUrl, webUrl, availability } = resp;
      const imageUrlFixed = imageUrl.split("?")[0].replace("{@width}", "200").replace("{@height}", "200");

      let subscription = await db.Subscription.findOne({
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
      } else {
        subscription = await db.Subscription.create({
          title,
          availability,
          imageUrl: imageUrlFixed,
          url: webUrl,
          initialPrice: pricing,
          currentPrice: pricing,
          priceHistories: [{ datetime: new Date(), price: pricing }],
        });
      }

      const upsertedUser = await db.User.updateOne(
        { username, chatId },
        { $addToSet: { subscriptions: subscription._id } },
        { upsert: true }
      );

      const userId = user
        ? user._id
        : upsertedUser && Array.isArray(upsertedUser.upserted) && upsertedUser.upserted.length
        ? upsertedUser.upserted[0]._id
        : "";

      await ctx.deleteMessage(message_id);
      return ctx.replyWithPhoto(imageUrlFixed, {
        caption: `*Title: *${title}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${webUrl}\n\n\nYou will be notified when the price drops below *₹${pricing}*`,
        parse_mode: "Markdown",
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
