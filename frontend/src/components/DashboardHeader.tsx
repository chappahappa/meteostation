// components/DashboardHeader.tsx
import React from "react";
import { Calendar, Clock } from "lucide-react";
import { useSensor } from "../contexts/SensorContext";

const DashboardHeader: React.FC = () => {
  const { period, setPeriod } = useSensor();

  const periodLabels = {
    hour: { label: "Час" },
    day: { label: "День" },
    week: { label: "Неделя" },
    month: { label: "Месяц" },
    all: { label: "Все" },
  };

  return (
    <div className="dashboard-header">
      <h1>Мониторинг температуры и влажности</h1>
      <div className="period-selector">
        {(["hour", "day", "week", "month", "all"] as const).map((p) => (
          <button
            key={p}
            className={period === p ? "active" : ""}
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p].label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
