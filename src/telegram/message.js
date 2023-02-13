const { Markup } = require("telegraf");
const scrapper = require("../utilities/scrapper");
const {
  ALLOWED_LINKS,
  REQUIRED_KEYS,
  MAX_TRACKINGS,
  SKIP_MAX_TRACKING_USERS,
  URL_REGEX,
} = require("../utilities/contants");

const getUrlWithPortal = (text) => {
  let url, portal;
  for (const [key, re] of Object.entries(URL_REGEX)) {
    const match = text.match(re);
    if (match) {
      url = match[0];
      portal = key;
      break;
    }
  }

  return { url, portal };
};

module.exports = (bot, db) => {
  bot.on("message", async (ctx) => {
    try {
      let { url, portal } = getUrlWithPortal(ctx.message.text);
      if (!url || !portal)
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

      const resp = await scrapper[portal](url);
      const someKeyMissing = REQUIRED_KEYS.some((key) => !resp[key]);
      if (someKeyMissing)
        return ctx.reply("Link doesn't seem to be a valid one! Please provide the product page url only.");
      const { title, pricing, imageUrl, webUrl, availability } = resp;
      console.log({ title, pricing, imageUrl, webUrl, availability });
      const imageUrlFixed = imageUrl.split("?")[0].replace("{@width}", "200").replace("{@height}", "200");

      let subscription = await db.Subscription.findOne({
        $or: [{ url: webUrl }, { title }, { imageUrl: imageUrlFixed }],
      });
      if (subscription) {
        if (subscription.currentPrice != pricing && subscription.priceHistories.length < 20)
          subscription.priceHistories.push({
            datetime: new Date(),
            price: pricing,
          });
        if (pricing < subscription.lowestPrice) subscription.lowestPrice = pricing;
        if (pricing > subscription.highestPrice) subscription.highestPrice = pricing;
        subscription.currentPrice = pricing;
        subscription.availability = availability;
        await subscription.save();
      } else {
        subscription = await db.Subscription.create({
          portal,
          title,
          availability,
          imageUrl: imageUrlFixed,
          url: webUrl,
          initialPrice: pricing,
          currentPrice: pricing,
          lowestPrice: pricing,
          highestPrice: pricing,
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
        caption: `*Title: *${title}\n\n*Lowest Price: *₹${subscription.lowestPrice}\n\n*Highest Price: *₹${subscription.highestPrice}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${webUrl}\n\nYou will be notified when the price drops below *₹${pricing}*`,
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
