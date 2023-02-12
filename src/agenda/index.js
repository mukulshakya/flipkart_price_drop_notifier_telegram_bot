const processSubscriptions = require("./processSubscription.js");

module.exports = (agenda, bot, db) => {
  // console.log("Agenda called");
  agenda.define("process subscriptions", {}, async () => {
    // console.log("Starting process subscriptions");
    await processSubscriptions(agenda, bot, db);
  });

  // agenda.now("process subscriptions");

  agenda.on(`start:process subscriptions`, (job) => {
    console.log(`Job ${job.attrs.name} started`);
  });
  // Start running
  (async function () {
    await agenda.start();
    await agenda.every("10 minutes", "process subscriptions");
  })();
};
