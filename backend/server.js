// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// База
const db = new sqlite3.Database('./sensor.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sensor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- CRUD API ---

// READ: получить все данные
app.get('/api/sensor', (req, res) => {
  db.all("SELECT * FROM sensor ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CREATE: добавить новое измерение
app.post('/api/sensor', (req, res) => {
  const { temperature, humidity, pressure } = req.body;
  db.run(
    "INSERT INTO sensor (temperature, humidity, pressure) VALUES (?, ?, ?)",
    [temperature, humidity, pressure],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// UPDATE: изменить измерение по id
app.put('/api/sensor/:id', (req, res) => {
  const { id } = req.params;
  const { temperature, humidity, pressure } = req.body;
  db.run(
    "UPDATE sensor SET temperature = ?, humidity = ?, pressure = ? WHERE id = ?",
    [temperature, humidity, pressure, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// DELETE: удалить измерение по id
app.delete('/api/sensor/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM sensor WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

const PORT = 2000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));