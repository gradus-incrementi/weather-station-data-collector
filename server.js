import express from "express";
import bodyParser from "body-parser";
import Database from "better-sqlite3";

const app = express();
const port = 8080;

// Set up SQLite database with better-sqlite3
const db = new Database("./data/weather.db", { verbose: console.log });

// Create the weather_data table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS weather_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passkey TEXT,
  stationtype TEXT,
  dateutc TEXT,
  tempf REAL,
  humidity INTEGER,
  windspeedmph REAL,
  windgustmph REAL,
  maxdailygust REAL,
  winddir INTEGER,
  uv INTEGER,
  solarradiation REAL,
  hourlyrainin REAL,
  eventrainin REAL,
  dailyrainin REAL,
  weeklyrainin REAL,
  monthlyrainin REAL,
  totalrainin REAL,
  battout INTEGER,
  tempinf REAL,
  humidityin INTEGER,
  baromrelin REAL,
  baromabsin REAL
)`;

db.exec(createTableQuery);

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
  const data = req.query;
  console.log("Received GET weather data:", data);

  // Prepare statement using better-sqlite3
  const insert = db.prepare(`
      INSERT INTO weather_data (
        passkey, stationtype, dateutc, tempf, humidity, windspeedmph, windgustmph,
        maxdailygust, winddir, uv, solarradiation, hourlyrainin, eventrainin,
        dailyrainin, weeklyrainin, monthlyrainin, totalrainin, battout, tempinf,
        humidityin, baromrelin, baromabsin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

  // Insert data into the database
  try {
    insert.run(
      data.PASSKEY,
      data.stationtype,
      data.dateutc,
      data.tempf,
      data.humidity,
      data.windspeedmph,
      data.windgustmph,
      data.maxdailygust,
      data.winddir,
      data.uv,
      data.solarradiation,
      data.hourlyrainin,
      data.eventrainin,
      data.dailyrainin,
      data.weeklyrainin,
      data.monthlyrainin,
      data.totalrainin,
      data.battout,
      data.tempinf,
      data.humidityin,
      data.baromrelin,
      data.baromabsin,
    );

    console.log("Inserted weather data into database");
    res.send("Data received\n");
  } catch (err) {
    console.error("Error inserting data:", err.message);
    res.status(500).send("Failed to insert data");
  }
});

app.get("/weather-data/all", (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM weather_data");
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error("Error retrieving data:", err.message);
    res.status(500).send("Failed to retrieve data");
  }
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
