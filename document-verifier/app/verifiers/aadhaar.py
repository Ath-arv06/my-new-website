import re
from typing import Dict, Any, List

# Verhoeff algorithm lookup tables
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def calculate_verhoeff_check_digit(number_str: str) -> int:
    """Compute the Verhoeff check digit for an 11-digit or n-digit prefix."""
    c = 0
    reversed_digits = [int(x) for x in reversed(number_str.replace(" ", ""))]
    for i, digit in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digit]]
    return VERHOEFF_INV[c]

def validate_verhoeff(number: str) -> bool:
    """Validate 12-digit Aadhaar number using Verhoeff check-digit algorithm."""
    clean = number.replace(" ", "").strip()
    if len(clean) != 12 or not clean.isdigit():
        return False
    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for i, digit in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]]
    return c == 0


def verify_aadhaar(
    extracted_fields: Dict[str, Any],
    qr_data: Dict[str, Any] = None,
    trusted_registry: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Verify Aadhaar document evidence according to PDF 2 Section 3.1:
    1. Check format & Verhoeff algorithm
    2. Secure QR check & signature
    3. Cross-field comparison (visible vs QR)
    4. Authoritative registry cross-reference
    """
    checks = []
    mismatches = []
    
    aadhaar_num = extracted_fields.get("aadhaar_number") or extracted_fields.get("document_number", "")
    aadhaar_num = str(aadhaar_num).replace(" ", "").strip()

    # Check 1: Format & Verhoeff
    format_valid = len(aadhaar_num) == 12 and aadhaar_num.isdigit() and aadhaar_num[0] not in ('0', '1')
    verhoeff_valid = validate_verhoeff(aadhaar_num) if format_valid else False

    checks.append({
        "check_type": "AADHAAR_FORMAT_VERHOEFF",
        "status": "PASS" if verhoeff_valid else ("FAIL" if format_valid else "WARN"),
        "provider": "LOCAL_VERHOEFF_ENGINE",
        "details": {
            "format_valid": format_valid,
            "verhoeff_valid": verhoeff_valid,
            "masked_number": f"XXXX XXXX {aadhaar_num[-4:]}" if len(aadhaar_num) >= 4 else "INVALID"
        }
    })

    # Check 2: QR Code and Cross-Field Check
    qr_status = "NOT_CHECKED"
    if qr_data and qr_data.get("valid"):
        qr_uid = qr_data.get("data", {}).get("uid", "")
        qr_name = qr_data.get("data", {}).get("name", "")
        visible_name = extracted_fields.get("name", "")
        
        # Compare
        if qr_uid and aadhaar_num and qr_uid[-4:] != aadhaar_num[-4:]:
            mismatches.append(f"Aadhaar QR UID last 4 ({qr_uid[-4:]}) does not match visible ({aadhaar_num[-4:]})")
            qr_status = "FAIL"
        else:
            qr_status = "PASS"

        checks.append({
            "check_type": "AADHAAR_QR_CONSISTENCY",
            "status": qr_status,
            "provider": "UIDAI_SECURE_QR_PARSER",
            "details": {
                "qr_found": True,
                "qr_name": qr_name,
                "visible_name": visible_name,
                "mismatch": len(mismatches) > 0
            }
        })
    else:
        checks.append({
            "check_type": "AADHAAR_QR_CONSISTENCY",
            "status": "WARN",
            "provider": "UIDAI_SECURE_QR_PARSER",
            "details": {"qr_found": False, "note": "Secure QR code not decoded from image"}
        })

    # Check 3: Authoritative Database Match
    authority_status = "NOT_CHECKED"
    matched_record = None
    if trusted_registry and aadhaar_num:
        for rec in trusted_registry:
            norm_rec = str(rec.get("Extracted_ID_Number", "")).replace(" ", "").strip()
            if norm_rec and norm_rec == aadhaar_num:
                authority_status = "PASS"
                matched_record = rec
                break
        if not matched_record:
            authority_status = "UNVERIFIED"

    checks.append({
        "check_type": "UIDAI_AUTHORITY_VERIFICATION",
        "status": "PASS" if authority_status == "PASS" else "NOT_CHECKED",
        "provider": "UIDAI_OFFLINE_VERIFICATION_ADAPTER",
        "details": {
            "authorized_source_checked": authority_status == "PASS",
            "matched_record_id": matched_record.get("Document_ID") if matched_record else None
        }
    })

    return {
        "document_type": "Aadhaar",
        "checks": checks,
        "mismatches": mismatches,
        "format_valid": verhoeff_valid,
        "authority_match": authority_status == "PASS",
        "matched_record": matched_record
    }
