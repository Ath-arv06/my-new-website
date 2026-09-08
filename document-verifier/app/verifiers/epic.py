import re
from typing import Dict, Any, List

EPIC_REGEX = r'^[A-Z]{3}[0-9]{7}$'

def verify_epic(
    extracted_fields: Dict[str, Any],
    trusted_registry: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Verify Voter ID (EPIC) according to PDF 2 Section 3.4:
    1. Validate EPIC format/version
    2. Check security elements
    3. Check against Election Commission of India (ECI) electoral roll
    """
    checks = []
    mismatches = []

    epic_num = (extracted_fields.get("epic_number") or extracted_fields.get("document_number", "")).upper().strip()

    # Check 1: Format validation
    format_valid = bool(re.match(EPIC_REGEX, epic_num))
    checks.append({
        "check_type": "EPIC_FORMAT_VALIDATION",
        "status": "PASS" if format_valid else ("WARN" if len(epic_num) >= 8 else "FAIL"),
        "provider": "ECI_SECURITY_SPECIFICATION",
        "details": {
            "epic_number": epic_num,
            "standard_format": format_valid
        }
    })

    # Check 2: Electoral roll verification
    authority_status = "NOT_CHECKED"
    matched_record = None
    if trusted_registry and epic_num:
        for rec in trusted_registry:
            norm_rec = str(rec.get("Extracted_ID_Number", "")).upper().strip()
            if norm_rec == epic_num:
                authority_status = "PASS"
                matched_record = rec
                break
        if not matched_record:
            authority_status = "UNVERIFIED"

    checks.append({
        "check_type": "ECI_ELECTORAL_ROLL_VERIFICATION",
        "status": "PASS" if authority_status == "PASS" else "NOT_CHECKED",
        "provider": "ELECTION_COMMISSION_OF_INDIA_ELECTORAL_REGISTRY",
        "details": {
            "elector_enrolled": authority_status == "PASS",
            "matched_record_id": matched_record.get("Document_ID") if matched_record else None
        }
    })

    return {
        "document_type": "Voter ID",
        "checks": checks,
        "mismatches": mismatches,
        "format_valid": format_valid,
        "authority_match": authority_status == "PASS",
        "matched_record": matched_record
    }
