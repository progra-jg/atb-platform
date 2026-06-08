import os
import numpy as np
import tensorflow as tf
from model import create_yield_model

EPOCHS = int(os.getenv("EPOCHS", "100"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))

def load_historical_data():
    # Simulated: 5 years of monthly NDVI + weather data
    X = np.random.randn(500, 60, 10).astype(np.float32)
    y = np.random.randn(500, 1).astype(np.float32) * 500 + 1000
    X_val = np.random.randn(100, 60, 10).astype(np.float32)
    y_val = np.random.randn(100, 1).astype(np.float32) * 500 + 1000
    return (X, y), (X_val, y_val)

def train():
    model = create_yield_model()
    print(f"Yield model parameters: {model.count_params():,}")

    (X_train, y_train), (X_val, y_val) = load_historical_data()

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            "models/yield/yield_best.h5", save_best_only=True, monitor="val_loss"
        ),
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
    )

    model.save("models/yield/yield_final.h5")
    print(f"Training complete. Final val_mae: {history.history['val_mae'][-1]:.2f}")

if __name__ == "__main__":
    train()
