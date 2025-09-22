// components/StatsGrid.tsx
import React from "react";
import { Thermometer, Droplets, LibraryBig } from "lucide-react";
import { useSensor } from "../contexts/SensorContext";

const StatsGrid: React.FC = () => {
  const { stats } = useSensor();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  if (!stats) return null;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <Thermometer className="stat-icon" />
        <h3>Температура</h3>
        <div className="stat-value">{stats.avg_temperature?.toFixed(1)}°C</div>
        <div className="stat-range">
          {stats.min_temperature?.toFixed(1)}°C -{" "}
          {stats.max_temperature?.toFixed(1)}°C
        </div>
      </div>

      <div className="stat-card">
        <Droplets className="stat-icon" />
        <h3>Влажность</h3>
        <div className="stat-value">{stats.avg_humidity?.toFixed(1)}%</div>
        <div className="stat-range">
          {stats.min_humidity?.toFixed(1)}% - {stats.max_humidity?.toFixed(1)}%
        </div>
      </div>

      <div className="stat-card">
        <LibraryBig className="stat-icon" />
        <h3>Всего записей</h3>
        <div className="stat-value">{stats.total_records}</div>
        <div className="stat-subtext">
          Последняя:{" "}
          {stats.last_reading ? formatDate(stats.last_reading) : "Нет данных"}
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
