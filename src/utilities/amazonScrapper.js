const cheerio = require("cheerio");
const axios = require("axios");

module.exports = (url) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        const $ = cheerio.load(response.data);

        require("fs").writeFileSync("./amazonScrapperRes.html", $.html());

        resolve({});
      })
      .catch((e) => {
        console.log(e);
        reject();
      });
  });
