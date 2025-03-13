CREATE TABLE weather_data (
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
);
CREATE TABLE daily_tempature_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  high_temp REAL NOT NULL,
  low_temp REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20250312204515'),
  ('20250312204709');
