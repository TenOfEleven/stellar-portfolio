import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, Save, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SettingsPanel = ({ settings, onSettingsUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize input with current address
  useEffect(() => {
    if (settings?.stellar_address) {
      setAddressInput(settings.stellar_address);
    }
  }, [settings?.stellar_address]);

  const copyAddress = () => {
    if (settings?.stellar_address) {
      navigator.clipboard.writeText(settings.stellar_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateAddress = (address) => {
    if (!address || address.trim() === "") {
      return "Address cannot be empty";
    }
    if (!address.startsWith("G")) {
      return "Address must start with 'G'";
    }
    if (address.length !== 56) {
      return `Address must be 56 characters (currently ${address.length})`;
    }
    return "";
  };

  const handleAddressChange = (e) => {
    const value = e.target.value.toUpperCase();
    setAddressInput(value);
    setError("");
    setShowSuccess(false);
    
    // Only show validation errors after user has typed something substantial
    if (value.length > 0 && value.length < 56) {
      // Don't show error while typing
    } else if (value.length >= 56) {
      const validationError = validateAddress(value);
      if (validationError) {
        setError(validationError);
      }
    }
  };

  const handleSave = async () => {
    const validationError = validateAddress(addressInput);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await axios.put(`${API}/settings/address`, {
        stellar_address: addressInput.trim()
      });

      setShowSuccess(true);
      setIsEditing(false);
      
      toast.success("ADDRESS SAVED", {
        description: "Tracking address updated successfully",
        style: {
          background: '#0a0b10',
          border: '2px solid #39ff14',
          color: '#39ff14',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });

      // Trigger refresh of app data
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to save address";
      setError(errorMessage);
      toast.error("SAVE FAILED", {
        description: errorMessage,
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await axios.delete(`${API}/settings/address`);
      setAddressInput("");
      setError("");
      setShowSuccess(false);
      
      toast.success("ADDRESS CLEARED", {
        description: "Tracking address removed",
        style: {
          background: '#0a0b10',
          border: '2px solid #ffb000',
          color: '#ffb000',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });

      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (err) {
      toast.error("CLEAR FAILED", {
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isValidForSave = addressInput.trim().length === 56 && addressInput.startsWith("G") && !error;
  const hasExistingAddress = settings?.stellar_address && settings.stellar_address.length > 0;

  return (
    <div className="terminal-panel p-6 pt-10 mb-8" data-testid="settings-panel">
      <h2 className="section-header flex items-center gap-2">
        <span className="text-neon-pink">▸</span> SETTINGS
      </h2>
      
      <div className="space-y-4">
        {/* Stellar Address - Editable */}
        <div className="settings-row flex-col md:flex-row items-start md:items-center gap-4" data-testid="settings-address">
          <div className="flex-shrink-0">
            <div className="settings-label">STELLAR ADDRESS</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">
              Read-only tracking address. Secret keys are never stored.
            </div>
          </div>
          
          <div className="w-full md:w-auto md:flex-1 md:max-w-[500px]">
            {/* Address Input */}
            <div className="relative">
              <Input
                type="text"
                value={addressInput}
                onChange={handleAddressChange}
                placeholder="Paste your Stellar public address (G...)"
                className={`
                  font-mono text-sm md:text-base
                  bg-[#0a0b10] 
                  border-2 
                  ${error ? 'border-red-500/70 focus:border-red-500' : 'border-neon-cyan/30 focus:border-neon-cyan'}
                  ${showSuccess ? 'border-neon-green/70' : ''}
                  text-foreground 
                  placeholder:text-muted-foreground/50
                  h-12
                  pr-12
                  transition-all duration-200
                  focus:ring-2 focus:ring-neon-cyan/20 focus:shadow-[0_0_15px_rgba(0,243,255,0.3)]
                `}
                data-testid="stellar-address-input"
              />
              
              {/* Copy button inside input */}
              {hasExistingAddress && addressInput === settings.stellar_address && (
                <button 
                  onClick={copyAddress}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-neon-cyan/10 transition-colors rounded"
                  title="Copy address"
                  data-testid="copy-address-btn"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-neon-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-neon-cyan" />
                  )}
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm font-mono" data-testid="address-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {showSuccess && !error && (
              <div className="flex items-center gap-2 mt-2 text-neon-green text-sm font-mono" data-testid="address-success">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Tracking address saved</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                onClick={handleSave}
                disabled={!isValidForSave || isSaving || addressInput === settings?.stellar_address}
                className={`
                  font-pixel text-[10px] px-4 py-2 h-9
                  ${isValidForSave && addressInput !== settings?.stellar_address
                    ? 'bg-neon-green text-[#050505] hover:bg-neon-green/80' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'}
                  transition-all duration-200
                `}
                data-testid="save-address-btn"
              >
                <Save className="w-3 h-3 mr-2" />
                {isSaving ? "SAVING..." : "SAVE"}
              </Button>

              {hasExistingAddress && (
                <Button
                  onClick={handleClear}
                  disabled={isSaving}
                  variant="outline"
                  className="font-pixel text-[10px] px-4 py-2 h-9 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                  data-testid="clear-address-btn"
                >
                  <X className="w-3 h-3 mr-2" />
                  CLEAR
                </Button>
              )}

              {hasExistingAddress && addressInput === settings.stellar_address && (
                <span className="flex items-center gap-1 text-neon-green text-xs font-mono ml-2">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
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
        <div className="settings-row" data-testid="settings-darkmode">
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
        <div className="settings-row">
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
