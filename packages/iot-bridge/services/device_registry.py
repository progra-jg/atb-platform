import json
from datetime import datetime
from typing import Optional

class DeviceRegistry:
    """Register and manage IoT devices."""

    def __init__(self):
        self.devices = {}

    def register_device(self, device_id: str, device_type: str, metadata: dict) -> dict:
        device = {
            "device_id": device_id,
            "device_type": device_type,
            "firmware_version": metadata.get("firmware_version", "unknown"),
            "battery_level": metadata.get("battery_level", 0),
            "last_heartbeat": datetime.utcnow().isoformat(),
            "status": "online",
            "metadata": metadata,
            "registered_at": datetime.utcnow().isoformat(),
        }
        self.devices[device_id] = device
        print(f"Device registered: {device_id} ({device_type})")
        return device

    def update_heartbeat(self, device_id: str, battery: Optional[int] = None) -> dict:
        if device_id in self.devices:
            self.devices[device_id]["last_heartbeat"] = datetime.utcnow().isoformat()
            self.devices[device_id]["status"] = "online"
            if battery is not None:
                self.devices[device_id]["battery_level"] = battery
        return self.devices.get(device_id, {})

    def mark_offline(self, device_id: str):
        if device_id in self.devices:
            self.devices[device_id]["status"] = "offline"

    def get_online_devices(self) -> list:
        return [d for d in self.devices.values() if d["status"] == "online"]

    def get_all_devices(self) -> list:
        return list(self.devices.values())

    def get_device(self, device_id: str) -> Optional[dict]:
        return self.devices.get(device_id)
