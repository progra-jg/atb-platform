import os
import numpy as np
import tensorflow as tf
from model import create_model

DATA_DIR = os.getenv("DATA_DIR", "data/deforestation")
EPOCHS = int(os.getenv("EPOCHS", "50"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "8"))

def load_dataset():
    # Simulated dataset loading
    # In production: load from TFRecord or image directory
    X_train = np.random.randn(100, 256, 256, 4).astype(np.float32)
    y_train = np.random.randint(0, 2, (100, 256, 256, 1)).astype(np.float32)
    X_val = np.random.randn(20, 256, 256, 4).astype(np.float32)
    y_val = np.random.randint(0, 2, (20, 256, 256, 1)).astype(np.float32)
    return (X_train, y_train), (X_val, y_val)

def train():
    model = create_model()
    print(f"Model: {model.name}")
    print(f"Parameters: {model.count_params():,}")

    (X_train, y_train), (X_val, y_val) = load_dataset()

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            "models/deforestation/deforestation_best.h5",
            save_best_only=True, monitor="val_loss"
        ),
        tf.keras.callbacks.EarlyStopping(
            patience=5, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            factor=0.5, patience=3, min_lr=1e-6
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
    )

    model.save("models/deforestation/deforestation_final.h5")
    print(f"Training complete. Final val_loss: {history.history['val_loss'][-1]:.4f}")

if __name__ == "__main__":
    train()
