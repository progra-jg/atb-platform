import struct
from typing import Optional

class ScaleProtocol:
    """Parse Modbus RTU protocol for connected scales."""

    def __init__(self):
        self.baud_rate = 9600
        self.data_bits = 8
        self.stop_bits = 1
        self.parity = "N"

    def parse_weight_frame(self, frame: bytes) -> Optional[float]:
        """
        Parse Modbus RTU frame from scale.
        Standard frame: [address(1)][function(1)][data(n)][crc(2)]
        """
        if len(frame) < 4:
            return None

        address = frame[0]
        function_code = frame[1]

        if function_code == 0x03:  # Read holding registers
            byte_count = frame[2]
            if byte_count >= 4:
                # Extract weight from registers (typically 2 registers = 4 bytes)
                weight_raw = struct.unpack(">f", frame[3:7])[0]
                return max(0.0, weight_raw)

        return None

    def create_weight_frame(self, scale_address: int = 1, weight: float = 0.0) -> bytes:
        """Create Modbus RTU frame to set weight value."""
        frame = struct.pack(">B B f", scale_address, 0x06, weight)
        # In production: append CRC
        return frame

    def parse_status_frame(self, frame: bytes) -> dict:
        """Parse device status from status frame."""
        status = {
            "battery_level": 0,
            "scale_connected": False,
            "error_code": 0,
            "calibration_status": "unknown",
        }

        if len(frame) >= 8:
            status["battery_level"] = frame[2]
            status["scale_connected"] = bool(frame[3] & 0x01)
            status["error_code"] = frame[4]
            status["calibration_status"] = "ok" if frame[5] == 0 else "error"

        return status
