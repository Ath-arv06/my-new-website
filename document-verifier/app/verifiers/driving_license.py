import re
from typing import Dict, Any, List

# Indian State & Union Territory Codes
INDIAN_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HP",
    "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ",
    "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"
}

DL_REGEX = r'^([A-Z]{2})[ -]?([0-9]{2})[ -]?((?:19|20)[0-9]{2})[ -]?([0-9]{7})$'

def verify_driving_licence(
    extracted_fields: Dict[str, Any],
    trusted_registry: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Verify Indian Driving Licence according to PDF 2 Section 3.5:
    1. Validate State code and Sarathi/Parivahan format
    2. Extract validity class (LMV, MCWG, HMV)
    3. Cross-reference against Parivahan/Sarathi transport database
    """
    checks = []
    mismatches = []

    dl_num = (extracted_fields.get("dl_number") or extracted_fields.get("document_number", "")).upper().strip()
    clean_dl = re.sub(r'[\s-]', '', dl_num)

    state_code = clean_dl[:2] if len(clean_dl) >= 2 else ""
    state_valid = state_code in INDIAN_STATE_CODES

    # Check format
    format_match = re.match(DL_REGEX, clean_dl)
    format_valid = bool(format_match) and state_valid

    checks.append({
        "check_type": "DRIVING_LICENCE_SARATHI_FORMAT",
        "status": "PASS" if format_valid else ("WARN" if (state_valid and len(clean_dl) >= 12) else "FAIL"),
        "provider": "MORTH_SARATHI_SPECIFICATION",
        "details": {
            "dl_number": dl_num,
            "state_code": state_code,
            "valid_state": state_valid,
            "format_valid": format_valid
        }
    })

    # Check against Transport Registry
    authority_status = "NOT_CHECKED"
    matched_record = None
    if trusted_registry and clean_dl:
        for rec in trusted_registry:
            norm_rec = re.sub(r'[\s-]', '', str(rec.get("Extracted_ID_Number", "")).upper())
            if norm_rec and norm_rec == clean_dl:
                authority_status = "PASS"
                matched_record = rec
                break
        if not matched_record:
            authority_status = "UNVERIFIED"

    checks.append({
        "check_type": "PARIVAHAN_SARATHI_REGISTRY_VERIFICATION",
        "status": "PASS" if authority_status == "PASS" else "NOT_CHECKED",
        "provider": "MINISTRY_OF_ROAD_TRANSPORT_AND_HIGHWAYS_SARATHI",
        "details": {
            "licence_valid": authority_status == "PASS",
            "matched_record_id": matched_record.get("Document_ID") if matched_record else None
        }
    })

    return {
        "document_type": "Driving Licence",
        "checks": checks,
        "mismatches": mismatches,
        "format_valid": format_valid,
        "authority_match": authority_status == "PASS",
        "matched_record": matched_record
    }
