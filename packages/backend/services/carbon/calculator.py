class CarbonCalculator:
    """Calculate CO2 equivalent emissions avoided through sustainable farming."""

    DEFORESTATION_BASELINE = {
        "Cacao": 12.5,    # tCO2/ha/year avoided
        "Coton": 8.3,
        "Anacarde": 10.1,
        "Café": 11.2,
        "Maïs": 6.7,
        "default": 9.0,
    }

    def calculate_avoided_emissions(self, parcelle_area_ha: float,
                                    culture: str,
                                    years_sustainable: int = 1) -> dict:
        baseline = self.DEFORESTATION_BASELINE.get(culture, self.DEFORESTATION_BASELINE["default"])

        total_avoided = parcelle_area_ha * baseline * years_sustainable

        return {
            "parcelle_area_ha": parcelle_area_ha,
            "culture": culture,
            "baseline_tco2_per_ha_per_year": baseline,
            "years_sustainable": years_sustainable,
            "total_avoided_tco2": round(total_avoided, 2),
            "equivalent_cars_removed": round(total_avoided / 4.6, 1),
            "equivalent_trees_planted": int(total_avoided * 45),
        }

    def calculate_cooperative_total(self, parcelles: list) -> dict:
        total = 0
        details = []
        for p in parcelles:
            result = self.calculate_avoided_emissions(
                p["area_ha"], p["culture"], p.get("years", 1)
            )
            total += result["total_avoided_tco2"]
            details.append(result)

        return {
            "total_avoided_tco2": round(total, 2),
            "parcelles_count": len(parcelles),
            "details": details,
        }
