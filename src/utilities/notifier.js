const cron = require("node-cron");
const flipkartScrapper = require("./flipkartScrapper");

module.exports = (bot, db) => {
  cron.schedule("0 */1 * * *", async () => {
    console.log(
      "****STARTING HOURLY CRON****",
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      "IST"
    );

    try {
      const subscriptions = await db.Subscription.find();
      for (const subscription of subscriptions) {
        const { pricing, availability } = await flipkartScrapper(
          subscription.url
        );
        if (String(pricing).match(/\d+/) && availability) {
          if (
            Number(pricing) < subscription.currentPrice &&
            subscription.currentPrice <= subscription.initialPrice
          ) {
            await bot.telegram.sendMessage(
              subscription.chatId,
              "Hey! We've Noticed a price drop on your product."
            );
            await bot.telegram.sendPhoto(
              subscription.chatId,
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
                caption: `*Title: *${subscription.title}\n\n*Previous Price: *₹${subscription.currentPrice}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${subscription.url}`,
              }
            );
          }

          if (subscription.currentPrice != pricing)
            subscription.priceHistories.push({
              datetime: new Date(),
              price: pricing,
            });

          subscription.currentPrice = pricing;
          subscription.availability = availability;
          await subscription.save();
        }
      }
    } catch (e) {
      console.log("Cron error:", e);
    }
  });
};
