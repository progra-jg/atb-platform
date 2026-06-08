import json
from typing import Optional

class DroneProtocol:
    """Parse MAVLink protocol for DJI/compatible drones."""

    def parse_waypoint(self, data: dict) -> Optional[dict]:
        """Extract waypoint information from drone telemetry."""
        try:
            return {
                "latitude": data.get("lat", 0.0),
                "longitude": data.get("lng", 0.0),
                "altitude": data.get("alt", 0.0),
                "heading": data.get("heading", 0),
                "speed": data.get("speed", 0.0),
                "battery": data.get("battery", 100),
                "timestamp": data.get("timestamp", ""),
            }
        except (KeyError, TypeError):
            return None

    def parse_georeferenced_image(self, image_data: dict) -> dict:
        """Extract georeferencing metadata from drone image."""
        return {
            "image_id": image_data.get("image_id", ""),
            "latitude": image_data.get("gps_latitude", 0.0),
            "longitude": image_data.get("gps_longitude", 0.0),
            "altitude": image_data.get("altitude", 0.0),
            "gimbal_yaw": image_data.get("gimbal_yaw", 0.0),
            "gimbal_pitch": image_data.get("gimbal_pitch", 0.0),
            "resolution": image_data.get("resolution", "1920x1080"),
            "timestamp": image_data.get("timestamp", ""),
        }

    def validate_telemetry(self, telemetry: dict) -> bool:
        """Validate that telemetry data contains required fields."""
        required = ["lat", "lng", "alt", "battery", "timestamp"]
        return all(field in telemetry for field in required)
