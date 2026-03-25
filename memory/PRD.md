# Stellar Portfolio Tracker - PRD

## Original Problem Statement
Build a Stellar Portfolio Tracker webapp that:
- Works on Stellar mainnet only
- Tracks ONE fixed Stellar address (GDXM3CF32QXZMY74YT7OQSXX5NHXQ7JOU5XINSAA6NLBNZNCNQ3FDOAB)
- Is strictly read-only (no signing, no transactions, no private keys)
- Shows wallet balances, LP positions, asset values in EUR, price feeds, historical portfolio growth
- Uses 80's/90's 16-bit retro style UI
- Uses MongoDB for persistence, Recharts for charts

## User Personas
- **Primary**: Crypto investor tracking their Stellar wallet holdings
- **Use Case**: Daily monitoring of portfolio value, holdings breakdown, LP positions

## Core Requirements (Static)
- Read-only portfolio tracking (no write operations)
- EUR-only valuations
- Stellar mainnet only
- Public API integrations (Horizon, CoinGecko with fallback)
- Daily snapshots for historical tracking

## Architecture
- **Frontend**: React 19 + Recharts + shadcn/ui + Tailwind CSS
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **APIs**: Stellar Horizon (mainnet), CoinGecko (prices), CoinCap (fallback)
- **Styling**: 80's/90's 16-bit retro theme with CRT effects, neon colors, pixel fonts

## What's Been Implemented (March 25, 2026)

### Backend (/app/backend/server.py)
- [x] GET /api/portfolio - Returns total value, holdings, LP positions
- [x] GET /api/history - Returns portfolio snapshots (30 days)
- [x] GET /api/settings - Returns app settings
- [x] PUT /api/settings - Update dark mode setting
- [x] POST /api/refresh - Manual refresh with snapshot save
- [x] GET /api/export - CSV export of portfolio
- [x] GET /api/prices/xlm - Current XLM price in EUR
- [x] Stellar Horizon API integration
- [x] CoinGecko + CoinCap price fallback strategy
- [x] LP position value calculation
- [x] MongoDB collections: portfolio_snapshots, price_history, settings

### Frontend Components
- [x] Dashboard.jsx - Main dashboard with portfolio summary
- [x] HoldingsTable.jsx - Spot holdings display
- [x] LPPositionsTable.jsx - LP positions display
- [x] HistoryChart.jsx - Recharts line chart with view toggles
- [x] SettingsPanel.jsx - Collapsible settings display

### Design Implementation
- [x] 16-bit retro theme with neon colors (#00f3ff, #ff0099, #39ff14, #ffb000)
- [x] Press Start 2P font for headings
- [x] VT323 font for terminal/data text
- [x] Space Mono for body text
- [x] Scanline overlay effect
- [x] CRT glow text effects
- [x] Terminal-style panels with rainbow header bars

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Portfolio data fetching from Horizon
- [x] EUR price integration
- [x] Holdings and LP display
- [x] Historical chart

### P1 - Important (Next Phase)
- [ ] Scheduled daily job (cron) for automatic snapshots
- [ ] Price alerts/notifications
- [ ] Asset price history charts (individual assets)
- [ ] Better price mapping for more Stellar assets

### P2 - Nice to Have
- [ ] Multi-wallet support (simple auth)
- [ ] Export to PDF
- [ ] Profit/loss calculations
- [ ] Asset allocation pie chart
- [ ] Price change indicators (24h, 7d)

## Environment Variables
- `PUBLIC_STELLAR_ADDRESS` - Stellar wallet address to track
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - MongoDB database name
- `CORS_ORIGINS` - Allowed CORS origins

## Next Tasks
1. Implement scheduled daily snapshot job (edge function or cron)
2. Add price change indicators (24h change %)
3. Improve asset price mapping for more Stellar tokens
4. Add profit/loss tracking vs initial investment
