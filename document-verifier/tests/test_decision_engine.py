import pytest
from app.engine.decision import run_decision_engine

def test_decision_engine_verified():
    # When official issuer confirms and no hard integrity failures
    checks = [
        {"check_type": "PAN_SYNTAX_VALIDATION", "status": "PASS"},
        {"check_type": "ITD_OFFICIAL_VERIFICATION", "status": "PASS"}
    ]
    tamper = {"tamper_score": 12.0, "has_tamper_signal": False, "is_low_quality": False}
    
    decision = run_decision_engine("PAN", checks, mismatches=[], tamper_result=tamper, authority_matched=True)
    assert decision["decision"] == "VERIFIED"
    assert decision["confidence"] == "HIGH"
    assert decision["risk_score"] < 40.0

def test_decision_engine_invalid_on_mismatch():
    # When cross-field mismatch is detected
    checks = [{"check_type": "PAN_SYNTAX_VALIDATION", "status": "PASS"}]
    mismatches = ["Visible name initial does not match 5th PAN character"]
    tamper = {"tamper_score": 15.0, "has_tamper_signal": False, "is_low_quality": False}
    
    decision = run_decision_engine("PAN", checks, mismatches=mismatches, tamper_result=tamper, authority_matched=False)
    assert decision["decision"] == "INVALID / POSSIBLE TAMPERING"
    assert decision["risk_score"] >= 70.0

def test_decision_engine_unable_to_verify_fallback():
    # When document looks normal but no authoritative registry source can confirm
    checks = [{"check_type": "PAN_SYNTAX_VALIDATION", "status": "PASS"}]
    tamper = {"tamper_score": 10.0, "has_tamper_signal": False, "is_low_quality": False}
    
    decision = run_decision_engine("PAN", checks, mismatches=[], tamper_result=tamper, authority_matched=False)
    # Must NOT invent fake/genuine!
    assert decision["decision"] == "UNABLE_TO_VERIFY"

def test_decision_engine_low_quality():
    # PDF 2 Section 7: Low image quality -> Unreadable -> Unable to verify; do not call fake
    checks = [{"check_type": "PAN_SYNTAX_VALIDATION", "status": "WARN"}]
    tamper = {"tamper_score": 20.0, "has_tamper_signal": False, "is_low_quality": True}
    
    decision = run_decision_engine("PAN", checks, mismatches=[], tamper_result=tamper, authority_matched=False)
    assert decision["decision"] == "UNABLE_TO_VERIFY"
    assert "low" in decision["reason"].lower() or "unreadable" in decision["reason"].lower()
