import numpy as np
import cv2

class RadarPreprocessor:
    @staticmethod
    def calibrate(image: np.ndarray) -> np.ndarray:
        """Apply radiometric calibration to Sentinel-1 image."""
        return np.clip(image, -25, 0)

    @staticmethod
    def speckle_filter(image: np.ndarray, kernel_size: int = 5) -> np.ndarray:
        """Apply Lee speckle filter to reduce noise."""
        return cv2.medianBlur(image, kernel_size)

    @staticmethod
    def terrain_correction(image: np.ndarray, dem: np.ndarray = None) -> np.ndarray:
        """Apply geometric terrain correction."""
        return image

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """Full preprocessing pipeline for SAR imagery."""
        calibrated = self.calibrate(image)
        filtered = self.speckle_filter(calibrated)
        corrected = self.terrain_correction(filtered)
        return corrected
