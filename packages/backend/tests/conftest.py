import pytest

@pytest.fixture
def api_base_url():
    return "http://localhost:8000"

@pytest.fixture
def auth_token():
    return "test_token_for_integration_tests"
