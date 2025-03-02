import express from "express";
import bodyParser from "body-parser";
import Database from "better-sqlite3";
import moment from "moment-timezone";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const timezone = process.env.WEATHER_STATION_TIMEZONE;
const database_path = process.env.DATABASE_PATH;

const app = express();
const port = 8080;

// Set up SQLite database with better-sqlite3
const db = new Database(database_path);

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

const createGrowthDegreeDaysTableQuery = `
CREATE TABLE IF NOT EXISTS daily_tempature_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  high_temp REAL NOT NULL,
  low_temp REAL NOT NULL
)`;

db.exec(createGrowthDegreeDaysTableQuery);

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

app.get("/weather-data/current", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT
        dateutc, tempf, humidity, windspeedmph, windgustmph, maxdailygust,
        winddir, uv, solarradiation, battout, tempinf, humidityin,
        baromrelin, baromabsin
      FROM weather_data
      ORDER BY id DESC
      LIMIT 1
    `);

    const row = stmt.get();

    if (row) {
      res.json(row);
    } else {
      res.status(404).send("No weather data available");
    }
  } catch (err) {
    console.error("Error retrieving current weather data:", err.message);
    res.status(500).send("Failed to retrieve current weather data");
  }
});

// New endpoint to get all weather data for a specific day
app.get("/weather-data/day/all", (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res
      .status(400)
      .send("Bad Request: The 'date' query parameter is required");
  }

  try {
    // Convert the provided date into the start and end of that date in the given timezone
    const startOfDay = moment
      .tz(date, timezone)
      .startOf("day")
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");
    const endOfDay = moment
      .tz(date, timezone)
      .endOf("day")
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");

    const stmt = db.prepare(`
      SELECT * FROM weather_data
      WHERE dateutc BETWEEN ? AND ?
    `);

    const rows = stmt.all(startOfDay, endOfDay);

    res.json(rows);
  } catch (err) {
    console.error("Error retrieving weather data for the day:", err.message);
    res.status(500).send("Failed to retrieve weather data for the given day");
  }
});

app.get("/weather-data/day/summary", async (req, res) => {
  const { date } = req.query;
  const currentDate = moment.tz(timezone).format("YYYY-MM-DD");

  // If the date is not provided, use the current date
  const queryDate = date ? date : currentDate;

  if (!queryDate) {
    return res
      .status(400)
      .send("Bad Request: The 'date' query parameter is required");
  }

  try {
    // Check existing data
    const checkStmt = db.prepare(`
      SELECT high_temp, low_temp FROM daily_tempature_summary WHERE date = ?
    `);

    const row = checkStmt.get(queryDate);

    if (row) {
      // Return existing data
      return res.json({
        date,
        high_temp: row.high_temp,
        low_temp: row.low_temp,
      });
    }

    const startOfDay = moment
      .tz(queryDate, timezone)
      .startOf("day")
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");
    const endOfDay = moment
      .tz(queryDate, timezone)
      .endOf("day")
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");

    const tempStmt = db.prepare(`
      SELECT MIN(tempf) AS tMin, MAX(tempf) AS tMax
      FROM weather_data
      WHERE dateutc BETWEEN ? AND ?
    `);

    const tempRow = tempStmt.get(startOfDay, endOfDay);

    if (!tempRow || tempRow.tMin === null || tempRow.tMax === null) {
      return res
        .status(404)
        .send("Temperature data not available for the given date.");
    }

    const insertStmt = db.prepare(`
      INSERT INTO daily_tempature_summary (date, high_temp, low_temp) VALUES (?, ?, ?)
    `);

    insertStmt.run(queryDate, tempRow.tMax, tempRow.tMin);

    return res.json({
      date,
      high_temp: tempRow.tMax,
      low_temp: tempRow.tMin,
    });
  } catch (err) {
    console.error("Error processing daily summary:", err.message);
    res.status(500).send("Failed to process daily summary");
  }
});

// Catch-all route for 404 errors
app.use((req, res) => {
  console.error(`404 Error: Resource not found for URL ${req.originalUrl}`);
  res.status(404).send("404 Error: Resource not found");
});

// Start the server
app.listen(port, () => {
  console.log("Weather Station Data Collector");
  console.log(`Server listening on port ${port}`);
});
