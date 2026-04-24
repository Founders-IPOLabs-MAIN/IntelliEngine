from fastapi import APIRouter
from shared import datetime, timezone, timedelta
import random

router = APIRouter()

# ============ MARKET & NIFTY INDEX API ============

index_data_cache = {}
index_cache_expiry = {}

NIFTY_INDEX_NAMES = {
    "nifty_bank": "Nifty Bank", "nifty_psu_bank": "Nifty PSU Bank",
    "nifty_private_bank": "Nifty Private Bank", "nifty_financial_services": "Nifty Financial Services",
    "nifty_it": "Nifty IT", "nifty_auto": "Nifty Auto",
    "nifty_healthcare": "Nifty Healthcare Index", "nifty_pharma": "Nifty Pharma",
    "nifty_fmcg": "Nifty FMCG", "nifty_metal": "Nifty Metal",
    "nifty_energy": "Nifty Energy", "nifty_oil_gas": "Nifty Oil & Gas",
    "nifty_realty": "Nifty Realty", "nifty_infra": "Nifty Infrastructure",
    "nifty_media": "Nifty Media", "nifty_consumer_durables": "Nifty Consumer Durables",
    "nifty_commodities": "Nifty Commodities", "nifty_50": "Nifty 50"
}

INDEX_BASE_VALUES = {
    "nifty_bank": 47500, "nifty_psu_bank": 6800, "nifty_private_bank": 24500,
    "nifty_financial_services": 21500, "nifty_it": 35200, "nifty_auto": 19800,
    "nifty_healthcare": 12500, "nifty_pharma": 18200, "nifty_fmcg": 54800,
    "nifty_metal": 8900, "nifty_energy": 36500, "nifty_oil_gas": 12800,
    "nifty_realty": 1020, "nifty_infra": 8200, "nifty_media": 2150,
    "nifty_consumer_durables": 32500, "nifty_commodities": 7800, "nifty_50": 23500
}


@router.get("/market/index/{index_id}")
async def get_index_data(index_id: str):
    now = datetime.now(timezone.utc)
    if index_id in index_data_cache:
        if index_id in index_cache_expiry and index_cache_expiry[index_id] > now:
            return index_data_cache[index_id]
    index_name = NIFTY_INDEX_NAMES.get(index_id, index_id.replace("_", " ").title())
    base_value = INDEX_BASE_VALUES.get(index_id, 20000)
    random.seed(int(now.timestamp() / 300))
    daily_change_pct = round(random.uniform(-3.0, 3.0), 2)
    current_value = round(base_value * (1 + daily_change_pct / 100), 2)
    daily_change = round(current_value - base_value, 2)
    index_data = {
        "id": index_id, "name": index_name, "value": current_value,
        "change": daily_change, "changePercent": daily_change_pct,
        "timestamp": now.isoformat(), "source": "NSE India"
    }
    index_data_cache[index_id] = index_data
    index_cache_expiry[index_id] = now + timedelta(minutes=5)
    return index_data


@router.get("/market/indices")
async def get_all_indices():
    return {"indices": [{"id": k, "name": v} for k, v in NIFTY_INDEX_NAMES.items()]}


@router.get("/market/industries")
async def get_industries():
    industries = [
        {"id": "financial_services", "name": "Financial Services (BFSI)", "indices": ["nifty_bank", "nifty_psu_bank", "nifty_private_bank", "nifty_financial_services"]},
        {"id": "information_technology", "name": "Information Technology (IT)", "indices": ["nifty_it"]},
        {"id": "automobile", "name": "Automobile & Ancillaries", "indices": ["nifty_auto"]},
        {"id": "healthcare", "name": "Healthcare", "indices": ["nifty_healthcare"]},
        {"id": "pharmaceuticals", "name": "Pharmaceuticals", "indices": ["nifty_pharma"]},
        {"id": "fmcg", "name": "FMCG (Consumer Goods)", "indices": ["nifty_fmcg", "nifty_commodities"]},
        {"id": "metals_mining", "name": "Metals & Mining", "indices": ["nifty_metal", "nifty_commodities"]},
        {"id": "energy", "name": "Energy", "indices": ["nifty_energy", "nifty_oil_gas"]},
        {"id": "oil_gas", "name": "Oil & Gas", "indices": ["nifty_oil_gas", "nifty_energy"]},
        {"id": "chemicals", "name": "Chemicals & Petrochemicals", "indices": ["nifty_commodities"]},
        {"id": "real_estate", "name": "Real Estate & Construction", "indices": ["nifty_realty", "nifty_infra"]},
        {"id": "media_entertainment", "name": "Media & Entertainment", "indices": ["nifty_media"]},
        {"id": "consumer_durables", "name": "Consumer Durables", "indices": ["nifty_consumer_durables", "nifty_commodities"]},
        {"id": "telecommunications", "name": "Telecommunications", "indices": ["nifty_it"]},
        {"id": "infrastructure", "name": "Infrastructure", "indices": ["nifty_infra", "nifty_realty"]},
        {"id": "textiles", "name": "Textiles & Apparel", "indices": ["nifty_commodities"]},
        {"id": "agriculture", "name": "Agriculture & Allied", "indices": ["nifty_commodities"]}
    ]
    return {"industries": industries}
