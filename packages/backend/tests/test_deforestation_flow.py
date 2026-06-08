import pytest
import numpy as np
import sys
sys.path.insert(0, "../../satellite-ai")

from models.deforestation.postprocess import DeforestationPostProcessor
from models.deforestation.alert import DeforestationAlert

def test_deforestation_postprocess():
    processor = DeforestationPostProcessor(min_area_pixels=10)
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[20:40, 20:40] = 1

    polygons = processor.mask_to_polygons(mask, pixel_size=10.0)
    assert len(polygons) > 0

def test_deforestation_overlay():
    processor = DeforestationPostProcessor()
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[30:60, 30:60] = 1
    polygons = processor.mask_to_polygons(mask)

    from shapely.geometry import Polygon
    parcelles = [("P-001", Polygon([(250, 250), (450, 250), (450, 450), (250, 450), (250, 250)]))]

    affected = processor.overlay_on_parcelles(polygons, parcelles)
    assert isinstance(affected, list)

def test_deforestation_alert():
    alert_system = DeforestationAlert()
    alert = alert_system.generate_alert(
        parcelle_id="P-1024",
        overlap_area=50000,
        overlap_ratio=0.15,
        image_date="2024-03-20",
    )
    assert alert["type"] == "deforestation"
    assert alert["severity"] == "high"
