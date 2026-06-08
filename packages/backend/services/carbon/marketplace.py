class CarbonMarketplace:
    """Match carbon credit buyers with ATB producers."""

    POTENTIAL_BUYERS = [
        {"name": "Microsoft", "sector": "Technology", "target_tco2": 100000},
        {"name": "Nestlé", "sector": "Food & Beverage", "target_tco2": 50000},
        {"name": "TotalEnergies", "sector": "Energy", "target_tco2": 75000},
        {"name": "BNP Paribas", "sector": "Finance", "target_tco2": 25000},
    ]

    def list_available_credits(self, cooperative_id: str, quantity_tco2: float,
                                price_per_tco2: float = 15.0) -> dict:
        return {
            "cooperative_id": cooperative_id,
            "quantity_tco2": quantity_tco2,
            "price_per_tco2_usd": price_per_tco2,
            "total_value_usd": quantity_tco2 * price_per_tco2,
            "registry": "Verra VCS / Gold Standard",
            "status": "available",
        }

    def match_buyers(self, quantity_tco2: float) -> list:
        matches = []
        for buyer in self.POTENTIAL_BUYERS:
            if buyer["target_tco2"] >= quantity_tco2:
                matches.append({
                    "buyer": buyer["name"],
                    "sector": buyer["sector"],
                    "estimated_interest": "high" if buyer["target_tco2"] >= quantity_tco2 * 2 else "medium",
                })
        return matches
