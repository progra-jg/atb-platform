import pytest
import sys
sys.path.insert(0, "../services/marketplace/payment")

from payment.index import MTNMoMoPayment

def test_mtn_momo_payment():
    payment = MTNMoMoPayment()
    result = payment.requestToPay("+22901020304", 5000, "EUR")
    assert isinstance(result, dict)
    assert "success" in result or "error" in result

def test_mtn_momo_status():
    payment = MTNMoMoPayment()
    result = payment.getTransactionStatus("ref_test")
    assert isinstance(result, dict)
