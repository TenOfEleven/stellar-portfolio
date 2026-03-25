from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stellar address from environment
STELLAR_ADDRESS = os.environ.get('PUBLIC_STELLAR_ADDRESS', '')

# API URLs
HORIZON_URL = "https://horizon.stellar.org"
COINGECKO_URL = "https://api.coingecko.com/api/v3"

# Create the main app
app = FastAPI(title="Stellar Portfolio Tracker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Pydantic Models ==============

class WalletInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stellar_address: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Holding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_code: str
    issuer: str
    amount: float
    price_eur: float = 0.0
    value_eur: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LPPosition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pool_id: str
    assets: List[str] = []
    share: float = 0.0
    share_percentage: float = 0.0
    value_eur: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PriceHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_code: str
    price_eur: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PortfolioSnapshot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_value_eur: float
    spot_value_eur: float
    lp_value_eur: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    refresh_interval_hours: int = 24
    dark_mode: bool = True
    stellar_address: str = ""

class PortfolioResponse(BaseModel):
    total_value_eur: float
    spot_value_eur: float
    lp_value_eur: float
    holdings: List[Holding]
    lp_positions: List[LPPosition]
    stellar_address: str
    last_updated: str

class HistoryResponse(BaseModel):
    snapshots: List[PortfolioSnapshot]

# ============== Helper Functions ==============

async def fetch_stellar_account(address: str) -> Dict[str, Any]:
    """Fetch account data from Horizon API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{HORIZON_URL}/accounts/{address}")
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                logger.warning(f"Account not found: {address}")
                return {}
            else:
                logger.error(f"Horizon API error: {response.status_code}")
                return {}
    except Exception as e:
        logger.error(f"Error fetching Stellar account: {e}")
        return {}

async def fetch_liquidity_pools(address: str) -> List[Dict[str, Any]]:
    """Fetch LP positions for an account"""
    pools = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First get the account's LP shares from balances
            account = await fetch_stellar_account(address)
            if not account:
                return pools
            
            # Check for liquidity pool shares in balances
            for balance in account.get('balances', []):
                if balance.get('asset_type') == 'liquidity_pool_shares':
                    pool_id = balance.get('liquidity_pool_id')
                    shares = float(balance.get('balance', 0))
                    
                    # Fetch pool details
                    pool_response = await client.get(f"{HORIZON_URL}/liquidity_pools/{pool_id}")
                    if pool_response.status_code == 200:
                        pool_data = pool_response.json()
                        pools.append({
                            'pool_id': pool_id,
                            'user_shares': shares,
                            'total_shares': float(pool_data.get('total_shares', 0)),
                            'reserves': pool_data.get('reserves', [])
                        })
    except Exception as e:
        logger.error(f"Error fetching liquidity pools: {e}")
    return pools

async def fetch_xlm_price_eur() -> float:
    """Fetch XLM price in EUR from CoinGecko with fallback"""
    # Try CoinGecko first
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{COINGECKO_URL}/simple/price",
                params={"ids": "stellar", "vs_currencies": "eur"}
            )
            if response.status_code == 200:
                data = response.json()
                price = data.get('stellar', {}).get('eur', 0)
                if price > 0:
                    return price
    except Exception as e:
        logger.warning(f"CoinGecko API failed: {e}")
    
    # Fallback to CoinCap
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get XLM price in USD from CoinCap
            response = await client.get("https://api.coincap.io/v2/assets/stellar-lumens")
            if response.status_code == 200:
                data = response.json()
                usd_price = float(data.get('data', {}).get('priceUsd', 0))
                
                # Get EUR/USD rate
                eur_response = await client.get("https://api.coincap.io/v2/rates/euro")
                if eur_response.status_code == 200:
                    eur_data = eur_response.json()
                    eur_rate = float(eur_data.get('data', {}).get('rateUsd', 1.1))
                    return usd_price / eur_rate
    except Exception as e:
        logger.warning(f"CoinCap API fallback failed: {e}")
    
    # Last fallback - use a hardcoded approximate if all APIs fail
    logger.warning("All price APIs failed, using cached/approximate price")
    return 0.10  # Approximate XLM price as last resort

async def get_asset_price_eur(asset_code: str, issuer: str = "") -> float:
    """Get price for a Stellar asset in EUR"""
    # For XLM (native)
    if asset_code == "XLM" or asset_code == "native":
        return await fetch_xlm_price_eur()
    
    # For other Stellar assets, we'd need a mapping to CoinGecko IDs
    # Common Stellar assets
    asset_mapping = {
        "USDC": "usd-coin",
        "yUSDC": "usd-coin",  # Yield USDC approximated as USDC
        "AQUA": "aquarius",
        "SHX": "stronghold-token",
        "EURC": "euro-coin",
    }
    
    coingecko_id = asset_mapping.get(asset_code.upper())
    if coingecko_id:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{COINGECKO_URL}/simple/price",
                    params={"ids": coingecko_id, "vs_currencies": "eur"}
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get(coingecko_id, {}).get('eur', 0)
        except Exception as e:
            logger.warning(f"Failed to get price for {asset_code}: {e}")
    
    # For stablecoins pegged to EUR/USD
    if asset_code.upper() in ["USDC", "USDT", "yUSDC"]:
        # Get EUR/USD rate and return ~1 USD in EUR
        xlm_price = await fetch_xlm_price_eur()
        if xlm_price > 0:
            return 0.92  # Approximate EUR/USD rate
    
    if asset_code.upper() in ["EURC", "EURT"]:
        return 1.0  # EUR stablecoins
    
    return 0.0  # Unknown asset

async def calculate_portfolio() -> PortfolioResponse:
    """Calculate current portfolio value"""
    holdings = []
    lp_positions = []
    spot_value_eur = 0.0
    lp_value_eur = 0.0
    
    if not STELLAR_ADDRESS:
        return PortfolioResponse(
            total_value_eur=0,
            spot_value_eur=0,
            lp_value_eur=0,
            holdings=[],
            lp_positions=[],
            stellar_address="",
            last_updated=datetime.now(timezone.utc).isoformat()
        )
    
    # Fetch account data
    account = await fetch_stellar_account(STELLAR_ADDRESS)
    
    if account:
        # Process balances
        for balance in account.get('balances', []):
            asset_type = balance.get('asset_type', '')
            
            # Skip LP shares here - handle separately
            if asset_type == 'liquidity_pool_shares':
                continue
            
            amount = float(balance.get('balance', 0))
            if amount <= 0:
                continue
            
            if asset_type == 'native':
                asset_code = 'XLM'
                issuer = ''
            else:
                asset_code = balance.get('asset_code', 'UNKNOWN')
                issuer = balance.get('asset_issuer', '')
            
            price_eur = await get_asset_price_eur(asset_code, issuer)
            value_eur = amount * price_eur
            spot_value_eur += value_eur
            
            holdings.append(Holding(
                asset_code=asset_code,
                issuer=issuer[:8] + "..." if len(issuer) > 8 else issuer,
                amount=round(amount, 4),
                price_eur=round(price_eur, 6),
                value_eur=round(value_eur, 2)
            ))
        
        # Fetch and process LP positions
        pools = await fetch_liquidity_pools(STELLAR_ADDRESS)
        for pool in pools:
            pool_value_eur = 0.0
            asset_names = []
            
            for reserve in pool.get('reserves', []):
                asset_info = reserve.get('asset', 'native')
                if asset_info == 'native':
                    asset_code = 'XLM'
                    issuer = ''
                else:
                    parts = asset_info.split(':')
                    asset_code = parts[0] if parts else 'UNKNOWN'
                    issuer = parts[1] if len(parts) > 1 else ''
                
                asset_names.append(asset_code)
                reserve_amount = float(reserve.get('amount', 0))
                price_eur = await get_asset_price_eur(asset_code, issuer)
                pool_value_eur += reserve_amount * price_eur
            
            total_shares = pool.get('total_shares', 0)
            user_shares = pool.get('user_shares', 0)
            
            if total_shares > 0:
                share_fraction = user_shares / total_shares
                user_lp_value = pool_value_eur * share_fraction
                lp_value_eur += user_lp_value
                
                lp_positions.append(LPPosition(
                    pool_id=pool['pool_id'][:16] + "...",
                    assets=asset_names,
                    share=round(user_shares, 4),
                    share_percentage=round(share_fraction * 100, 4),
                    value_eur=round(user_lp_value, 2)
                ))
    
    # Sort holdings by value
    holdings.sort(key=lambda x: x.value_eur, reverse=True)
    
    total_value_eur = spot_value_eur + lp_value_eur
    
    return PortfolioResponse(
        total_value_eur=round(total_value_eur, 2),
        spot_value_eur=round(spot_value_eur, 2),
        lp_value_eur=round(lp_value_eur, 2),
        holdings=holdings,
        lp_positions=lp_positions,
        stellar_address=STELLAR_ADDRESS,
        last_updated=datetime.now(timezone.utc).isoformat()
    )

async def save_daily_snapshot(portfolio: PortfolioResponse):
    """Save a daily portfolio snapshot"""
    snapshot = PortfolioSnapshot(
        total_value_eur=portfolio.total_value_eur,
        spot_value_eur=portfolio.spot_value_eur,
        lp_value_eur=portfolio.lp_value_eur
    )
    
    doc = snapshot.model_dump()
    await db.portfolio_snapshots.insert_one(doc)
    
    # Also save price history for XLM
    xlm_price = await fetch_xlm_price_eur()
    price_entry = PriceHistory(
        asset_code="XLM",
        price_eur=xlm_price
    )
    await db.price_history.insert_one(price_entry.model_dump())
    
    logger.info(f"Saved daily snapshot: €{portfolio.total_value_eur}")

# ============== API Endpoints ==============

@api_router.get("/")
async def root():
    return {"message": "Stellar Portfolio Tracker API", "status": "online"}

@api_router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio():
    """Get current portfolio with all holdings and LP positions"""
    return await calculate_portfolio()

@api_router.post("/refresh")
async def refresh_portfolio(background_tasks: BackgroundTasks):
    """Manually refresh portfolio and save snapshot"""
    portfolio = await calculate_portfolio()
    background_tasks.add_task(save_daily_snapshot, portfolio)
    return {"message": "Portfolio refreshed", "portfolio": portfolio}

@api_router.get("/history", response_model=HistoryResponse)
async def get_history(days: int = 30):
    """Get historical portfolio snapshots"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    snapshots = await db.portfolio_snapshots.find(
        {"timestamp": {"$gte": cutoff.isoformat()}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    # If no snapshots, return empty
    if not snapshots:
        # Get current portfolio and create initial snapshot
        portfolio = await calculate_portfolio()
        initial_snapshot = PortfolioSnapshot(
            total_value_eur=portfolio.total_value_eur,
            spot_value_eur=portfolio.spot_value_eur,
            lp_value_eur=portfolio.lp_value_eur
        )
        doc = initial_snapshot.model_dump()
        await db.portfolio_snapshots.insert_one(doc)
        snapshots = [doc]
    
    return HistoryResponse(snapshots=[PortfolioSnapshot(**s) for s in snapshots])

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    """Get app settings"""
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = Settings(stellar_address=STELLAR_ADDRESS)
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(dark_mode: bool = True):
    """Update settings (only dark_mode is editable)"""
    await db.settings.update_one(
        {},
        {"$set": {"dark_mode": dark_mode}},
        upsert=True
    )
    return await get_settings()

@api_router.get("/export")
async def export_csv():
    """Export current holdings and LP positions as CSV"""
    portfolio = await calculate_portfolio()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Holdings section
    writer.writerow(["=== SPOT HOLDINGS ==="])
    writer.writerow(["Asset", "Amount", "Price (EUR)", "Value (EUR)"])
    for h in portfolio.holdings:
        writer.writerow([h.asset_code, h.amount, h.price_eur, h.value_eur])
    
    writer.writerow([])
    
    # LP Positions section
    writer.writerow(["=== LP POSITIONS ==="])
    writer.writerow(["Pool ID", "Assets", "Share %", "Value (EUR)"])
    for lp in portfolio.lp_positions:
        writer.writerow([lp.pool_id, "/".join(lp.assets), f"{lp.share_percentage}%", lp.value_eur])
    
    writer.writerow([])
    
    # Summary
    writer.writerow(["=== SUMMARY ==="])
    writer.writerow(["Total Spot Value (EUR)", portfolio.spot_value_eur])
    writer.writerow(["Total LP Value (EUR)", portfolio.lp_value_eur])
    writer.writerow(["Total Portfolio Value (EUR)", portfolio.total_value_eur])
    writer.writerow(["Stellar Address", portfolio.stellar_address])
    writer.writerow(["Export Date", datetime.now(timezone.utc).isoformat()])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=stellar_portfolio_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@api_router.get("/prices/xlm")
async def get_xlm_price():
    """Get current XLM price in EUR"""
    price = await fetch_xlm_price_eur()
    return {"asset": "XLM", "price_eur": price, "currency": "EUR"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database collections and indexes"""
    # Create indexes
    await db.portfolio_snapshots.create_index("timestamp")
    await db.price_history.create_index([("asset_code", 1), ("timestamp", -1)])
    
    # Initialize settings if not exists
    settings = await db.settings.find_one({})
    if not settings:
        default_settings = Settings(stellar_address=STELLAR_ADDRESS)
        await db.settings.insert_one(default_settings.model_dump())
    
    logger.info(f"Stellar Portfolio Tracker started for address: {STELLAR_ADDRESS[:16]}...")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
