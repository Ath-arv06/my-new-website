from typing import Dict, Any, List
from app.engine.rules import evaluate_evidence

def run_decision_engine(
    document_type: str,
    checks: List[Dict[str, Any]],
    mismatches: List[str],
    tamper_result: Dict[str, Any],
    authority_matched: bool = False
) -> Dict[str, Any]:
    """
    Deterministic Three-State Decision Engine (PDF 2 Section 7):
    - VERIFIED
    - INVALID / POSSIBLE TAMPERING
    - UNABLE_TO_VERIFY
    """
    tamper_score = tamper_result.get("tamper_score", 0.0)
    eval_res = evaluate_evidence(checks, mismatches, tamper_score)
    hard_failures = eval_res["hard_failures"]
    supporting_negatives = eval_res["supporting_negatives"]

    # PDF 2 Section 7: Low image quality -> Unable to verify; do not call fake
    if tamper_result.get("is_low_quality"):
        return {
            "decision": "UNABLE_TO_VERIFY",
            "reason": "Image resolution is too low or unreadable for conclusive verification",
            "risk_score": 50.0,
            "confidence": "LOW",
            "hard_failures": hard_failures,
            "supporting_negatives": supporting_negatives
        }

    # Rule 1: Hard failures detected (cryptographic QR invalid, digital signature invalid, or data mismatch)
    if hard_failures:
        reasons_joined = "; ".join(hard_failures)
        return {
            "decision": "INVALID / POSSIBLE TAMPERING",
            "reason": f"Decisive integrity failure detected: {reasons_joined}",
            "risk_score": min(98.0, 75.0 + len(hard_failures) * 8.0),
            "confidence": "HIGH",
            "hard_failures": hard_failures,
            "supporting_negatives": supporting_negatives
        }

    # Rule 2: Trusted issuer verification == PASS AND no hard integrity failure
    if authority_matched:
        return {
            "decision": "VERIFIED",
            "reason": "Confirmed against authoritative government issuer registry with cryptographic and structural validation",
            "risk_score": max(5.0, 10.0 + tamper_score * 0.1),
            "confidence": "HIGH",
            "hard_failures": [],
            "supporting_negatives": supporting_negatives
        }

    # Rule 3: Default / Unverified fallback
    # "If no authoritative source is available, return Unable to Verify rather than automatically declaring it fake."
    supporting_note = f" Supporting signals: {'; '.join(supporting_negatives)}" if supporting_negatives else ""
    return {
        "decision": "UNABLE_TO_VERIFY",
        "reason": f"No authoritative issuer response or valid cryptographic offline signature available.{supporting_note}",
        "risk_score": round(min(65.0, 45.0 + tamper_score * 0.3), 1),
        "confidence": "MODERATE",
        "hard_failures": [],
        "supporting_negatives": supporting_negatives
    }
