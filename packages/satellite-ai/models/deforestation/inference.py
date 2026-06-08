import os
import numpy as np
import tensorflow as tf

MODEL_PATH = os.getenv("DEFORESTATION_MODEL", "models/deforestation/deforestation_final.h5")

class DeforestationInference:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = tf.keras.models.load_model(MODEL_PATH)
        else:
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    def predict(self, image: np.ndarray) -> np.ndarray:
        """
        Run inference on satellite image.
        Returns binary deforestation mask.
        """
        if image.ndim == 3:
            image = np.expand_dims(image, 0)
        if image.shape[-1] == 3:
            image = np.concatenate([image, np.zeros((*image.shape[:3], 1))], axis=-1)

        prediction = self.model.predict(image, verbose=0)
        return (prediction > 0.5).astype(np.uint8)

    def predict_deforestation_area(self, image: np.ndarray) -> float:
        """Returns the fraction of the image classified as deforestation."""
        mask = self.predict(image)
        return float(np.mean(mask))
