import pytest
from unittest.mock import Mock, patch
from handlers.weight_handler import WeightHandler
from handlers.drone_handler import DroneHandler

def test_weight_handler_sync():
    handler = WeightHandler()
    with patch("requests.patch") as mock_patch:
        mock_patch.return_value.status_code = 200
        handler.sync_to_traceability("lot_001", 150.5, "scale_01")
        mock_patch.assert_called_once()

def test_drone_handler_image():
    handler = DroneHandler()
    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        handler.trigger_ai_processing({"image_id": "img_001"})
        mock_post.assert_called_once()

def test_weight_handler_handle():
    handler = WeightHandler()
    handler.handle_weight({"device_id": "scale_01", "weight": 200, "lot_id": "lot_001"})
    # Should not throw

def test_drone_handler_telemetry():
    handler = DroneHandler()
    handler.handle_telemetry({"lat": 8.5, "lng": 2.5, "alt": 100})
    # Should not throw
