import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";

const HistoryChart = ({ history }) => {
  const [viewMode, setViewMode] = useState('total'); // total, spot, lp

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    return history.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      date: new Date(snapshot.timestamp).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short' 
      }),
      total: snapshot.total_value_eur || 0,
      spot: snapshot.spot_value_eur || 0,
      lp: snapshot.lp_value_eur || 0
    }));
  }, [history]);

  const formatEUR = (value) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
    return `€${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="terminal-panel p-4 pt-6 border-2 border-neon-cyan/50" style={{ background: '#0a0b10' }}>
          <div className="font-pixel text-[8px] text-neon-cyan mb-2">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="font-terminal text-lg" style={{ color: entry.color }}>
              {entry.name.toUpperCase()}: €{entry.value.toFixed(2)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!history || history.length === 0) {
    return (
      <div className="terminal-panel p-6 pt-10">
        <h2 className="section-header flex items-center gap-2">
          <span className="text-neon-amber">▸</span> PORTFOLIO HISTORY
        </h2>
        <div className="empty-state" data-testid="history-empty">
          <span className="text-neon-amber">[ NO HISTORY DATA YET ]</span>
          <div className="mt-2 text-muted-foreground">
            Historical data will appear after the first daily snapshot
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel p-6 pt-10" data-testid="history-chart">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="section-header mb-4 md:mb-0 border-b-0">
          <span className="text-neon-amber">▸</span> PORTFOLIO HISTORY
        </h2>
        
        <div className="flex gap-2" data-testid="chart-toggles">
          <Button
            onClick={() => setViewMode('total')}
            className={`toggle-btn ${viewMode === 'total' ? 'active' : ''}`}
            data-testid="toggle-total"
          >
            Total
          </Button>
          <Button
            onClick={() => setViewMode('spot')}
            className={`toggle-btn ${viewMode === 'spot' ? 'active' : ''}`}
            style={viewMode === 'spot' ? { background: '#00f3ff', borderColor: '#00f3ff' } : { borderColor: '#00f3ff' }}
            data-testid="toggle-spot"
          >
            Spot
          </Button>
          <Button
            onClick={() => setViewMode('lp')}
            className={`toggle-btn ${viewMode === 'lp' ? 'active' : ''}`}
            style={viewMode === 'lp' ? { background: '#ff0099', borderColor: '#ff0099' } : { borderColor: '#ff0099' }}
            data-testid="toggle-lp"
          >
            LP
          </Button>
          <Button
            onClick={() => setViewMode('all')}
            className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
            style={viewMode === 'all' ? { background: '#39ff14', borderColor: '#39ff14' } : { borderColor: '#39ff14' }}
            data-testid="toggle-all"
          >
            All
          </Button>
        </div>
      </div>

      <div className="h-[300px] md:h-[400px]" style={{ minWidth: '200px', minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#858585"
              tick={{ fill: '#858585', fontFamily: 'VT323', fontSize: 16 }}
              axisLine={{ stroke: '#333' }}
            />
            <YAxis 
              tickFormatter={formatEUR}
              stroke="#858585"
              tick={{ fill: '#858585', fontFamily: 'VT323', fontSize: 16 }}
              axisLine={{ stroke: '#333' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {(viewMode === 'total' || viewMode === 'all') && (
              <Line
                type="stepAfter"
                dataKey="total"
                name="Total"
                stroke="#ffb000"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ffb000' }}
              />
            )}
            
            {(viewMode === 'spot' || viewMode === 'all') && (
              <Line
                type="stepAfter"
                dataKey="spot"
                name="Spot"
                stroke="#00f3ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#00f3ff' }}
              />
            )}
            
            {(viewMode === 'lp' || viewMode === 'all') && (
              <Line
                type="stepAfter"
                dataKey="lp"
                name="LP"
                stroke="#ff0099"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ff0099' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;
