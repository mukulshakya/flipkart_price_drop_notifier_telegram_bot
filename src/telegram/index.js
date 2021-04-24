module.exports = (bot, db) => {
  require("fs")
    .readdirSync(__dirname)
    .forEach(
      (fileName) => fileName !== "index.js" && require(`./${fileName}`)(bot, db)
    );
};
