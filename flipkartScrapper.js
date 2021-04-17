const cheerio = require("cheerio");
const axios = require("axios");

function findNestedObj(entireObj) {
  let finalObj = { title: null, pricing: null, imageUrl: null };
  try {
    JSON.stringify(entireObj, (_, nestedValue) => {
      for (const key of ["pricing", "titleComponent", "imageUrl", "webUrl"]) {
        if (nestedValue && nestedValue[key]) {
          if (
            ["pricing", "imageUrl", "webUrl"].includes(key) &&
            typeof nestedValue[key] === "string"
          )
            finalObj[key] = nestedValue[key];
          else if (key === "titleComponent")
            finalObj["title"] = nestedValue[key]["value"]["title"];
        }
      }
      return nestedValue;
    });
  } catch (e) {
    console.log(e);
  } finally {
    return finalObj;
  }
}

module.exports = (url) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const elem = $("script#is_script")
          .html()
          .toString()
          .replace(/^window.__INITIAL_STATE__ = /, "")
          .replace(/;$/, "");

        const found = findNestedObj(JSON.parse(elem));
        resolve(found);
      })
      .catch((e) => {
        console.log(e);
        reject();
      });
  });
