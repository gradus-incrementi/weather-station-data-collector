import express from "express";
const bodyParser = require("body-parser");
const app = express();
const port = 8080;

// Middleware to parse the body of POST requests
app.use(bodyParser.text());

// Endpoint to receive weather data
app.post("/weather-data", (req, res) => {
  console.log("Received weather data:", req.body);
  res.send("Data received\n");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
