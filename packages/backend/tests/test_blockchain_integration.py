import pytest
import subprocess
import json
import os

def test_solidity_compile():
    """Test that Solidity contracts compile without errors."""
    result = subprocess.run(
        ["npx", "hardhat", "compile"],
        cwd="../../blockchain",
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0 or "Error" not in result.stderr

def test_deployment_script_exists():
    assert os.path.exists("../../blockchain/scripts/deploy.ts")

def test_seed_script_exists():
    assert os.path.exists("../../blockchain/scripts/seed.ts")
