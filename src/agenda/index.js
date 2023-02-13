const processSubscriptions = require("./processSubscription.js");

module.exports = async (agenda, bot, db) => {
  agenda.define("process subscriptions", {}, async () => {
    await processSubscriptions(agenda, bot, db);
  });

  // agenda.on(`start:process subscriptions`, (job) => {
  //   console.log(`Job ${job.attrs.name} started`);
  // });
  // Start running
  await agenda.start();
  await agenda.every("1 minute", "process subscriptions");
};
