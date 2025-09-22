import axios from "axios";
import { SensorReading, ChartData, StatsData, ApiResponse } from "../types";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const sensorApi = {
  // Получение данных с пагинацией
  getData: (
    period: string = "all",
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<SensorReading[]>> =>
    api
      .get(`/data?period=${period}&page=${page}&limit=${limit}`)
      .then((res) => res.data),

  // Получение данных для графика
  getChartData: (
    period: string = "day",
    aggregate: string = "hour"
  ): Promise<ChartData[]> =>
    api
      .get(`/data/chart?period=${period}&aggregate=${aggregate}`)
      .then((res) => res.data),

  // Получение статистики
  getStats: (period?: string): Promise<StatsData> =>
    api
      .get(period ? `/stats?period=${period}` : "/stats")
      .then((res) => res.data),

  // Добавление новой записи
  createReading: (data: {
    temperature: number;
    humidity: number;
    timestamp?: string;
  }): Promise<SensorReading> => api.post("/data", data).then((res) => res.data),

  // Обновление записи
  updateReading: (
    id: number,
    data: Partial<SensorReading>
  ): Promise<SensorReading> =>
    api.put(`/data/${id}`, data).then((res) => res.data),

  // Удаление записи
  deleteReading: (id: number): Promise<void> =>
    api.delete(`/data/${id}`).then((res) => res.data),
};
