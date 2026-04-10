import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const HoldingsTable = ({ holdings }) => {
  // Calculate total value for percentage allocation
  const totalValue = holdings?.reduce((sum, h) => sum + (h.value_eur || 0), 0) || 0;

  const formatEUR = (value) => {
    return `€${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPrice = (value) => {
    // Show 4 decimal places for prices
    return `€${value.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    })}`;
  };

  const formatAmount = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const formatPercent = (value, total) => {
    if (total === 0) return '0.00%';
    const percent = (value / total) * 100;
    return `${percent.toFixed(2)}%`;
  };

  if (!holdings || holdings.length === 0) {
    return (
      <div className="empty-state" data-testid="holdings-empty">
        <span className="text-neon-cyan">[ NO HOLDINGS FOUND ]</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]" data-testid="holdings-table">
      <Table className="retro-table">
        <TableHeader>
          <TableRow>
            <TableHead className="font-pixel text-[10px] text-neon-cyan uppercase">Asset</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-cyan uppercase text-right">Amnt</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-cyan uppercase text-right">Price</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-cyan uppercase text-right">Value</TableHead>
            <TableHead className="font-pixel text-[10px] text-neon-amber uppercase text-right">Alloc</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding, index) => (
            <TableRow key={holding.id || index} data-testid={`holding-row-${index}`}>
              <TableCell className="font-mono">
                <div className="flex items-center gap-3">
                  <div className="asset-icon">
                    {holding.asset_code?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-lg text-foreground">{holding.asset_code}</div>
                    {holding.issuer && (
                      <div className="text-sm text-muted-foreground">{holding.issuer}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-terminal text-xl text-right text-foreground">
                {formatAmount(holding.amount)}
              </TableCell>
              <TableCell className="font-terminal text-xl text-right text-muted-foreground">
                {formatPrice(holding.price_eur)}
              </TableCell>
              <TableCell className="font-terminal text-xl text-right text-neon-green font-bold">
                {formatEUR(holding.value_eur)}
              </TableCell>
              <TableCell className="font-terminal text-xl text-right text-neon-amber font-bold">
                {formatPercent(holding.value_eur, totalValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default HoldingsTable;
