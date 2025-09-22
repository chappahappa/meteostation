export interface SensorReading {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface ChartData {
  time_period: string;
  avg_temperature: number;
  avg_humidity: number;
  readings_count: number;
}

export interface StatsData {
  total_records: number;
  avg_temperature: number;
  avg_humidity: number;
  max_temperature: number;
  min_temperature: number;
  max_humidity: number;
  min_humidity: number;
  last_reading: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination: Pagination;
}
