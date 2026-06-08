import os
import io
from datetime import datetime
from minio import Minio
from minio.error import S3Error

class MinioManager:
    def __init__(self, endpoint: str = None, access_key: str = None, secret_key: str = None):
        self.client = Minio(
            endpoint or os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=access_key or os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=secret_key or os.getenv("MINIO_SECRET_KEY", "minioadmin123"),
            secure=False,
        )

    def ensure_bucket(self, bucket: str):
        if not self.client.bucket_exists(bucket):
            self.client.make_bucket(bucket)

    def store_image(self, bucket: str, image_data: bytes, region: str, culture: str, date: str):
        self.ensure_bucket(bucket)
        year, month = date[:4], date[5:7]
        object_name = f"region={region}/culture={culture}/year={year}/month={month}/{date}_{region}.tif"

        self.client.put_object(
            bucket, object_name,
            io.BytesIO(image_data), len(image_data),
            content_type="image/tiff",
        )
        return object_name

    def get_image(self, bucket: str, object_name: str) -> bytes:
        response = self.client.get_object(bucket, object_name)
        data = response.read()
        response.close()
        response.release_conn()
        return data

    def list_images(self, bucket: str, prefix: str = "") -> list:
        objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
        return [obj.object_name for obj in objects]
