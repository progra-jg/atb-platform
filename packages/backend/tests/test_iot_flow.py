import pytest
import sys
sys.path.insert(0, "../../iot-bridge/protocols")
sys.path.insert(0, "../../iot-bridge/services")

from scale_protocol import ScaleProtocol
from device_registry import DeviceRegistry

def test_scale_protocol_parse():
    protocol = ScaleProtocol()
    frame = bytes([0x01, 0x03, 0x04, 0x44, 0xFA, 0x00, 0x00, 0x00, 0x00])
    weight = protocol.parse_weight_frame(frame)
    assert weight is not None

def test_device_registry():
    registry = DeviceRegistry()
    registry.register_device("SCALE-001", "scale", {"firmware_version": "1.0"})
    assert len(registry.get_all_devices()) == 1
    assert registry.get_device("SCALE-001")["device_type"] == "scale"

def test_device_heartbeat():
    registry = DeviceRegistry()
    registry.register_device("SCALE-002", "scale", {})
    registry.update_heartbeat("SCALE-002", 85)
    assert registry.get_device("SCALE-002")["battery_level"] == 85
