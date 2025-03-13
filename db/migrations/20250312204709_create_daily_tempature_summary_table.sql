-- migrate:up
CREATE TABLE IF NOT EXISTS daily_tempature_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    high_temp REAL NOT NULL,
    low_temp REAL NOT NULL
);

-- migrate:down
Drop table if exists daily_tempature_summary;
