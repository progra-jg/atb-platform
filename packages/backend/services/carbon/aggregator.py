from calculator import CarbonCalculator

class CarbonAggregator:
    """Aggregate carbon credits across multiple producers and regions."""

    def __init__(self):
        self.calculator = CarbonCalculator()

    def aggregate_by_region(self, parcelles_by_region: dict) -> list:
        results = []
        for region, parcelles in parcelles_by_region.items():
            total = self.calculator.calculate_cooperative_total(parcelles)
            results.append({
                "region": region,
                "total_avoided_tco2": total["total_avoided_tco2"],
                "parcelles_count": len(parcelles),
            })
        return results

    def aggregate_by_filiere(self, parcelles_by_filiere: dict) -> list:
        results = []
        for filiere, parcelles in parcelles_by_filiere.items():
            total = self.calculator.calculate_cooperative_total(parcelles)
            results.append({
                "filiere": filiere,
                "total_avoided_tco2": total["total_avoided_tco2"],
                "parcelles_count": len(parcelles),
            })
        return results

    def generate_audit_report(self, all_parcelles: list) -> dict:
        total = self.calculator.calculate_cooperative_total(all_parcelles)
        return {
            "total_credits_generated": total["total_avoided_tco2"],
            "total_parcelles": len(all_parcelles),
            "estimated_value_usd": round(total["total_avoided_tco2"] * 15, 2),
            "generated_at": "2024-01-01T00:00:00Z",
        }
