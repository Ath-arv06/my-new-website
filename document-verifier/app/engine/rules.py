from typing import Dict, Any, List

# Signal definitions and weights (PDF 2 Section 7)
SIGNAL_WEIGHTS = {
    "ISSUER_VERIFICATION_PASS": {"impact": "STRONG_POSITIVE", "score_delta": -50.0},
    "DIGITAL_SIGNATURE_PASS": {"impact": "STRONG_POSITIVE", "score_delta": -40.0},
    "SECURE_QR_PASS": {"impact": "STRONG_POSITIVE", "score_delta": -35.0},
    "MRZ_CHECK_PASS": {"impact": "POSITIVE", "score_delta": -25.0},
    "FORMAT_SYNTAX_PASS": {"impact": "POSITIVE", "score_delta": -15.0},
    
    # Hard Failures
    "ISSUER_DATA_MISMATCH": {"impact": "HARD_NEGATIVE", "score_delta": +60.0},
    "DIGITAL_SIGNATURE_INVALID": {"impact": "HARD_NEGATIVE", "score_delta": +70.0},
    "SECURE_QR_INVALID": {"impact": "HARD_NEGATIVE", "score_delta": +65.0},
    "CROSS_FIELD_MISMATCH": {"impact": "HARD_NEGATIVE", "score_delta": +55.0},
    
    # Supporting Signals
    "TAMPER_ELA_HIGH_ANOMALY": {"impact": "SUPPORTING_NEGATIVE", "score_delta": +25.0},
    "SUSPICIOUS_PDF_INCREMENTAL": {"impact": "SUPPORTING_NEGATIVE", "score_delta": +20.0},
    "LOW_RESOLUTION_UNREADABLE": {"impact": "INCONCLUSIVE", "score_delta": +10.0}
}

def evaluate_evidence(checks: List[Dict[str, Any]], mismatches: List[str], tamper_score: float) -> Dict[str, Any]:
    """
    Evaluate collected evidence signals according to PDF 2 Section 7.
    Returns hard failures list, supporting flags, and calculated base risk score.
    """
    hard_failures = []
    supporting_negatives = []
    positives = []
    
    # Check for mismatches
    if mismatches:
        hard_failures.append(f"Cross-field inconsistency: {'; '.join(mismatches)}")

    # Check verification checks list
    for c in checks:
        ctype = c.get("check_type", "")
        status = c.get("status", "")

        if status == "FAIL":
            if "FORMAT" in ctype or "SYNTAX" in ctype or "MRZ" in ctype:
                hard_failures.append(f"Format/Syntax failure in {ctype}")
            elif "SIGNATURE" in ctype or "QR" in ctype:
                hard_failures.append(f"Cryptographic check failure in {ctype}")
            elif "AUTHORITY" in ctype or "VERIFICATION" in ctype:
                hard_failures.append(f"Official registry mismatch in {ctype}")
        elif status == "PASS":
            positives.append(ctype)

    if tamper_score > 60.0:
        supporting_negatives.append(f"High digital alteration anomaly detected (Tamper score: {tamper_score:.1f})")

    return {
        "hard_failures": hard_failures,
        "supporting_negatives": supporting_negatives,
        "positives": positives
    }
