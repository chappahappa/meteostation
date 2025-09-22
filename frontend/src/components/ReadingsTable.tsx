// components/ReadingsTable.tsx
import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useSensor } from "../contexts/SensorContext";
import { SensorReading } from "../types";

const ReadingsTable: React.FC = () => {
  const {
    readings,
    pagination,
    loading,
    loadMoreData,
    updateReading,
    deleteReading,
  } = useSensor();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{
    temperature: string;
    humidity: string;
  }>({
    temperature: "",
    humidity: "",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  const startEditing = (reading: SensorReading) => {
    setEditingId(reading.id);
    setEditingValues({
      temperature: reading.temperature.toString(),
      humidity: reading.humidity.toString(),
    });
  };

  const handleUpdate = async (
    id: number,
    field: keyof SensorReading,
    value: string
  ) => {
    await updateReading(id, field, value);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;
    await deleteReading(id);
  };

  const handleInputChange = (
    field: "temperature" | "humidity",
    value: string
  ) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (reading: SensorReading) => {
    let hasChanges = false;

    if (editingValues.temperature !== reading.temperature.toString()) {
      await handleUpdate(reading.id, "temperature", editingValues.temperature);
      hasChanges = true;
    }

    if (editingValues.humidity !== reading.humidity.toString()) {
      await handleUpdate(reading.id, "humidity", editingValues.humidity);
      hasChanges = true;
    }

    if (!hasChanges) {
      setEditingId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, reading: SensorReading) => {
    if (e.key === "Enter") {
      handleSave(reading);
    }
  };

  const handleBlur = async (e: React.FocusEvent, reading: SensorReading) => {
    // Проверяем, переходит ли фокус на другое поле редактирования в этой же строке
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest("tr") === e.currentTarget.closest("tr")) {
      return; // Не сохраняем, если фокус переходит внутри той же строки
    }

    await handleSave(reading);
  };

  return (
    <div className="data-table-container">
      <h2>Таблица данных</h2>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Температура (°C)</th>
              <th>Влажность (%)</th>
              <th>Дата и время</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <td>{reading.id}</td>
                <td>
                  {editingId === reading.id ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editingValues.temperature}
                      onChange={(e) =>
                        handleInputChange("temperature", e.target.value)
                      }
                      onBlur={(e) => handleBlur(e, reading)}
                      onKeyPress={(e) => handleKeyPress(e, reading)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(reading)}
                      style={{ cursor: "pointer", padding: "4px 8px" }}
                    >
                      {reading.temperature}°C
                    </span>
                  )}
                </td>
                <td>
                  {editingId === reading.id ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editingValues.humidity}
                      onChange={(e) =>
                        handleInputChange("humidity", e.target.value)
                      }
                      onBlur={(e) => handleBlur(e, reading)}
                      onKeyPress={(e) => handleKeyPress(e, reading)}
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(reading)}
                      style={{ cursor: "pointer", padding: "4px 8px" }}
                    >
                      {reading.humidity}%
                    </span>
                  )}
                </td>
                <td>{formatDate(reading.timestamp)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleDelete(reading.id)}
                      className="delete-btn"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.page < pagination.pages && (
        <div className="load-more">
          <button onClick={loadMoreData} disabled={loading}>
            {loading
              ? "Загрузка..."
              : `Загрузить еще (${
                  pagination.total - readings.length
                } осталось)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingsTable;
