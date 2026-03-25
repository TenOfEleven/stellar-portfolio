import { useState } from "react";
import { RefreshCw, Download, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import HoldingsTable from "./HoldingsTable";
import LPPositionsTable from "./LPPositionsTable";
import HistoryChart from "./HistoryChart";
import SettingsPanel from "./SettingsPanel";

const Dashboard = ({ 
  portfolio, 
  history, 
  settings, 
  loading, 
  refreshing, 
  error, 
  onRefresh, 
  onExport 
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const formatEUR = (value) => {
    if (value === undefined || value === null) return "€0.00";
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-screen">
        <div className="text-center">
          <div className="font-pixel text-neon-cyan text-lg crt-glow mb-4 loading-pulse">
            LOADING...
          </div>
          <div className="font-terminal text-2xl text-muted-foreground">
            Connecting to Stellar Network
          </div>
        </div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="error-screen">
        <div className="text-center">
          <div className="font-pixel text-red-500 text-lg crt-glow mb-4">
            ERROR
          </div>
          <div className="font-terminal text-2xl text-muted-foreground mb-6">
            {error}
          </div>
          <Button 
            onClick={onRefresh}
            className="retro-btn text-xs px-6 py-3"
            data-testid="retry-btn"
          >
            RETRY
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-grid p-4 md:p-8" data-testid="dashboard">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-pixel text-sm md:text-base text-neon-cyan crt-glow tracking-wider mb-2">
              STELLAR TRACKER
            </h1>
            <div className="flex items-center gap-3">
              <div className="status-dot" />
              <span className="font-terminal text-lg text-muted-foreground">
                MAINNET CONNECTED
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onRefresh}
              disabled={refreshing}
              className="retro-btn text-xs px-4 py-2 flex items-center gap-2"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'refreshing' : ''}`} />
              {refreshing ? "SYNCING" : "REFRESH"}
            </Button>
            
            <Button 
              onClick={onExport}
              className="retro-btn text-xs px-4 py-2 flex items-center gap-2"
              style={{ borderColor: '#39ff14', color: '#39ff14' }}
              data-testid="export-btn"
            >
              <Download className="w-4 h-4" />
              EXPORT
            </Button>
            
            <Button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="retro-btn text-xs px-4 py-2"
              style={{ borderColor: '#ff0099', color: '#ff0099' }}
              data-testid="settings-toggle-btn"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleContent>
          <SettingsPanel settings={settings} />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Value Display */}
      <section className="mb-8" data-testid="portfolio-summary">
        <div className="terminal-panel p-8 pt-10">
          <div className="text-center mb-8">
            <div className="stat-label mb-4">TOTAL PORTFOLIO VALUE</div>
            <div className="big-value" data-testid="total-value">
              {formatEUR(portfolio?.total_value_eur)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card" data-testid="spot-value-card">
              <div className="stat-label">SPOT HOLDINGS</div>
              <div className="stat-value text-neon-cyan">
                {formatEUR(portfolio?.spot_value_eur)}
              </div>
            </div>
            
            <div className="stat-card" data-testid="lp-value-card">
              <div className="stat-label">LP POSITIONS</div>
              <div className="stat-value text-neon-pink">
                {formatEUR(portfolio?.lp_value_eur)}
              </div>
            </div>
            
            <div className="stat-card" data-testid="address-card">
              <div className="stat-label">WALLET ADDRESS</div>
              <div className="stat-value text-neon-amber text-lg" title={portfolio?.stellar_address}>
                {formatAddress(portfolio?.stellar_address)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History Chart */}
      <section className="mb-8" data-testid="history-section">
        <HistoryChart history={history} />
      </section>

      {/* Holdings & LP Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Table */}
        <section data-testid="holdings-section">
          <div className="terminal-panel p-6 pt-10">
            <h2 className="section-header flex items-center gap-2">
              <span className="text-neon-cyan">▸</span> SPOT HOLDINGS
              <span className="ml-auto font-terminal text-lg text-muted-foreground">
                ({portfolio?.holdings?.length || 0} ASSETS)
              </span>
            </h2>
            <HoldingsTable holdings={portfolio?.holdings || []} />
          </div>
        </section>

        {/* LP Positions Table */}
        <section data-testid="lp-section">
          <div className="terminal-panel p-6 pt-10">
            <h2 className="section-header flex items-center gap-2">
              <span className="text-neon-pink">▸</span> LP POSITIONS
              <span className="ml-auto font-terminal text-lg text-muted-foreground">
                ({portfolio?.lp_positions?.length || 0} POOLS)
              </span>
            </h2>
            <LPPositionsTable positions={portfolio?.lp_positions || []} />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <div className="font-terminal text-lg text-muted-foreground">
          LAST UPDATED: {portfolio?.last_updated ? new Date(portfolio.last_updated).toLocaleString() : 'N/A'}
        </div>
        <div className="font-pixel text-[8px] text-neon-cyan/50 mt-2 tracking-widest">
          READ-ONLY // STELLAR MAINNET // EUR
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
