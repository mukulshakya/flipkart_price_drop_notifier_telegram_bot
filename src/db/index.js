const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connected"))
  .catch((e) => console.log("DB connection error:", e));

module.exports = {
  // User: require("./users"),
  Subscription: require("./subscriptions"),
  Product: require("./products"),
};
