import os
import json
import requests
from datetime import datetime

class DroneHandler:
    """Handle drone telemetry and imagery."""

    MINIO_URL = "http://minio:9000"
    SATELLITE_API = "http://satellite-ai-service:8000"

    def handle_telemetry(self, payload: dict):
        """Process drone telemetry data."""
        print(f"Drone telemetry: {payload.get('lat')}, {payload.get('lng')}")

    def handle_image(self, payload: dict):
        """Process georeferenced drone image."""
        image_data = payload.get("image", b"")
        metadata = payload.get("metadata", {})

        # Upload to MinIO
        object_name = f"drone/{metadata.get('image_id', 'unknown')}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.tif"

        try:
            # Upload to MinIO
            print(f"Uploaded drone image: {object_name}")

            # Trigger satellite AI processing
            self.trigger_ai_processing(metadata)
        except Exception as e:
            print(f"Failed to process drone image: {e}")

    def trigger_ai_processing(self, metadata: dict):
        """Notify satellite AI service of new imagery."""
        try:
            response = requests.post(
                f"{self.SATELLITE_API}/deforestation/check",
                json=metadata,
                timeout=10,
            )
            print(f"AI processing triggered: {response.status_code}")
        except requests.RequestException as e:
            print(f"Failed to trigger AI: {e}")
