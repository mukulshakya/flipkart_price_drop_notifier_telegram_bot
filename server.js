// const express = require("express");
// // const amazonScrapper = require("./amazonScrapper");
// const flipkartScrapper = require("./src/utilities/flipkartScrapper");
// const app = express();
// // const flipkartScrapper = require("./flipkartScrapper");
// app.use(express.json());

// app.post("/getData", async (req, res) => {
//   const response = await flipkartScrapper(req.body.url);
//   res.json(response);
// });

// app.listen(3000, () => console.log("server up on 3000"));

require("dotenv").config();
const db = require("./src/db");
const fs = require("fs");
const mongoose = require("mongoose");

mongoose.connection.once("open", async () => {
  console.log("mongoose connection open");

  db.Subscription.find()
    .then((data) => {
      const jsonData = data.map((i) => i.toJSON());
      console.log("total docs", jsonData.length);
      fs.writeFileSync("./export.json", JSON.stringify(jsonData));
    })
    .catch((e) => console.log(e));
});
