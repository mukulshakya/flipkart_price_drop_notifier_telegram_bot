const { Telegraf } = require("telegraf");
require("dotenv");
const bot = new Telegraf(process.env.BOT_TOKEN);
const flipkartScrapper = require("./flipkartScrapper");
const INVALID_LINK_MSG =
  "Link does't seem to be a valid one!! Please try again.";

// COMMANDS
bot.start((ctx) =>
  ctx.replyWithHTML(
    `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
  )
);
bot.help((ctx) =>
  ctx.replyWithHTML(
    `<b>Hi! Welcome to Flipkart Price Tracker</b>

     Send Link to Start Tracking
    `
  )
);

// GLOBAL MESSAGE HANDLER
bot.on("message", async (ctx) => {
  console.log(ctx.message)
  const url = ctx.message.text;
  if (!url.startsWith("https://www.flipkart.com"))
    return ctx.replyWithHTML(INVALID_LINK_MSG);

  ctx.reply("Please wait fetching details.");
  const { title, pricing, imageUrl } = await flipkartScrapper(url);
  const imageUrlFixed = imageUrl
    .split("?")[0]
    .replace("{@width}", "200")
    .replace("{@height}", "200");
  ctx.replyWithPhoto(imageUrlFixed, {
    caption: `*Title: *${title}\n\n*Current Price: *₹${pricing}`,
    parse_mode: "Markdown",
  });
  return ctx.replyWithHTML(
    `You will be notified when the price drops below <b>₹${pricing}</b>`
  );
});


// BOT SERVER LISTENER
bot
  .launch()
  .then(() => console.log("BOT Started Successfully!"))
  .catch((e) => console.log("BOT Start Failed:", e));
