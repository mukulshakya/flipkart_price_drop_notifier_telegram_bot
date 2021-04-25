const Bull = require("bull");
const processSubscription = require("./processSubscription");

const subscriptionQueue = new Bull("subscriptionQueue", {
  limiter: { max: 50, duration: 1000 },
});