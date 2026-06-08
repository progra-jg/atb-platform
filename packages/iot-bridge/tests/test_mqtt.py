import pytest
from protocols.scale_protocol import ScaleProtocol
from protocols.drone_protocol import DroneProtocol
from services.device_registry import DeviceRegistry

def test_scale_protocol():
    p = ScaleProtocol()
    assert p.baud_rate == 9600

def test_drone_protocol():
    p = DroneProtocol()
    result = p.parse_waypoint({"lat": 8.5, "lng": 2.5, "alt": 100})
    assert result is not None
    assert result["latitude"] == 8.5

def test_drone_invalid_telemetry():
    p = DroneProtocol()
    assert not p.validate_telemetry({"lat": 8.5})

def test_device_registry_register():
    r = DeviceRegistry()
    r.register_device("D-001", "drone", {})
    assert len(r.get_all_devices()) == 1

def test_device_registry_heartbeat():
    r = DeviceRegistry()
    r.register_device("D-002", "scale", {})
    r.update_heartbeat("D-002", 75)
    assert r.get_device("D-002")["battery_level"] == 75

def test_device_registry_offline():
    r = DeviceRegistry()
    r.register_device("D-003", "scale", {})
    r.mark_offline("D-003")
    assert r.get_device("D-003")["status"] == "offline"
