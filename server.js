const express = require("express");
const app = express();
const flipkartScrapper = require("./flipkartScrapper");
app.use(express.json());

app.post("/getData", async (req, res) => {
  const response = await flipkartScrapper(req.body.url);
  res.json(response);
});

app.listen(3000, () => console.log("server up on 3000"));
