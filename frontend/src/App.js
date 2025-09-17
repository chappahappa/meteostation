// App.js
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ temperature: "", humidity: "", pressure: "" });

  // Получаем данные с сервера
  const fetchData = async () => {
    const res = await axios.get("http://localhost:2000/api/sensor");
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Добавить новое измерение
  const handleAdd = async () => {
    await axios.post("http://localhost:2000/api/sensor", form);
    setForm({ temperature: "", humidity: "", pressure: "" });
    fetchData();
  };

  // Удалить измерение
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:2000/api/sensor/${id}`);
    fetchData();
  };

  // Обновить измерение
  const handleUpdate = async (id, temperature, humidity, pressure) => {
    await axios.put(`http://localhost:2000/api/sensor/${id}`, { temperature, humidity, pressure });
    fetchData();
  };

  return (
    <div>
      <h1>Sensor Data</h1>
      <div>
        <input type="number" placeholder="Temperature" value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} />
        <input type="number" placeholder="Humidity" value={form.humidity} onChange={e => setForm({...form, humidity: e.target.value})} />
        <input type="number" placeholder="Pressure" value={form.pressure} onChange={e => setForm({...form, pressure: e.target.value})} />
        <button onClick={handleAdd}>Add</button>
      </div>

      <table border="1" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Temp</th>
            <th>Humidity</th>
            <th>Pressure</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                <input defaultValue={item.temperature} onBlur={e => handleUpdate(item.id, e.target.value, item.humidity, item.pressure)} />
              </td>
              <td>
                <input defaultValue={item.humidity} onBlur={e => handleUpdate(item.id, item.temperature, e.target.value, item.pressure)} />
              </td>
              <td>
                <input defaultValue={item.pressure} onBlur={e => handleUpdate(item.id, item.temperature, item.humidity, e.target.value)} />
              </td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}