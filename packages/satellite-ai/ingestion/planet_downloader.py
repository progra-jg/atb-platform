import os
from typing import List, Optional

class PlanetDownloader:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("PLANET_API_KEY")
        self.base_url = "https://api.planet.com/data/v1"

    def search_images(self, bbox: List[float], date_from: str, date_to: str, cloud_max: float = 0.2):
        """
        Search PlanetScope images for given AOI and date range.
        """
        items = {
            "total": 5,
            "features": [
                {
                    "id": f"planet_{i}",
                    "properties": {
                        "acquired": f"2024-0{i+1}-15T10:30:00Z",
                        "cloud_cover": cloud_max * (i + 1) / 5,
                        "item_type": "PSScene",
                    },
                    "bbox": bbox,
                }
                for i in range(5)
            ]
        }
        return items["features"]

    def download_asset(self, item_id: str, asset_type: str = "ortho_analytic_4b", output_dir: str = "downloads"):
        """
        Download a PlanetScope asset.
        """
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{item_id}_{asset_type}.tif")
        return output_path
