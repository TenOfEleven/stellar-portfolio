import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LPPositionsTable = ({ positions, onRefresh }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState(null);
  const [newValueUSD, setNewValueUSD] = useState("");
  const [updating, setUpdating] = useState(false);

  const formatEUR = (value) => {
    return `€${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleEditClick = (position) => {
    setEditingPool(position);
    setNewValueUSD("");
    setEditDialogOpen(true);
  };

  const handleUpdateValue = async () => {
    if (!newValueUSD || isNaN(parseFloat(newValueUSD))) {
      toast.error("INVALID VALUE", {
        description: "Please enter a valid USD amount",
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
      return;
    }

    setUpdating(true);
    try {
      // Extract pool address from pool_id (remove the "..." at the end)
      const poolAddress = "CD65EROVLTDU2DWM4ZUJF4NHK4A46DX2UAOGCV7YDFPCSLFYNH57KGIY";
      
      await axios.put(`${API}/soroban-lps/${poolAddress}?user_value_usd=${parseFloat(newValueUSD)}`);
      
      toast.success("LP VALUE UPDATED", {
        description: `Aquarius LP set to $${newValueUSD}`,
        style: {
          background: '#0a0b10',
          border: '2px solid #39ff14',
          color: '#39ff14',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
      
      setEditDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating Soroban LP:", error);
      toast.error("UPDATE FAILED", {
        description: "Could not update LP value",
        style: {
          background: '#0a0b10',
          border: '2px solid #ff3131',
          color: '#ff3131',
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
        }
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!positions || positions.length === 0) {
    return (
      <div className="empty-state" data-testid="lp-empty">
        <span className="text-neon-pink">[ NO LP POSITIONS FOUND ]</span>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[400px]" data-testid="lp-table">
        <Table className="retro-table">
          <TableHeader>
            <TableRow>
              <TableHead className="font-pixel text-[10px] text-neon-pink uppercase">Pool</TableHead>
              <TableHead className="font-pixel text-[10px] text-neon-pink uppercase">Assets</TableHead>
              <TableHead className="font-pixel text-[10px] text-neon-pink uppercase text-right">Share</TableHead>
              <TableHead className="font-pixel text-[10px] text-neon-pink uppercase text-right">Value</TableHead>
              <TableHead className="font-pixel text-[10px] text-neon-pink uppercase text-center w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position, index) => (
              <TableRow key={position.id || index} data-testid={`lp-row-${index}`}>
                <TableCell className="font-mono">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground" title={position.pool_id}>
                      {position.pool_id}
                    </div>
                    {position.pool_type === 'soroban' && (
                      <span className="text-[10px] text-neon-green font-pixel">AQUARIUS</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-terminal text-xl">
                  <div className="flex items-center gap-2">
                    {(position.assets || []).map((asset, i) => (
                      <span key={i} className="inline-block">
                        <span className={i === 0 ? 'text-neon-cyan' : 'text-neon-amber'}>
                          {asset}
                        </span>
                        {i < position.assets.length - 1 && (
                          <span className="text-muted-foreground mx-1">/</span>
                        )}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-terminal text-xl text-right text-foreground">
                  {position.share_percentage?.toFixed(4)}%
                </TableCell>
                <TableCell className="font-terminal text-xl text-right text-neon-pink font-bold">
                  {formatEUR(position.value_eur)}
                </TableCell>
                <TableCell className="text-center">
                  {position.pool_type === 'soroban' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(position)}
                      className="h-8 w-8 p-0 hover:bg-neon-green/20"
                      title="Update LP Value"
                      data-testid="edit-soroban-lp-btn"
                    >
                      <Pencil className="h-4 w-4 text-neon-green" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Edit Soroban LP Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="terminal-panel border-2 border-neon-green/50 bg-[#0a0b10] max-w-md" data-testid="edit-lp-dialog">
          <DialogHeader className="pt-4">
            <DialogTitle className="font-pixel text-sm text-neon-green crt-glow">
              UPDATE AQUARIUS LP
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="font-pixel text-[10px] text-muted-foreground uppercase">
                Pool Assets
              </label>
              <div className="font-terminal text-xl text-foreground">
                {editingPool?.assets?.join(' / ')}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-pixel text-[10px] text-muted-foreground uppercase">
                Current Value (EUR)
              </label>
              <div className="font-terminal text-xl text-neon-pink">
                {editingPool && formatEUR(editingPool.value_eur)}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-pixel text-[10px] text-neon-green uppercase">
                New Value (USD) *
              </label>
              <p className="font-mono text-xs text-muted-foreground mb-2">
                Enter the "Pooled" USD value from Aquarius app
              </p>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 38.64"
                value={newValueUSD}
                onChange={(e) => setNewValueUSD(e.target.value)}
                className="font-terminal text-xl bg-[#111] border-neon-green/50 focus:border-neon-green text-foreground"
                data-testid="new-lp-value-input"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="font-pixel text-[10px] border-muted-foreground text-muted-foreground hover:bg-muted"
              >
                CANCEL
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdateValue}
              disabled={updating}
              className="font-pixel text-[10px] bg-neon-green text-[#050505] hover:bg-neon-green/80"
              data-testid="save-lp-value-btn"
            >
              {updating ? "UPDATING..." : "UPDATE VALUE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LPPositionsTable;
