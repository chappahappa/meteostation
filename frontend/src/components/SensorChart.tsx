// components/SensorChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSensor } from "../contexts/SensorContext";

const SensorChart: React.FC = () => {
  const { chartData, period } = useSensor();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  return (
    <div className="chart-container">
      <h2>График изменений</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time_period"
            tickFormatter={(value) => {
              const date = new Date(value);
              return period === "hour"
                ? date.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : date.toLocaleDateString("ru-RU");
            }}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toFixed(1),
              name,
            ]}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avg_temperature"
            stroke="#ff7300"
            strokeWidth={2}
            name="Температура (°C)"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avg_humidity"
            stroke="#387908"
            strokeWidth={2}
            name="Влажность (%)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;
