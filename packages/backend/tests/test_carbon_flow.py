import pytest
import sys
sys.path.insert(0, "../services/carbon")

from calculator import CarbonCalculator
from aggregator import CarbonAggregator

def test_carbon_calculate():
    calc = CarbonCalculator()
    result = calc.calculate_avoided_emissions(1.5, "Cacao", 1)
    assert result["total_avoided_tco2"] > 0
    assert result["culture"] == "Cacao"
    assert "equivalent_trees_planted" in result

def test_carbon_aggregate():
    agg = CarbonAggregator()
    parcelles = [
        {"area_ha": 1.5, "culture": "Cacao", "years": 1},
        {"area_ha": 2.0, "culture": "Coton", "years": 1},
    ]
    result = agg.aggregate_by_region({"Zou": parcelles})
    assert len(result) == 1
    assert result[0]["region"] == "Zou"

def test_carbon_audit_report():
    agg = CarbonAggregator()
    result = agg.generate_audit_report([
        {"area_ha": 1.5, "culture": "Cacao", "years": 1},
    ])
    assert "total_credits_generated" in result
    assert "estimated_value_usd" in result
