const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = require("mongoose");

const SubscriptionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    currentPrice: { type: Number, required: true },
    initialPrice: { type: Number, required: true },
    priceHistories: [
      {
        _id: false,
        datetime: { type: Date, default: new Date() },
        price: { type: Number, required: true },
      },
    ],
    url: { type: String, required: true },
    imageUrl: { type: String, required: true },
    availability: { type: String, default: "Available" },
    scheduled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("subscriptions", SubscriptionSchema);
