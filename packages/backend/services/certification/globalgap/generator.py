class GlobalGAPGenerator:
    """Generate GlobalGAP audit checklist and certificates."""

    CONTROL_POINTS = {
        "food_safety": [
            "Traceability system in place",
            "Product recall procedure documented",
            "Allergen management",
        ],
        "environmental": [
            "Soil management plan",
            "Water usage monitoring",
            "Waste disposal procedure",
            "Biodiversity conservation",
        ],
        "worker_safety": [
            "Worker training records",
            "PPE availability",
            "First aid equipment",
            "Hygiene facilities",
        ],
        "quality": [
            "Post-harvest handling procedure",
            "Storage temperature monitoring",
            "Pest control records",
        ],
    }

    def generate_checklist(self, farm_data: dict) -> dict:
        results = {}
        total_points = 0
        compliant_points = 0

        for category, points in self.CONTROL_POINTS.items():
            category_results = []
            for point in points:
                total_points += 1
                # In production: check actual data
                compliant = True
                if compliant:
                    compliant_points += 1
                category_results.append({
                    "control_point": point,
                    "compliant": compliant,
                    "finding": "" if compliant else "Not fully implemented",
                })
            results[category] = category_results

        score = (compliant_points / total_points * 100) if total_points > 0 else 0
        return {
            "checklist": results,
            "score": round(score, 1),
            "total_points": total_points,
            "compliant_points": compliant_points,
            "certified": score >= 80,
        }
