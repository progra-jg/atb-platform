class EUDRValidator:
    """Validate data against EUDR requirements."""

    REQUIRED_FIELDS = [
        "operator_name",
        "product_type",
        "country_of_production",
        "geolocation_coordinates",
        "harvest_date",
        "quantity",
        "deforestation_check",
    ]

    EUDR_PRODUCTS = [
        "Cacao", "Coffee", "Palm Oil", "Soy", "Wood", "Rubber", "Cattle",
    ]

    def validate_lot(self, lot_data: dict) -> dict:
        errors = []
        warnings = []

        for field in self.REQUIRED_FIELDS:
            if field not in lot_data or not lot_data[field]:
                errors.append(f"Missing required field: {field}")

        if lot_data.get("product_type") not in self.EUDR_PRODUCTS:
            warnings.append(f"Product '{lot_data.get('product_type')}' may not be in EUDR scope")

        if lot_data.get("quantity", 0) <= 0:
            errors.append("Quantity must be positive")

        if not lot_data.get("deforestation_check", {}).get("compliant", False):
            errors.append("Deforestation check not passed")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }
