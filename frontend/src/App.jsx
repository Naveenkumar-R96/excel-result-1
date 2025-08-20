/* import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("Checking result status...");
  const [lastCheck, setLastCheck] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("http://localhost:3001");
      setMessage("Backend is running. Result checker active.");
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      setMessage("Backend not responding...");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // check every 1 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "5rem" }}>
      <h1>🎓 Result Checker Dashboard</h1>
      <p>Status: {message}</p>
      <p>Last Checked: {lastCheck}</p>
      <button onClick={fetchStatus}>Check Now</button>
    </div>
  );
}

export default App;
  */


// frontend/src/App.jsx
import React from "react";
import UserForm from "./components/UserForm";
import Home from "./components/Home";

const App = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
   <Home/>
  </div>
);

export default App;
