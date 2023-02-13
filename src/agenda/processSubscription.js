const flipkartScrapper = require("../utilities/flipkartScrapper");

const DOC_BATCH_SIZE = 50;

module.exports = async (agenda, bot, db) => {
  const stream = db.Subscription.find({ scheduled: false }).batchSize(DOC_BATCH_SIZE).cursor();
  for await (const doc of stream) {
    const jobName = `process subscription ${doc._id}`;
    agenda.define(jobName, {}, async () => {
      await processSubscription(agenda, jobName, doc, bot, db);
    });
    // job events
    agenda.on(`start:${jobName}`, () => {
      console.log(`Job ${jobName} started`);
    });
    agenda.on(`success:${jobName}`, () => {
      console.log(`Job ${jobName} succeeded`);
    });
    agenda.on(`fail:${jobName}`, () => {
      console.log(`Job ${jobName} failed`);
    });
    // Start running
    await agenda.every("5 minutes", jobName);
  }
};

async function processSubscription(agenda, jobName, subscription, bot, db) {
  subscription = await db.Subscription.findById(subscription._id);
  if (!subscription) {
    agenda.cancel({ name: jobName });
    throw new Error("Subscription got deleted");
  }

  const { pricing, availability } = await flipkartScrapper(subscription.url);
  if (!String(pricing).match(/\d+/) || !availability)
    throw new Error("Pricing and availability can't be found.");

  if (Number(pricing) < subscription.currentPrice && subscription.currentPrice <= subscription.initialPrice) {
    const stream = db.User.find({ subscriptions: subscription._id }).batchSize(DOC_BATCH_SIZE).cursor();
    for await (const doc of stream) {
      await bot.telegram.sendMessage(doc.chatId, "Hey! We've Noticed a price drop on your product.");
      await bot.telegram.sendPhoto(doc.chatId, subscription.imageUrl, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Delete Alert?",
                callback_data: `delete_alert_${subscription._id}:${doc._id}`,
                hide: false,
              },
            ],
            [
              {
                text: "View Price History?",
                callback_data: `pricehistory_${subscription._id}:${doc._id}`,
                hide: false,
              },
            ],
          ],
        },
        caption: `*Title: *${subscription.title}\n\n*Previous Price: *₹${subscription.currentPrice}\n\n*Current Price: *₹${pricing}\n\n*Availability: *${availability}\n\n*Url: *${subscription.url}`,
      });
    }
  }

  if (subscription.currentPrice != pricing && subscription.priceHistories.length < 20)
    subscription.priceHistories.push({
      datetime: new Date(),
      price: pricing,
    });

  subscription.currentPrice = pricing;
  subscription.availability = availability;
  subscription.scheduled = true;
  await subscription.save();
}
