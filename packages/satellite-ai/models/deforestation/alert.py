import json
import os
from datetime import datetime
from typing import Optional

class DeforestationAlert:
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv("ALERT_WEBHOOK_URL")

    def generate_alert(self, parcelle_id: str, overlap_area: float,
                       overlap_ratio: float, image_date: str) -> dict:
        alert = {
            "type": "deforestation",
            "parcelle_id": parcelle_id,
            "severity": "high" if overlap_ratio > 0.1 else "medium",
            "overlap_area_ha": round(overlap_area / 10000, 2),
            "overlap_ratio": round(overlap_ratio, 4),
            "detected_at": datetime.utcnow().isoformat(),
            "image_date": image_date,
            "status": "pending",
        }
        return alert

    def send_alert(self, alert: dict):
        """
        Send deforestation alert to notification system.
        In production: push to mobile app, email, and dashboard.
        """
        import requests
        if self.webhook_url:
            try:
                requests.post(self.webhook_url, json=alert, timeout=5)
            except Exception as e:
                print(f"Failed to send alert: {e}")

        print(f"ALERT: Déforestation détectée — Parcelle {alert['parcelle_id']}")
        return alert
