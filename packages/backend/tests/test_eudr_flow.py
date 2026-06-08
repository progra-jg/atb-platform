import pytest
import sys
sys.path.insert(0, "../services/certification")

from eudr.generator import EUDRGenerator
from eudr.validator import EUDRValidator

def test_generate_eudr_xml():
    generator = EUDRGenerator()
    operator = {
        "name": "Coopérative Agricole du Zou",
        "address": "Zogbodomey, Bénin",
        "country": "BJ",
    }
    lot = {
        "id": "ATB-1001",
        "product": "Cacao",
        "quantity": 5000,
        "country": "BJ",
        "harvest_date": "2024-03-15",
        "parcelles": [
            {"id": "P-001", "area": 1.5, "coordinates": [[2.5, 8.5], [2.6, 8.5]]},
        ],
    }

    xml_str = generator.generate_due_diligence(operator, lot)
    assert xml_str.startswith("<?xml")
    assert "LotID" in xml_str
    assert "Cacao" in xml_str

def test_validate_eudr():
    validator = EUDRValidator()
    result = validator.validate_lot({
        "operator_name": "Coop Zou",
        "product_type": "Cacao",
        "country_of_production": "BJ",
        "geolocation_coordinates": "2.5, 8.5",
        "harvest_date": "2024-03-15",
        "quantity": 5000,
        "deforestation_check": {"compliant": True},
    })
    assert result["valid"] is True

def test_validate_eudr_missing_fields():
    validator = EUDRValidator()
    result = validator.validate_lot({})
    assert result["valid"] is False
    assert len(result["errors"]) > 0
