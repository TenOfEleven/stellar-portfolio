import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const LPPositionsTable = ({ positions }) => {
  const formatEUR = (value) => {
    return `€${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (!positions || positions.length === 0) {
    return (
      <div className="empty-state" data-testid="lp-empty">
        <span className="text-neon-pink">[ NO LP POSITIONS FOUND ]</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]" data-testid="lp-table">
      <Table className="retro-table">
        <TableHeader>
          <TableRow>
            <TableHead className="font-pixel text-[10px] text-neon-pink uppercase">Pool</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-pink uppercase">Assets</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-pink uppercase text-right">Share</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-pink uppercase text-right">Value</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default LPPositionsTable;
