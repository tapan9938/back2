import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const db = new Database(path.join(__dirname, '../portfolio.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date DATE DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    count INTEGER DEFAULT 1234,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize view count if not exists
const viewCount = db.prepare('SELECT count FROM views LIMIT 1').get();
if (!viewCount) {
  db.prepare('INSERT INTO views (count) VALUES (1234)').run();
}

console.log('✅ Database initialized successfully');

export default db;
