import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/portfolio`);
      setPortfolio(response.data);
      setError(null);
    } catch (e) {
      console.error("Error fetching portfolio:", e);
      setError("Failed to fetch portfolio data");
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/history?days=30`);
      setHistory(response.data.snapshots || []);
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/refresh`);
      setPortfolio(response.data.portfolio);
      await fetchHistory();
      toast.success("PORTFOLIO REFRESHED", {
        description: "Data synced from Stellar network",
        style: {
          background: '#0a0b10',
          border: '2px solid #39ff14',
          color: '#39ff14',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } catch (e) {
      console.error("Error refreshing:", e);
      toast.error("REFRESH FAILED", {
        description: "Could not sync with Stellar network",
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stellar_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("EXPORT COMPLETE", {
        description: "CSV file downloaded",
        style: {
          background: '#0a0b10',
          border: '2px solid #39ff14',
          color: '#39ff14',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } catch (e) {
      console.error("Error exporting:", e);
      toast.error("EXPORT FAILED", {
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPortfolio(),
        fetchHistory(),
        fetchSettings()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPortfolio, fetchHistory, fetchSettings]);

  return (
    <div className="App min-h-screen bg-[#050505]">
      {/* Scanline overlay */}
      <div className="scanlines" />
      
      {/* Header gradient bar */}
      <div className="header-bar" />
      
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                portfolio={portfolio}
                history={history}
                settings={settings}
                loading={loading}
                refreshing={refreshing}
                error={error}
                onRefresh={handleRefresh}
                onExport={handleExport}
              />
            } 
          />
        </Routes>
      </BrowserRouter>
      
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
