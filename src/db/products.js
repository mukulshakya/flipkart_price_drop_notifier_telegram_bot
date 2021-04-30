const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    chatId: { type: Number, required: true },
    username: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, unique: true },
    currentPrice: { type: Number, required: true },
    initialPrice: { type: Number, required: true },
    users: [UserSchema],
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
    jobId: { type: String, default: "" },
  },
  { timestamps: true }
);

// May be an extra overhead
// UserSchema.index({ chatId: 1, username: 1 }, { unique: true });

module.exports = model("products", ProductSchema);
