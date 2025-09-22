// components/AddReadingForm.tsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useSensor } from "../contexts/SensorContext";

const AddReadingForm: React.FC = () => {
  const { addReading } = useSensor();
  const [newReading, setNewReading] = useState({
    temperature: "",
    humidity: "",
    timestamp: "",
  });

  const handleAdd = async () => {
    if (!newReading.temperature || !newReading.humidity) return;

    await addReading(newReading);
    setNewReading({ temperature: "", humidity: "", timestamp: "" });
  };

  return (
    <div className="add-row">
      <input
        type="number"
        step="0.1"
        placeholder="Температура"
        value={newReading.temperature}
        onChange={(e) =>
          setNewReading((prev) => ({
            ...prev,
            temperature: e.target.value,
          }))
        }
      />
      <input
        type="number"
        step="0.1"
        placeholder="Влажность"
        value={newReading.humidity}
        onChange={(e) =>
          setNewReading((prev) => ({ ...prev, humidity: e.target.value }))
        }
      />
      <input
        type="datetime-local"
        placeholder="Дата и время"
        value={newReading.timestamp}
        onChange={(e) =>
          setNewReading((prev) => ({ ...prev, timestamp: e.target.value }))
        }
      />
      <button onClick={handleAdd} className="add-button">
        <Plus size={16} />
        Добавить
      </button>
    </div>
  );
};

export default AddReadingForm;
