module.exports = (bot, db, queue) => {
  require("fs")
    .readdirSync(__dirname)
    .forEach(
      (fileName) =>
        fileName !== "index.js" && require(`./${fileName}`)(bot, db, queue)
    );
};
