// contexts/SensorContext.tsx
import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { SensorReading, ChartData, StatsData } from "../types";
import { sensorApi } from "../api";

interface SensorContextType {
  period: "hour" | "day" | "week" | "month" | "all";
  setPeriod: (period: "hour" | "day" | "week" | "month" | "all") => void;
  chartData: ChartData[];
  stats: StatsData | null;
  readings: SensorReading[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loading: boolean;
  loadData: () => Promise<void>;
  loadMoreData: () => Promise<void>;
  updateReading: (
    id: number,
    field: keyof SensorReading,
    value: string
  ) => Promise<void>;
  deleteReading: (id: number) => Promise<void>;
  addReading: (data: {
    temperature: string;
    humidity: string;
    timestamp: string;
  }) => Promise<void>;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [period, setPeriod] = useState<
    "hour" | "day" | "week" | "month" | "all"
  >("day");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chartResponse, statsResponse, dataResponse] = await Promise.all([
        sensorApi.getChartData(period, period === "hour" ? "minute" : "hour"),
        sensorApi.getStats(period),
        sensorApi.getData(period, 1, 50),
      ]);

      setChartData(chartResponse);
      setStats(statsResponse);
      setReadings(dataResponse.data);
      setPagination(dataResponse.pagination);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadMoreData = async () => {
    if (pagination.page >= pagination.pages) return;

    try {
      const response = await sensorApi.getData(
        period,
        pagination.page + 1,
        pagination.limit
      );
      setReadings((prev) => [...prev, ...response.data]);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error loading more data:", error);
    }
  };

  const updateReading = async (
    id: number,
    field: keyof SensorReading,
    value: string
  ) => {
    try {
      const numericValue =
        field === "temperature" || field === "humidity"
          ? parseFloat(value)
          : value;
      await sensorApi.updateReading(id, { [field]: numericValue });
      setReadings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: numericValue } : item
        )
      );
      await loadData();
    } catch (error) {
      console.error("Error updating reading:", error);
    }
  };

  const deleteReading = async (id: number) => {
    try {
      await sensorApi.deleteReading(id);
      setReadings((prev) => prev.filter((item) => item.id !== id));
      await loadData();
    } catch (error) {
      console.error("Error deleting reading:", error);
    }
  };

  const addReading = async (data: {
    temperature: string;
    humidity: string;
    timestamp: string;
  }) => {
    if (!data.temperature || !data.humidity) return;

    try {
      const readingData = {
        temperature: parseFloat(data.temperature),
        humidity: parseFloat(data.humidity),
        timestamp: data.timestamp || undefined,
      };

      await sensorApi.createReading(readingData);
      await loadData();
    } catch (error) {
      console.error("Error adding reading:", error);
    }
  };

  // Автоматическое обновление данных каждые 20 секунд
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 20000);

    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <SensorContext.Provider
      value={{
        period,
        setPeriod,
        chartData,
        stats,
        readings,
        pagination,
        loading,
        loadData,
        loadMoreData,
        updateReading,
        deleteReading,
        addReading,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return context;
};
