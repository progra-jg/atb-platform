import tensorflow as tf
from tensorflow.keras import layers, Model

def lstm_attention_model(sequence_length: int = 60, n_features: int = 10) -> Model:
    """
    LSTM with attention for yield prediction from time series data.
    Features: NDVI time series + weather data (rainfall, temperature, etc).
    """
    inputs = layers.Input(shape=(sequence_length, n_features))

    x = layers.LSTM(128, return_sequences=True)(inputs)
    x = layers.LSTM(64, return_sequences=True)(x)

    # Attention mechanism
    attention = layers.Dense(1, activation="tanh")(x)
    attention = layers.Flatten()(attention)
    attention = layers.Activation("softmax")(attention)
    attention = layers.RepeatVector(64)(attention)
    attention = layers.Permute([2, 1])(attention)

    x = layers.Multiply()([x, attention])
    x = layers.GlobalAveragePooling1D()(x)

    x = layers.Dense(32, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(16, activation="relu")(x)
    outputs = layers.Dense(1, activation="linear")(x)

    return tf.keras.Model(inputs=inputs, outputs=outputs, name="yield_lstm")


def create_yield_model() -> Model:
    model = lstm_attention_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="mse",
        metrics=["mae", "mape"],
    )
    return model
