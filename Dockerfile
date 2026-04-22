FROM node:20

import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("RUNNING ON " + PORT);
});

CMD ["node", "server.js"]

