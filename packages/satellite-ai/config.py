import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgres://atb:atb_dev_2024@localhost:5432/atb_agritrace")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
