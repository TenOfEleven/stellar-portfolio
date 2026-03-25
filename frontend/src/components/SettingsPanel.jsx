import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const SettingsPanel = ({ settings }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (settings?.stellar_address) {
      navigator.clipboard.writeText(settings.stellar_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="terminal-panel p-6 pt-10 mb-8" data-testid="settings-panel">
      <h2 className="section-header flex items-center gap-2">
        <span className="text-neon-pink">▸</span> SETTINGS
      </h2>
      
      <div className="space-y-4">
        {/* Stellar Address */}
        <div className="settings-row" data-testid="settings-address">
          <div>
            <div className="settings-label">STELLAR ADDRESS</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">Read-only tracking address</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="address-display max-w-[300px] truncate" title={settings?.stellar_address}>
              {settings?.stellar_address || 'Not configured'}
            </div>
            <button 
              onClick={copyAddress}
              className="p-2 hover:bg-neon-cyan/10 transition-colors"
              title="Copy address"
              data-testid="copy-address-btn"
            >
              {copied ? (
                <Check className="w-4 h-4 text-neon-green" />
              ) : (
                <Copy className="w-4 h-4 text-neon-cyan" />
              )}
            </button>
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="settings-row" data-testid="settings-refresh">
          <div>
            <div className="settings-label">REFRESH INTERVAL</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">Automatic data sync frequency</div>
          </div>
          <div className="font-terminal text-xl text-neon-cyan">
            {settings?.refresh_interval_hours || 24} HOURS
          </div>
        </div>

        {/* Dark Mode */}
        <div className="settings-row border-b-0" data-testid="settings-darkmode">
          <div>
            <div className="settings-label">DARK MODE</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">CRT aesthetic (always on)</div>
          </div>
          <Switch 
            checked={settings?.dark_mode ?? true} 
            disabled={true}
            className="data-[state=checked]:bg-neon-cyan"
            data-testid="darkmode-switch"
          />
        </div>

        {/* Network */}
        <div className="settings-row border-b-0">
          <div>
            <div className="settings-label">NETWORK</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">Stellar blockchain network</div>
          </div>
          <div className="font-terminal text-xl text-neon-green flex items-center gap-2">
            <div className="status-dot" />
            MAINNET
          </div>
        </div>

        {/* Currency */}
        <div className="settings-row border-b-0">
          <div>
            <div className="settings-label">DISPLAY CURRENCY</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">All values displayed in</div>
          </div>
          <div className="font-terminal text-xl text-neon-amber">
            EUR (€)
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
