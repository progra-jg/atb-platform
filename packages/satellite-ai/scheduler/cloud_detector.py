import numpy as np

class CloudDetector:
    def __init__(self, threshold: float = 0.3):
        self.threshold = threshold

    def detect_cloud_fraction(self, image: np.ndarray) -> float:
        """
        Estimate cloud cover fraction from Sentinel-2 SCL band or
        from threshold on blue band brightness.
        Assumes last band is cloud mask or uses brightness threshold.
        """
        if image.ndim == 3 and image.shape[-1] >= 2:
            cloud_band = image[..., 1]
            cloud_pixels = np.sum(cloud_band > 0.5)
            total_pixels = cloud_band.size
            return cloud_pixels / total_pixels
        return 0.0

    def is_usable(self, image: np.ndarray) -> bool:
        """Returns True if cloud cover is below threshold."""
        cloud_fraction = self.detect_cloud_fraction(image)
        return cloud_fraction < self.threshold

    def filter_images(self, images: list) -> list:
        """Filter a list of (image, metadata) tuples, keeping only usable ones."""
        usable = []
        for img, meta in images:
            if self.is_usable(img):
                usable.append((img, meta))
        return usable
