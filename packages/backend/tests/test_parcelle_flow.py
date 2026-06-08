import pytest
import requests

BASE_URL = "http://localhost:3001"

def test_create_parcelle():
    payload = {
        "polygone": [[[2.5, 8.5], [2.6, 8.5], [2.6, 8.6], [2.5, 8.6], [2.5, 8.5]]],
        "superficie": 1.5,
        "culture": "Cacao",
        "village": "Zogbodomey",
    }
    resp = requests.post(f"{BASE_URL}/parcelles", json=payload)
    assert resp.status_code == 201 or resp.status_code == 200
    data = resp.json()
    assert "id" in data

def test_get_parcelle():
    resp = requests.get(f"{BASE_URL}/parcelles")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_create_parcelle_invalid_superficie():
    payload = {
        "polygone": [[[2.5, 8.5], [2.6, 8.5], [2.6, 8.6], [2.5, 8.6], [2.5, 8.5]]],
        "superficie": 0.001,
        "culture": "Cacao",
    }
    resp = requests.post(f"{BASE_URL}/parcelles", json=payload)
    assert resp.status_code == 400
