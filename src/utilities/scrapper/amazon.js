const cheerio = require("cheerio");
const axios = require("axios");

// let finalObj = {
//   title: null,
//   pricing: null,
//   imageUrl: null,
//   webUrl: null,
//   availability: "Available",
// }

module.exports = (url) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const finalObj = {};
        finalObj.title = $("span#productTitle").first().text().trim();
        finalObj.pricing = $("span.a-price-whole").first().text().split(".")[0].replace(/,/g, "");
        finalObj.imageUrl = $("div#imgTagWrapperId").first().children("img").attr("src");
        finalObj.webUrl = $("link[rel='canonical']").first().attr("href");
        finalObj.availability = $("div#availability").first().text().trim() ? "Available" : "Unavailable";
        // console.log({ title, price, image, url, availability });

        if (finalObj.pricing) finalObj.pricing = parseInt(finalObj.pricing);

        require("fs").writeFileSync(
          `/Users/mukulshakya/extra/flipkart_price_drop_notifier_telegram_bot/playground/html/${
            url.split("/")[3]
          }.html`,
          $.html()
        );

        resolve(finalObj);
      })
      .catch((e) => {
        // console.log(e);
        reject();
      });
  });
