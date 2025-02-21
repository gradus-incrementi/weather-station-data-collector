import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 8080;

// Middleware to parse the body of POST requests
app.use(bodyParser.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Weather Station Data Collector\n");
});

// Endpoint to receive weather data
app.post("/weather-data", (req, res) => {
  console.log("Received weather data:", req.body);
  res.send("Data received\n");
});

app.get("/weather-data", (req, res) => {
  console.log("Received GET weather data:", req.query);
  res.send("Data received\n");
});

// Catch-all route for 404 errors
app.use((req, res, next) => {
  console.error(`404 Error: Resource not found for URL ${req.originalUrl}`);
  res.status(404).send("404 Error: Resource not found");
});

// Start the server
app.listen(port, () => {
  console.log("Weather Station Data Collector");
  console.log(`Server listening on port ${port}`);
});
