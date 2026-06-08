import tensorflow as tf
from tensorflow.keras import layers, Model

def unet_resnet50(input_shape: tuple = (256, 256, 4)) -> Model:
    """U-Net with ResNet50 backbone for deforestation segmentation."""

    base = tf.keras.applications.ResNet50(
        include_top=False,
        weights="imagenet",
        input_shape=input_shape,
    )

    skip_names = [
        "conv1_relu",
        "conv2_block3_out",
        "conv3_block4_out",
        "conv4_block6_out",
    ]
    skip_outputs = [base.get_layer(name).output for name in skip_names]
    down_stack = tf.keras.Model(inputs=base.input, outputs=skip_outputs)
    down_stack.trainable = False

    up_stack = [
        upsample(512, 3),
        upsample(256, 3),
        upsample(128, 3),
        upsample(64, 3),
    ]

    inputs = layers.Input(shape=input_shape)
    skips = down_stack(inputs)
    x = skips[-1]
    skips = reversed(skips[:-1])

    for up, skip in zip(up_stack, skips):
        x = up(x)
        concat = layers.Concatenate()([x, skip])
        x = layers.Conv2DTranspose(32, 3, strides=2, padding="same")(concat)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)

    outputs = layers.Conv2D(1, 1, activation="sigmoid")(x)

    return tf.keras.Model(inputs=inputs, outputs=outputs, name="deforestation_unet")


def upsample(filters: int, size: int) -> Model:
    return tf.keras.Sequential([
        layers.Conv2DTranspose(filters, size, strides=2, padding="same"),
        layers.BatchNormalization(),
        layers.ReLU(),
    ])


def create_model() -> Model:
    model = unet_resnet50()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=["accuracy", tf.keras.metrics.MeanIoU(num_classes=2)],
    )
    return model
