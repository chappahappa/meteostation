import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchSensorData } from '../api';

export default function SensorChart() {
const [chartData, setChartData] = useState({
  labels: [],
  datasets: []
});
  useEffect(() => {
    fetchSensorData().then(res => {
      const data = res.data.reverse();
      setChartData({
        labels: data.map(d => d.timestamp),
        datasets: [
          {
            label: 'Температура',
            data: data.map(d => d.temperature),
            borderColor: 'red',
            fill: false
          },
          {
            label: 'Влажность',
            data: data.map(d => d.humidity),
            borderColor: 'blue',
            fill: false
          },
          {
            label: 'Давление',
            data: data.map(d => d.pressure),
            borderColor: 'green',
            fill: false
          }
        ]
      });
    });
  }, []);

  return <Line data={chartData} />;
}