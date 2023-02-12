const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    username: { type: String, required: true, lowercase: true, trim: true },
    chatId: { type: Number, required: true },
    subscriptions: [{ type: Schema.Types.ObjectId, ref: "subscriptions" }],
  },
  { timestamps: true }
);

// UserSchema.index({ chatId: 1, username: 1 }, { unique: true });

module.exports = model("users", UserSchema);
