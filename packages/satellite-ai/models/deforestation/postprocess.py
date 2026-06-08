import numpy as np
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

class DeforestationPostProcessor:
    def __init__(self, min_area_pixels: int = 100):
        self.min_area_pixels = min_area_pixels

    def mask_to_polygons(self, mask: np.ndarray, pixel_size: float = 10.0) -> list:
        """
        Convert binary deforestation mask to list of polygon coordinates.
        Pixel size in meters (default 10m for Sentinel-2).
        """
        from skimage import measure
        contours = measure.find_contours(mask, level=0.5)

        polygons = []
        for contour in contours:
            if len(contour) < 4:
                continue
            coords = contour[:, ::-1] * pixel_size
            poly = Polygon(coords)
            if poly.area >= self.min_area_pixels * (pixel_size ** 2):
                polygons.append(poly)

        return polygons

    def overlay_on_parcelles(self, deforestation_polygons: list, parcelles_polys: list) -> list:
        """
        Check which registered parcels intersect with deforestation areas.
        Returns list of affected parcel IDs.
        """
        affected = []
        deforestation_union = unary_union(deforestation_polygons)
        if deforestation_union.is_empty:
            return affected

        for pid, parcel_poly in parcelles_polys:
            if deforestation_union.intersects(parcel_poly):
                intersection = deforestation_union.intersection(parcel_poly)
                overlap_ratio = intersection.area / parcel_poly.area
                if overlap_ratio > 0.01:
                    affected.append({
                        "parcelle_id": pid,
                        "overlap_area": intersection.area,
                        "overlap_ratio": overlap_ratio,
                    })

        return affected
