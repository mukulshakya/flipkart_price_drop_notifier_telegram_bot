const flipkartScrapper = require("../flipkartScrapper");

module.exports = async function processSubscription(job, bot, db, done) {
  try {
    // throw new Error("cool error");
    const subscription = await db.Subscription.findById(job.data.id);
    if (!subscription) throw new Error("Subscription not found.");
    console.log(
      `STARTED - processing job ${job.id} for product: ${
        subscription.title
      } @ ${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })} IST`
    );
    const { pricing, availability } = await flipkartScrapper(subscription.url);

    if (!String(pricing).match(/\d+/) || !availability)
      throw new Error("Pricing and availability can't be found.");

    if (
      Number(pricing) < subscription.currentPrice &&
      subscription.currentPrice <= subscription.initialPrice
    ) {
      await bot.telegram.sendMessage(
        subscription.chatId,
        "Hey! We've Noticed a price drop on your product."
      );
      await bot.telegram.sendPhoto(subscription.chatId, subscription.imageUrl, {
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
        caption: `*Title: *${subscription.title}\n\n*Previous Price: *₹${subscription.currentPrice}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${subscription.url}`,
      });
    }

    if (subscription.currentPrice != pricing)
      subscription.priceHistories.push({
        datetime: new Date(),
        price: pricing,
      });

    subscription.currentPrice = pricing;
    subscription.availability = availability;
    await subscription.save();
    // await db.Subscription.findByIdAndUpdate(subscription._id, subscription);

    return done(null, {
      title: subscription.title,
      price: pricing,
      availability: availability,
    });
  } catch (e) {
    console.log(e);
    return done(e);
  }
};
