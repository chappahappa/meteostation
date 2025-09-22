const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Инициализация базы данных
const dbPath = path.join(__dirname, "sensor_data.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("Подключение к SQLite базе данных установлено");

    // Включаем поддержку внешних ключей
    db.run("PRAGMA foreign_keys = ON");

    // Создание таблицы если не существует
    db.run(
      `CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error("Ошибка создания таблицы:", err.message);
        } else {
          console.log("Таблица sensor_readings готова");
        }
      }
    );
  }
});

// Вспомогательная функция для обработки ошибок БД
function handleDatabaseError(err, res, operation) {
  console.error(`Ошибка ${operation}:`, err.message);
  return res.status(500).json({
    error: `Ошибка сервера при ${operation}`,
    details: err.message,
  });
}

// Функция для корректного форматирования времени с учетом часового пояса
function getLocalTimeFilter(period) {
  const now = new Date();
  let filterTime;

  switch (period) {
    case "hour":
      filterTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "day":
      filterTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      filterTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      filterTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return "";
  }

  return filterTime.toISOString().replace("T", " ").substring(0, 19);
}

// Роут для добавления данных с датчика
app.post("/data", (req, res) => {
  console.log("Получены данные:", req.body);

  const { temperature, humidity, timestamp } = req.body;

  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({
      error: "Отсутствуют обязательные поля: temperature или humidity",
    });
  }

  // Используем переданную метку времени или текущее время
  const actualTimestamp = timestamp || new Date().toISOString();

  const sql = `INSERT INTO sensor_readings (temperature, humidity, timestamp) VALUES (?, ?, ?)`;

  db.run(sql, [temperature, humidity, actualTimestamp], function (err) {
    if (err) {
      return handleDatabaseError(err, res, "записи данных");
    }

    console.log(`Данные записаны в базу. ID: ${this.lastID}`);

    // Возвращаем созданную запись
    db.get(
      "SELECT * FROM sensor_readings WHERE id = ?",
      [this.lastID],
      (err, row) => {
        if (err) {
          return handleDatabaseError(err, res, "получения созданной записи");
        }

        res.status(201).json(row);
      }
    );
  });
});

// Роут для получения данных с фильтрацией по периоду
app.get("/data", (req, res) => {
  const { period, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = "";
  let params = [];

  // Фильтрация по периоду с учетом локального времени
  if (period && period !== "all") {
    const filterTime = getLocalTimeFilter(period);
    whereClause = " WHERE timestamp >= ?";
    params.push(filterTime);
  }

  // Получение данных с пагинацией
  const dataSql = `
    SELECT * FROM sensor_readings 
    ${whereClause} 
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `;

  // Получение общего количества записей для пагинации
  const countSql = `SELECT COUNT(*) as total FROM sensor_readings ${whereClause}`;

  db.get(countSql, params, (err, countResult) => {
    if (err) {
      return handleDatabaseError(err, res, "получения количества записей");
    }

    db.all(dataSql, [...params, parseInt(limit), offset], (err, rows) => {
      if (err) {
        return handleDatabaseError(err, res, "чтения данных");
      }

      // Преобразуем timestamp в удобный формат
      const formattedRows = rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp).toISOString(),
      }));

      res.json({
        data: formattedRows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit),
        },
      });
    });
  });
});

// Роут для получения агрегированных данных для графиков
app.get("/data/chart", (req, res) => {
  const { period = "day", aggregate = "hour" } = req.query;

  let timeFormat;
  switch (aggregate) {
    case "minute":
      timeFormat = "%Y-%m-%d %H:%M:00";
      break;
    case "hour":
      timeFormat = "%Y-%m-%d %H:00:00";
      break;
    case "day":
      timeFormat = "%Y-%m-%d 00:00:00";
      break;
    default:
      timeFormat = "%Y-%m-%d %H:00:00";
  }

  let whereClause = "";
  let params = [];

  if (period && period !== "all") {
    const filterTime = getLocalTimeFilter(period);
    whereClause = " WHERE timestamp >= ?";
    params.push(filterTime);
  }

  const sql = `
    SELECT 
      strftime('${timeFormat}', timestamp) as time_period,
      AVG(temperature) as avg_temperature,
      AVG(humidity) as avg_humidity,
      COUNT(*) as readings_count
    FROM sensor_readings
    ${whereClause}
    GROUP BY time_period
    ORDER BY time_period ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return handleDatabaseError(err, res, "получения данных для графика");
    }

    // Форматируем данные для фронтенда
    const formattedData = rows.map((row) => ({
      ...row,
      avg_temperature: row.avg_temperature
        ? parseFloat(row.avg_temperature)
        : 0,
      avg_humidity: row.avg_humidity ? parseFloat(row.avg_humidity) : 0,
      time_period: new Date(row.time_period + "Z").toISOString(), // Добавляем Z для UTC
    }));

    res.json(formattedData);
  });
});

// Роут для получения конкретной записи
app.get("/data/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM sensor_readings WHERE id = ?";

  db.get(sql, [id], (err, row) => {
    if (err) {
      return handleDatabaseError(err, res, "получения записи");
    }

    if (!row) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    // Форматируем timestamp
    res.json({
      ...row,
      timestamp: new Date(row.timestamp).toISOString(),
    });
  });
});

// Роут для обновления записи
app.put("/data/:id", (req, res) => {
  const { id } = req.params;
  const { field, value, temperature, humidity, timestamp } = req.body;

  // Поддержка старого формата (объект с temperature и humidity)
  let updateData = {};
  if (field && value !== undefined) {
    // Новый формат: поле и значение
    updateData[field] = value;
  } else if (temperature !== undefined || humidity !== undefined) {
    // Старый формат: объект с данными
    updateData = { temperature, humidity };
  } else {
    return res.status(400).json({
      error: "Отсутствуют данные для обновления",
    });
  }

  // Подготавливаем SQL запрос динамически
  const setClauses = [];
  const params = [];

  if (updateData.temperature !== undefined) {
    setClauses.push("temperature = ?");
    params.push(updateData.temperature);
  }

  if (updateData.humidity !== undefined) {
    setClauses.push("humidity = ?");
    params.push(updateData.humidity);
  }

  if (timestamp !== undefined) {
    setClauses.push("timestamp = ?");
    params.push(timestamp);
  }

  if (setClauses.length === 0) {
    return res.status(400).json({
      error: "Нет данных для обновления",
    });
  }

  const sql = `
    UPDATE sensor_readings 
    SET ${setClauses.join(", ")}
    WHERE id = ?
  `;

  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      return handleDatabaseError(err, res, "обновления записи");
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    // Возвращаем обновленную запись
    db.get("SELECT * FROM sensor_readings WHERE id = ?", [id], (err, row) => {
      if (err) {
        return handleDatabaseError(err, res, "получения обновленной записи");
      }

      res.json({
        ...row,
        timestamp: new Date(row.timestamp).toISOString(),
      });
    });
  });
});

// Роут для удаления записи
app.delete("/data/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM sensor_readings WHERE id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      return handleDatabaseError(err, res, "удаления записи");
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    res.json({
      message: "Запись успешно удалена",
      id: parseInt(id),
      changes: this.changes,
    });
  });
});

// Роут для получения статистики
app.get("/stats", (req, res) => {
  const { period } = req.query;

  let whereClause = "";
  let params = [];

  if (period && period !== "all") {
    const filterTime = getLocalTimeFilter(period);
    whereClause = " WHERE timestamp >= ?";
    params.push(filterTime);
  }

  const sql = `
    SELECT 
      COUNT(*) as total_records,
      AVG(temperature) as avg_temperature,
      AVG(humidity) as avg_humidity,
      MAX(temperature) as max_temperature,
      MIN(temperature) as min_temperature,
      MAX(humidity) as max_humidity,
      MIN(humidity) as min_humidity,
      MAX(timestamp) as last_reading
    FROM sensor_readings
    ${whereClause}
  `;

  db.get(sql, params, (err, row) => {
    if (err) {
      return handleDatabaseError(err, res, "получения статистики");
    }

    // Обрабатываем NULL значения
    const result = {
      total_records: row.total_records || 0,
      avg_temperature: row.avg_temperature
        ? parseFloat(row.avg_temperature)
        : 0,
      avg_humidity: row.avg_humidity ? parseFloat(row.avg_humidity) : 0,
      max_temperature: row.max_temperature
        ? parseFloat(row.max_temperature)
        : 0,
      min_temperature: row.min_temperature
        ? parseFloat(row.min_temperature)
        : 0,
      max_humidity: row.max_humidity ? parseFloat(row.max_humidity) : 0,
      min_humidity: row.min_humidity ? parseFloat(row.min_humidity) : 0,
      last_reading: row.last_reading
        ? new Date(row.last_reading).toISOString()
        : null,
    };

    res.json(result);
  });
});

// Роут для массового удаления записей
app.post("/data/bulk-delete", (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Не предоставлены ID для удаления" });
  }

  const placeholders = ids.map(() => "?").join(",");
  const sql = `DELETE FROM sensor_readings WHERE id IN (${placeholders})`;

  db.run(sql, ids, function (err) {
    if (err) {
      return handleDatabaseError(err, res, "массового удаления");
    }

    res.json({
      message: "Записи успешно удалены",
      deletedCount: this.changes,
    });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Обработка несуществующих роутов
app.use((req, res) => {
  res.status(404).json({ error: "Роут не найден" });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error("Необработанная ошибка:", err);
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
    message: err.message,
  });
});

// Запуск сервера
app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Локальный доступ: http://localhost:${port}`);
  console.log(`API endpoints:`);
  console.log(`  GET  /data - получение данных`);
  console.log(`  POST /data - добавление данных`);
  console.log(`  GET  /data/chart - данные для графика`);
  console.log(`  GET  /stats - статистика`);
  console.log(`  PUT  /data/:id - обновление записи`);
  console.log(`  DELETE /data/:id - удаление записи`);
});

module.exports = app;
