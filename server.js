import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 8080;

// Middleware to parse the body of POST requests
app.use(bodyParser.text());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Weather Station Data Collector\n");
});

// Endpoint to receive weather data
app.post("/weather-data", (req, res) => {
  console.log("Received weather data:", req.body);
  res.send("Data received\n");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
