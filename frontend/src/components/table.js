import React, { useEffect, useState } from 'react';
import { fetchSensorData } from '../api';

export default function DataTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchSensorData().then(res => setRows(res.data));
  }, []);

  return (
    <table border="1">
      <thead>
        <tr>
          <th>ID</th>
          <th>Температура</th>
          <th>Влажность</th>
          <th>Давление</th>
          <th>Время</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.temperature}</td>
            <td>{row.humidity}</td>
            <td>{row.pressure}</td>
            <td>{row.timestamp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}