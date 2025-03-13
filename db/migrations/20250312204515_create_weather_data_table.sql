-- migrate:up
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
);

-- migrate:down
drop table if exists weather_data;
