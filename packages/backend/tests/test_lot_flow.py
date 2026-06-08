import pytest
import requests

TRACE_URL = "http://localhost:8080/api"

def test_create_lot():
    payload = {
        "owner": "test_farmer_01",
        "culture": "Cacao",
        "quantite": 1000,
        "parcelle_id": "parcelle_01",
    }
    resp = requests.post(f"{TRACE_URL}/lots", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "hash" in data
    assert "qr_code" in data

def test_get_lot():
    resp = requests.get(f"{TRACE_URL}/lots/1")
    assert resp.status_code in [200, 404]

def test_scan_qr():
    payload = {"qr_data": "test_hash_123"}
    resp = requests.post(f"{TRACE_URL}/scan", json=payload)
    assert resp.status_code in [200, 404]

def test_transfer_lot():
    payload = {
        "lot_id": "1",
        "from": "farmer",
        "to": "cooperative",
        "signature": "0xsignature",
    }
    resp = requests.post(f"{TRACE_URL}/transfer", json=payload)
    assert resp.status_code in [201, 400, 404]
