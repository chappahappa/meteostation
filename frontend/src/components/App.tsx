import React from "react";
import "../styles/App.css";
import "../styles/SensorDashboard.css";
import SensorDashboard from "./SensorDashboard";

const App: React.FC = () => {
  return (
    <div className="App">
      <SensorDashboard />
    </div>
  );
};

export default App;
