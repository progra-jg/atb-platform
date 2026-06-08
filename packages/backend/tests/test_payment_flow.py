import pytest
import requests
import sys
sys.path.insert(0, "../services/marketplace")

from payment.index import MTNMoMoPayment

def test_mtn_momo_request_to_pay():
    payment = MTNMoMoPayment()
    result = payment.requestToPay("+22901020304", 5000, "EUR")
    assert "success" in result
    assert "reference" in result or "error" in result

def test_mtn_momo_transaction_status():
    payment = MTNMoMoPayment()
    result = payment.getTransactionStatus("ref_test_123")
    assert "status" in result
