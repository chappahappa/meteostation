// components/SensorDashboard.tsx
import React from "react";
import { SensorProvider, useSensor } from "../contexts/SensorContext";
import DashboardHeader from "./DashboardHeader";
import StatsGrid from "./StatsGrid";
import SensorChart from "./SensorChart";
import AddReadingForm from "./AddReadingForm";
import ReadingsTable from "./ReadingsTable";

const SensorDashboardContent: React.FC = () => {
  const { loading, readings } = useSensor();

  if (loading && readings.length === 0) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="sensor-dashboard">
      <DashboardHeader />
      <StatsGrid />
      <SensorChart />
      <AddReadingForm />
      <ReadingsTable />
    </div>
  );
};

const SensorDashboard: React.FC = () => {
  return (
    <SensorProvider>
      <SensorDashboardContent />
    </SensorProvider>
  );
};

export default SensorDashboard;

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { SensorReading, ChartData, StatsData } from "../types";
// import { sensorApi } from "../api";
// import {
//   Edit3,
//   Trash2,
//   Plus,
//   Thermometer,
//   Droplets,
//   Calendar,
//   Clock,
// } from "lucide-react";

// const SensorDashboard: React.FC = () => {
//   const [period, setPeriod] = useState<
//     "hour" | "day" | "week" | "month" | "all"
//   >("day");
//   const [chartData, setChartData] = useState<ChartData[]>([]);
//   const [stats, setStats] = useState<StatsData | null>(null);
//   const [readings, setReadings] = useState<SensorReading[]>([]);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 50,
//     total: 0,
//     pages: 1,
//   });
//   const [loading, setLoading] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [newReading, setNewReading] = useState({
//     temperature: "",
//     humidity: "",
//     timestamp: "",
//   });

//   // Загрузка данных
//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [chartResponse, statsResponse, dataResponse] = await Promise.all([
//         sensorApi.getChartData(period, period === "hour" ? "minute" : "hour"),
//         sensorApi.getStats(period),
//         sensorApi.getData(period, 1, 50),
//       ]);

//       setChartData(chartResponse);
//       setStats(statsResponse);
//       setReadings(dataResponse.data);
//       setPagination(dataResponse.pagination);
//     } catch (error) {
//       console.error("Error loading data:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [period]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // Загрузка дополнительных данных
//   const loadMoreData = async () => {
//     if (pagination.page >= pagination.pages) return;

//     try {
//       const response = await sensorApi.getData(
//         period,
//         pagination.page + 1,
//         pagination.limit
//       );
//       setReadings((prev) => [...prev, ...response.data]);
//       setPagination(response.pagination);
//     } catch (error) {
//       console.error("Error loading more data:", error);
//     }
//   };

//   // Обновление записи
//   const handleUpdate = async (
//     id: number,
//     field: keyof SensorReading,
//     value: string
//   ) => {
//     try {
//       const numericValue =
//         field === "temperature" || field === "humidity"
//           ? parseFloat(value)
//           : value;
//       await sensorApi.updateReading(id, { [field]: numericValue });
//       setReadings((prev) =>
//         prev.map((item) =>
//           item.id === id ? { ...item, [field]: numericValue } : item
//         )
//       );
//       setEditingId(null);
//       await loadData(); // Перезагружаем для обновления статистики
//     } catch (error) {
//       console.error("Error updating reading:", error);
//     }
//   };

//   // Удаление записи
//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;

//     try {
//       await sensorApi.deleteReading(id);
//       setReadings((prev) => prev.filter((item) => item.id !== id));
//       await loadData(); // Перезагружаем для обновления статистики
//     } catch (error) {
//       console.error("Error deleting reading:", error);
//     }
//   };

//   // Добавление новой записи
//   const handleAdd = async () => {
//     if (!newReading.temperature || !newReading.humidity) return;

//     try {
//       const data = {
//         temperature: parseFloat(newReading.temperature),
//         humidity: parseFloat(newReading.humidity),
//         timestamp: newReading.timestamp || undefined,
//       };

//       await sensorApi.createReading(data);
//       setNewReading({ temperature: "", humidity: "", timestamp: "" });
//       await loadData(); // Перезагружаем все данные
//     } catch (error) {
//       console.error("Error adding reading:", error);
//     }
//   };

//   // Форматирование даты
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleString("ru-RU");
//   };

//   if (loading && readings.length === 0) {
//     return <div className="loading">Загрузка данных...</div>;
//   }

//   return (
//     <div className="sensor-dashboard">
//       {/* Заголовок и переключатель периода */}
//       <div className="dashboard-header">
//         <h1>Мониторинг температуры и влажности</h1>
//         <div className="period-selector">
//           {(["hour", "day", "week", "month", "all"] as const).map((p) => (
//             <button
//               key={p}
//               className={period === p ? "active" : ""}
//               onClick={() => setPeriod(p)}
//             >
//               {p === "hour" && <Clock size={16} />}
//               {p === "day" && <Calendar size={16} />}
//               {p === "week" && "Неделя"}
//               {p === "month" && "Месяц"}
//               {p === "all" && "Все"}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Статистика */}
//       {stats && (
//         <div className="stats-grid">
//           <div className="stat-card">
//             <Thermometer className="stat-icon" />
//             <h3>Температура</h3>
//             <div className="stat-value">
//               {stats.avg_temperature?.toFixed(1)}°C
//             </div>
//             <div className="stat-range">
//               {stats.min_temperature?.toFixed(1)}°C -{" "}
//               {stats.max_temperature?.toFixed(1)}°C
//             </div>
//           </div>

//           <div className="stat-card">
//             <Droplets className="stat-icon" />
//             <h3>Влажность</h3>
//             <div className="stat-value">{stats.avg_humidity?.toFixed(1)}%</div>
//             <div className="stat-range">
//               {stats.min_humidity?.toFixed(1)}% -{" "}
//               {stats.max_humidity?.toFixed(1)}%
//             </div>
//           </div>

//           <div className="stat-card">
//             <div className="stat-value">{stats.total_records}</div>
//             <h3>Всего записей</h3>
//             <div className="stat-subtext">
//               Последняя:{" "}
//               {stats.last_reading
//                 ? formatDate(stats.last_reading)
//                 : "Нет данных"}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* График */}
//       <div className="chart-container">
//         <h2>График изменений</h2>
//         <ResponsiveContainer width="100%" height={400}>
//           <LineChart data={chartData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis
//               dataKey="time_period"
//               tickFormatter={(value) => {
//                 const date = new Date(value);
//                 return period === "hour"
//                   ? date.toLocaleTimeString("ru-RU", {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })
//                   : date.toLocaleDateString("ru-RU");
//               }}
//             />
//             <YAxis yAxisId="left" />
//             <YAxis yAxisId="right" orientation="right" />
//             <Tooltip
//               formatter={(value: number, name: string) => [
//                 value.toFixed(1),
//                 name === "avg_temperature" ? "Температура" : "Влажность",
//               ]}
//               labelFormatter={(label) => formatDate(label)}
//             />
//             <Legend />
//             <Line
//               yAxisId="left"
//               type="monotone"
//               dataKey="avg_temperature"
//               stroke="#ff7300"
//               strokeWidth={2}
//               name="Температура (°C)"
//               dot={false}
//             />
//             <Line
//               yAxisId="right"
//               type="monotone"
//               dataKey="avg_humidity"
//               stroke="#387908"
//               strokeWidth={2}
//               name="Влажность (%)"
//               dot={false}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Таблица данных */}
//       <div className="data-table-container">
//         <h2>Таблица данных</h2>

//         {/* Форма добавления */}
//         <div className="add-row">
//           <input
//             type="number"
//             step="0.1"
//             placeholder="Температура"
//             value={newReading.temperature}
//             onChange={(e) =>
//               setNewReading((prev) => ({
//                 ...prev,
//                 temperature: e.target.value,
//               }))
//             }
//           />
//           <input
//             type="number"
//             step="0.1"
//             placeholder="Влажность"
//             value={newReading.humidity}
//             onChange={(e) =>
//               setNewReading((prev) => ({ ...prev, humidity: e.target.value }))
//             }
//           />
//           <input
//             type="datetime-local"
//             placeholder="Дата и время"
//             value={newReading.timestamp}
//             onChange={(e) =>
//               setNewReading((prev) => ({ ...prev, timestamp: e.target.value }))
//             }
//           />
//           <button onClick={handleAdd} className="add-button">
//             <Plus size={16} />
//             Добавить
//           </button>
//         </div>

//         <div className="table-wrapper">
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>Температура (°C)</th>
//                 <th>Влажность (%)</th>
//                 <th>Дата и время</th>
//                 <th>Действия</th>
//               </tr>
//             </thead>
//             <tbody>
//               {readings.map((reading) => (
//                 <tr key={reading.id}>
//                   <td>{reading.id}</td>
//                   <td>
//                     {editingId === reading.id ? (
//                       <input
//                         type="number"
//                         step="0.1"
//                         value={reading.temperature}
//                         onChange={(e) =>
//                           handleUpdate(
//                             reading.id,
//                             "temperature",
//                             e.target.value
//                           )
//                         }
//                         onBlur={() => setEditingId(null)}
//                         autoFocus
//                       />
//                     ) : (
//                       <span onClick={() => setEditingId(reading.id)}>
//                         {reading.temperature}°C
//                       </span>
//                     )}
//                   </td>
//                   <td>
//                     {editingId === reading.id ? (
//                       <input
//                         type="number"
//                         step="0.1"
//                         value={reading.humidity}
//                         onChange={(e) =>
//                           handleUpdate(reading.id, "humidity", e.target.value)
//                         }
//                         onBlur={() => setEditingId(null)}
//                       />
//                     ) : (
//                       <span onClick={() => setEditingId(reading.id)}>
//                         {reading.humidity}%
//                       </span>
//                     )}
//                   </td>
//                   <td>{formatDate(reading.timestamp)}</td>
//                   <td>
//                     <div className="action-buttons">
//                       <button
//                         onClick={() => setEditingId(reading.id)}
//                         className="edit-btn"
//                         title="Редактировать"
//                       >
//                         <Edit3 size={14} />
//                       </button>
//                       <button
//                         onClick={() => handleDelete(reading.id)}
//                         className="delete-btn"
//                         title="Удалить"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Пагинация/подгрузка */}
//         {pagination.page < pagination.pages && (
//           <div className="load-more">
//             <button onClick={loadMoreData} disabled={loading}>
//               {loading
//                 ? "Загрузка..."
//                 : `Загрузить еще (${
//                     pagination.total - readings.length
//                   } осталось)`}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SensorDashboard;
