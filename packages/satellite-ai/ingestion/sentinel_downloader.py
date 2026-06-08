import os
from datetime import datetime, timedelta
from sentinelhub import (
    SHConfig, BBox, CRS, DataCollection,
    SentinelHubDownloadClient, SentinelHubRequest,
    MimeType, bbox_to_dimensions,
)

class SentinelDownloader:
    def __init__(self, client_id: str = None, client_secret: str = None):
        self.config = SHConfig()
        if client_id and client_secret:
            self.config.sh_client_id = client_id
            self.config.sh_client_secret = client_secret
        self.config.sh_token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
        self.config.sh_base_url = "https://sh.dataspace.copernicus.eu"

    def download_ndvi(self, bbox_coords: tuple, start_date: str, end_date: str, resolution: int = 10):
        bbox = BBox(bbox_coords, crs=CRS.WGS84)
        size = bbox_to_dimensions(bbox, resolution=resolution)

        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B04", "B08", "SCL", "dataMask"],
                output: { bands: 3, sampleType: "FLOAT32" }
            };
        }
        function evaluatePixel(sample) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.0001);
            let cloud = (sample.SCL === 3 || sample.SCL === 8 || sample.SCL === 9) ? 1 : 0;
            return [ndvi, cloud, sample.dataMask];
        }
        """

        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(start_date, end_date),
                    maxcc=0.3,
                )
            ],
            responses=[
                SentinelHubRequest.output_response("default", MimeType.TIFF),
            ],
            bbox=bbox,
            size=size,
            config=self.config,
        )

        return request.get_data()[0]

    def download_rgb(self, bbox_coords: tuple, date: str, resolution: int = 10):
        bbox = BBox(bbox_coords, crs=CRS.WGS84)
        size = bbox_to_dimensions(bbox, resolution=resolution)

        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "dataMask"],
                output: { bands: 4, sampleType: "UINT16" }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B04, sample.B03, sample.B02, sample.dataMask];
        }
        """

        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(date, date),
                    maxcc=0.2,
                )
            ],
            responses=[
                SentinelHubRequest.output_response("default", MimeType.TIFF),
            ],
            bbox=bbox,
            size=size,
            config=self.config,
        )

        return request.get_data()[0]
