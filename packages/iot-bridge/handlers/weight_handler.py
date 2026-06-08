from datetime import datetime
import asyncio
from database import execute

class WeightHandler:
    async def handle_weight(self, payload: dict):
        weight_kg = payload.get("weight", 0)
        device_id = payload.get("device_id", "unknown")
        lot_id = payload.get("lot_id")
        culture = payload.get("culture", "")
        producteur_id = payload.get("producteur_id")

        print(f"Weight reading: {weight_kg}kg from scale {device_id}")

        if weight_kg > 0 and lot_id:
            try:
                await execute("""
                    INSERT INTO weighings (lot_id, producteur_id, weight_kg, culture, date, device_id)
                    VALUES ($1, $2, $3, $4, NOW(), $5)
                """, lot_id, producteur_id, weight_kg, culture, device_id)
                print(f"Recorded weighing for lot {lot_id}")
            except Exception as e:
                print(f"Failed to record weighing: {e}")

    async def handle_status(self, payload: dict):
        device_id = payload.get("device_id")
        status = payload.get("status")
        battery = payload.get("battery_level")
        print(f"Scale {device_id} — {status}")
